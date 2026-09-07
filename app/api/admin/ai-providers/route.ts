import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { decryptApiKey, encryptApiKey, keyHint } from "@/lib/ai-key-crypto";
import { discoverModels, type AiProvider } from "@/lib/ai-providers";
import { authOptions, isAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const providers = ["GEMINI", "OPENAI", "ANTHROPIC", "XAI"] as const;
const providerSchema = z.enum(providers);

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add-key"),
    provider: providerSchema,
    label: z.string().trim().min(2).max(80),
    key: z.string().trim().min(8).max(1000),
  }),
  z.object({
    action: z.literal("update-key"),
    id: z.string().min(1),
    label: z.string().trim().min(2).max(80).optional(),
    enabled: z.boolean().optional(),
    priority: z.number().int().min(0).max(1000).optional(),
  }),
  z.object({
    action: z.literal("update-provider"),
    provider: providerSchema,
    enabled: z.boolean(),
    priority: z.number().int().min(0).max(1000),
    selectedModel: z.string().trim().min(1).max(200),
    maxOutputTokens: z.number().int().min(100).max(8192),
    dailyRequestLimit: z.number().int().min(1).max(10000),
  }),
  z.object({ action: z.literal("test-key"), id: z.string().min(1) }),
  z.object({
    action: z.literal("discover-models"),
    provider: providerSchema,
    keyId: z.string().min(1).optional(),
  }),
]);

async function accessDenied() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

async function ensureProviders() {
  await Promise.all(providers.map((provider, priority) =>
    prisma.aiProviderConfig.upsert({
      where: { provider },
      update: {},
      create: {
        provider,
        priority,
        enabled: provider === "GEMINI",
        selectedModel: provider === "GEMINI" ? "gemini-3.5-flash-lite" : null,
      },
    }),
  ));
}

async function sanitizedState() {
  await ensureProviders();
  return prisma.aiProviderConfig.findMany({
    orderBy: { priority: "asc" },
    select: {
      provider: true,
      enabled: true,
      priority: true,
      selectedModel: true,
      maxOutputTokens: true,
      dailyRequestLimit: true,
      keys: {
        orderBy: { priority: "asc" },
        select: {
          id: true,
          label: true,
          keyHint: true,
          enabled: true,
          priority: true,
          lastTestedAt: true,
          lastTestStatus: true,
        },
      },
    },
  });
}

function stateResponse(status = 200) {
  return sanitizedState().then((state) => NextResponse.json({ providers: state }, { status }));
}

export async function GET() {
  const denied = await accessDenied();
  if (denied) return denied;
  return stateResponse();
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const denied = await accessDenied();
    if (denied) return denied;
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    await ensureProviders();

    if (parsed.data.action === "add-key") {
      const provider = await prisma.aiProviderConfig.findUniqueOrThrow({ where: { provider: parsed.data.provider } });
      const priority = await prisma.aiApiKey.count({ where: { providerId: provider.id } });
      await prisma.aiApiKey.create({
        data: {
          providerId: provider.id,
          label: parsed.data.label,
          ...encryptApiKey(parsed.data.key),
          keyHint: keyHint(parsed.data.key),
          priority,
        },
      });
      return stateResponse(201);
    }

    if (parsed.data.action === "update-key") {
      const { action: _action, id, ...data } = parsed.data;
      void _action;
      await prisma.aiApiKey.update({ where: { id }, data });
      return stateResponse();
    }

    if (parsed.data.action === "update-provider") {
      const { action: _action, provider, ...data } = parsed.data;
      void _action;
      await prisma.aiProviderConfig.update({ where: { provider }, data });
      return stateResponse();
    }

    const requestedKeyId = parsed.data.action === "test-key" ? parsed.data.id : parsed.data.keyId;
    const storedKey = requestedKeyId
      ? await prisma.aiApiKey.findUnique({ where: { id: requestedKeyId }, include: { provider: true } })
      : parsed.data.action === "test-key"
        ? null
        : await prisma.aiApiKey.findFirst({
            where: { provider: { provider: parsed.data.provider }, enabled: true },
            orderBy: { priority: "asc" },
            include: { provider: true },
          });
    const providerName = (storedKey?.provider.provider ?? (parsed.data.action === "discover-models" ? parsed.data.provider : undefined)) as AiProvider | undefined;
    const apiKey = storedKey
      ? decryptApiKey(storedKey)
      : providerName === "GEMINI"
        ? process.env.GEMINI_API_KEY
        : undefined;
    if (!providerName || !apiKey) return NextResponse.json({ error: "Add an enabled provider key first." }, { status: 400 });

    try {
      const models = await discoverModels(providerName, apiKey);
      if (parsed.data.action === "test-key" && storedKey) {
        await prisma.aiApiKey.update({ where: { id: storedKey.id }, data: { lastTestedAt: new Date(), lastTestStatus: "PASS" } });
      }
      return NextResponse.json({ models, providers: await sanitizedState() });
    } catch {
      if (parsed.data.action === "test-key" && storedKey) {
        await prisma.aiApiKey.update({ where: { id: storedKey.id }, data: { lastTestedAt: new Date(), lastTestStatus: "FAIL" } });
      }
      return NextResponse.json({ error: "The provider rejected this key or could not list models.", requestId }, { status: 502 });
    }
  } catch {
    console.error(`[ai-providers:${requestId}] Admin action failed`);
    return NextResponse.json(
      { error: "Provider configuration could not be updated.", requestId },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const denied = await accessDenied();
    if (denied) return denied;
    const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    await prisma.aiApiKey.delete({ where: { id: parsed.data.id } });
    return stateResponse();
  } catch {
    console.error(`[ai-providers:${requestId}] Revoke failed`);
    return NextResponse.json({ error: "Provider key could not be revoked.", requestId }, { status: 500 });
  }
}

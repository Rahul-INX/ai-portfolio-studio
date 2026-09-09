import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { encryptApiKey, keyHint } from "@/lib/ai-key-crypto";
import { authOptions, isAdminSession } from "@/lib/auth";
import { jobFitResearchProviders } from "@/lib/job-fit-research-credentials";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const providerSchema = z.enum(jobFitResearchProviders);
const saveSchema = z.object({ provider: providerSchema, key: z.string().trim().min(8).max(1000) });

async function denied() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

async function state() {
  const credentials = await prisma.jobFitCredential.findMany({ orderBy: { provider: "asc" }, select: { provider: true, keyHint: true, enabled: true, updatedAt: true } });
  return NextResponse.json({ credentials });
}

export async function GET() {
  const error = await denied();
  if (error) return error;
  try { return await state(); } catch { return NextResponse.json({ error: "Apply the Job Fit database schema before managing research keys." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const error = await denied();
  if (error) return error;
  const parsed = saveSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    await prisma.jobFitCredential.upsert({
      where: { provider: parsed.data.provider },
      update: { ...encryptApiKey(parsed.data.key), keyHint: keyHint(parsed.data.key), enabled: true },
      create: { provider: parsed.data.provider, ...encryptApiKey(parsed.data.key), keyHint: keyHint(parsed.data.key) },
    });
    return state();
  } catch {
    return NextResponse.json({ error: "Research key could not be saved. Apply the Job Fit database schema and confirm AI_KEYS_ENCRYPTION_KEY." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const error = await denied();
  if (error) return error;
  const parsed = z.object({ provider: providerSchema }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try { await prisma.jobFitCredential.delete({ where: { provider: parsed.data.provider } }); return state(); }
  catch { return NextResponse.json({ error: "Research key could not be removed." }, { status: 503 }); }
}

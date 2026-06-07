import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getJobFitSettings, normalizeJobFitTimeout } from "@/lib/job-fit-settings";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  deterministicFallbackEnabled: z.boolean(),
  fallbackTimeoutSeconds: z.number().int().min(5).max(120)
});

async function isAuthorized() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user?.id);
}

export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ settings: await getJobFitSettings() });
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is required to save settings." }, { status: 503 });
  }

  const parsed = settingsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await prisma.jobFitSettings.upsert({
    where: { id: "main" },
    update: {
      deterministicFallbackEnabled: parsed.data.deterministicFallbackEnabled,
      fallbackTimeoutSeconds: normalizeJobFitTimeout(parsed.data.fallbackTimeoutSeconds)
    },
    create: {
      id: "main",
      deterministicFallbackEnabled: parsed.data.deterministicFallbackEnabled,
      fallbackTimeoutSeconds: normalizeJobFitTimeout(parsed.data.fallbackTimeoutSeconds)
    }
  });

  return NextResponse.json({ settings });
}

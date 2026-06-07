import { prisma } from "@/lib/prisma";
import { canReadDatabase, markDatabaseUnavailable } from "@/lib/database-availability";

export type JobFitSettings = {
  id: string;
  deterministicFallbackEnabled: boolean;
  fallbackTimeoutSeconds: number;
};

export const defaultJobFitSettings: JobFitSettings = {
  id: "main",
  deterministicFallbackEnabled: true,
  fallbackTimeoutSeconds: 45
};

export function normalizeJobFitTimeout(value: number) {
  return Math.min(120, Math.max(5, Math.round(value)));
}

export async function getJobFitSettings(): Promise<JobFitSettings> {
  if (!canReadDatabase()) return defaultJobFitSettings;

  try {
    const settings = await prisma.jobFitSettings.findUnique({ where: { id: "main" } });
    return settings
      ? {
          id: settings.id,
          deterministicFallbackEnabled: settings.deterministicFallbackEnabled,
          fallbackTimeoutSeconds: normalizeJobFitTimeout(settings.fallbackTimeoutSeconds)
        }
      : defaultJobFitSettings;
  } catch (error) {
    markDatabaseUnavailable(error);
    return defaultJobFitSettings;
  }
}

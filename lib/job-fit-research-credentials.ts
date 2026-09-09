import { decryptApiKey } from "@/lib/ai-key-crypto";

export const jobFitResearchProviders = ["TAVILY", "SCRAPE_DO"] as const;
export type JobFitResearchProvider = (typeof jobFitResearchProviders)[number];

const environmentKey: Record<JobFitResearchProvider, string> = {
  TAVILY: "TAVILY_API_KEY",
  SCRAPE_DO: "SCRAPE_DO_API_KEY",
};

export async function resolveJobFitResearchCredentials() {
  const credentials: Partial<Record<JobFitResearchProvider, string>> = {};
  if (process.env.DATABASE_URL && process.env.AI_KEYS_ENCRYPTION_KEY) {
    try {
      const { prisma } = await import("@/lib/prisma");
      const stored = await prisma.jobFitCredential.findMany({ where: { enabled: true } });
      for (const credential of stored) credentials[credential.provider] = decryptApiKey(credential);
    } catch {
      // The environment fallback keeps public matching available during local schema bootstrap.
    }
  }
  for (const provider of jobFitResearchProviders) {
    if (!credentials[provider] && process.env[environmentKey[provider]]) credentials[provider] = process.env[environmentKey[provider]];
  }
  return credentials;
}

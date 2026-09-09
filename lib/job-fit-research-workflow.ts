import { analyzeJobFitResearch, collectJobFitResearch } from "@/lib/job-fit-research";
import { resolveJobFitResearchCredentials } from "@/lib/job-fit-research-credentials";
import { beginJobFitResearch, finishJobFitResearch } from "@/lib/job-fit-store";

async function begin(inquiryId: string) {
  "use step";
  return beginJobFitResearch(inquiryId);
}

async function research(input: { company: string | null; role: string | null; location: string | null }) {
  "use step";
  const credentials = await resolveJobFitResearchCredentials();
  return collectJobFitResearch(input, { tavilyKey: credentials.TAVILY, scrapeDoKey: credentials.SCRAPE_DO });
}

async function analyze(candidate: Parameters<typeof analyzeJobFitResearch>[0], sources: Awaited<ReturnType<typeof collectJobFitResearch>>) {
  "use step";
  try { return await analyzeJobFitResearch(candidate, sources); }
  catch { return { ...sources, status: "failed" as const, insights: [], note: "Sources were collected, but the cited recruiter analysis could not be completed." }; }
}

async function finish(inquiryId: string, result: Parameters<typeof finishJobFitResearch>[1]) {
  "use step";
  return finishJobFitResearch(inquiryId, result);
}

export async function runJobFitResearch(inquiryId: string) {
  "use workflow";
  const metadata = await begin(inquiryId);
  if (!metadata) return { completed: false };
  const sources = await research(metadata);
  const result = await analyze(metadata.coreResult, sources);
  return { completed: await finish(inquiryId, result) };
}

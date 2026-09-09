import type { JobFitMetadata } from "@/lib/job-fit-intelligence";
import type { JobFitIntelligenceResult } from "@/lib/job-fit-intelligence";
import { runJsonWithFallback } from "@/lib/ai-providers";
import { z } from "zod";

type ResearchCategory = "company" | "role" | "adjacent-openings" | "market";
type Citation = { title: string; url: string; excerpt: string; sourceTier: "official" | "market" | "discovery"; categories: ResearchCategory[]; retrievedAt: string };
type Fetcher = typeof fetch;

const researchAnalysisSchema = z.object({
  insights: z.array(z.object({
    heading: z.string().trim().min(4).max(80),
    analysis: z.string().trim().min(40).max(420),
    implication: z.string().trim().min(30).max(280),
    citations: z.array(z.string().url()).min(1).max(3),
  })).min(2).max(4),
});

export function groundResearchInsights(
  insights: z.infer<typeof researchAnalysisSchema>["insights"],
  citations: Array<{ url: string }>,
) {
  const allowedUrls = new Set(citations.map((source) => source.url));
  return insights.map((insight) => ({
    ...insight,
    citations: [...new Set(insight.citations.filter((url) => allowedUrls.has(url)))],
  })).filter((insight) => insight.citations.length > 0);
}

function isPublicHttps(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return host !== "localhost" && !host.endsWith(".local") && !/^127\./.test(host) && !/^10\./.test(host) && !/^192\.168\./.test(host) && !/^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
  } catch { return false; }
}

function excerpt(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 420);
}

function sourceTier(url: string, company: string | null): Citation["sourceTier"] {
  const host = new URL(url).hostname.toLowerCase();
  const companyToken = company?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  if (companyToken && host.replace(/[^a-z0-9]/g, "").includes(companyToken)) return "official";
  if (/(gov|bureau|oecd|weforum|linkedin\.com|indeed\.com)/.test(host)) return "market";
  return "discovery";
}

function researchQueries(metadata: Pick<JobFitMetadata, "company" | "role" | "location">): Array<{ category: ResearchCategory; query: string }> {
  const role = metadata.role ?? "role";
  const location = metadata.location ?? "";
  const company = metadata.company ?? "";
  return [
    ...(company ? [{ category: "company" as const, query: `${company} products strategy plans funding engineering` }] : []),
    { category: "role" as const, query: [company, role, location, "responsibilities skills careers"].filter(Boolean).join(" ") },
    { category: "adjacent-openings" as const, query: [company, role, location, "careers open roles jobs"].filter(Boolean).join(" ") },
    { category: "market" as const, query: [role, location, "skills demand hiring market outlook"].filter(Boolean).join(" ") },
  ];
}

export async function collectJobFitResearch(
  metadata: Pick<JobFitMetadata, "company" | "role" | "location">,
  options: { tavilyKey?: string; scrapeDoKey?: string; fetcher?: Fetcher } = {},
): Promise<{ status: "not-configured" | "complete" | "failed"; citations: Citation[]; note: string }> {
  if (!options.tavilyKey) return { status: "not-configured", citations: [], note: "Add a Tavily key to enable cited market and company research." };
  const fetcher = options.fetcher ?? fetch;
  const searches = await Promise.allSettled(researchQueries(metadata).map(async ({ category, query }) => {
    const response = await fetcher("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${options.tavilyKey}` },
      body: JSON.stringify({ query, search_depth: "basic", max_results: 10, include_raw_content: false }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`Tavily returned ${response.status}`);
    const payload = await response.json() as { results?: Array<{ title?: string; url?: string; content?: string }> };
    return { category, candidates: (payload.results ?? []).flatMap((item) => item.url && item.title && isPublicHttps(item.url) ? [{ title: item.title, url: item.url, content: item.content ?? "" }] : []) };
  }));
  const successful = searches.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  if (!successful.length) return { status: "failed", citations: [], note: "Live research could not complete. The fit score remains portfolio-only." };
  try {
    const candidates = new Map<string, { title: string; url: string; content: string; categories: ResearchCategory[] }>();
    for (const search of successful) for (const item of search.candidates) {
      const existing = candidates.get(item.url);
      if (existing) existing.categories.push(search.category);
      else candidates.set(item.url, { ...item, categories: [search.category] });
    }
    const citations: Citation[] = [];
    for (const item of candidates.values()) {
      let content = item.content;
      const tier = sourceTier(item.url, metadata.company);
      if (tier === "official" && options.scrapeDoKey) {
        const scrape = await fetcher(`https://api.scrape.do/?token=${encodeURIComponent(options.scrapeDoKey)}&url=${encodeURIComponent(item.url)}`, { signal: AbortSignal.timeout(12_000) });
        if (scrape.ok) content = await scrape.text();
      }
      if (!excerpt(content)) continue;
      citations.push({ title: item.title, url: item.url, excerpt: excerpt(content), sourceTier: tier, categories: item.categories, retrievedAt: new Date().toISOString() });
    }
    return { status: "complete", citations, note: citations.length ? `Citations cover ${successful.map((search) => search.category.replace(/-/g, " ")).join(", ")} research.` : "Research completed without a usable public source." };
  } catch {
    return { status: "failed", citations: [], note: "Live research could not complete. The fit score remains portfolio-only." };
  }
}

export async function analyzeJobFitResearch(
  candidate: JobFitIntelligenceResult,
  research: Awaited<ReturnType<typeof collectJobFitResearch>>,
) {
  if (research.status !== "complete" || !research.citations.length) return { ...research, insights: [] };
  const context = {
    role: candidate.metadata,
    verdict: candidate.audit.verdict,
    fitScore: candidate.audit.overallScore,
    dimensions: candidate.audit.dimensions.map(({ name, score, priority, rationale }) => ({ name, score, priority, rationale })),
    strengths: candidate.audit.topEvidence.map(({ title, matchReason }) => ({ title, matchReason })),
    gaps: candidate.audit.gaps,
  };
  const response = await runJsonWithFallback({
    system: `Write a concise recruiter-facing market analysis of Rahul's fit for this role using only the supplied candidate assessment and public research sources.

Return 2 to 4 distinct insights. Each insight must explain a concrete external signal, connect it to Rahul's evidenced strength or gap, and state the practical hiring or interview implication. Prefer official company and role sources over generic career advice. Do not invent facts, metrics, candidate percentiles, or citations. Citation URLs must be copied exactly from the supplied sources.`,
    messages: [{ role: "user", content: `Candidate assessment:\n${JSON.stringify(context)}\n\nAllowed research sources:\n${JSON.stringify(research.citations)}` }],
    temperature: 0.1,
    jsonSchema: z.toJSONSchema(researchAnalysisSchema),
    timeoutMs: 60_000,
    enforceQuota: true,
  }, researchAnalysisSchema);
  const insights = groundResearchInsights(response.value.insights, research.citations);
  if (insights.length < 2) throw new Error("Research analysis was not grounded in the collected sources.");
  return { ...research, insights };
}

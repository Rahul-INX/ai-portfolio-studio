import { buildJobRubric, deterministicJobFit, type JobFitResult } from "@/lib/job-fit";
import type { ContextEvidence } from "@/lib/site-context";

export type JobFitRequirementEvidence = {
  requirement: string;
  category: string;
  priority: string;
  evidence: Array<{
    title: string;
    url: string;
    kind: string;
    excerpt: string;
    matchedSignals: string[];
  }>;
};

export type JobFitMetadata = {
  company: string | null;
  role: string | null;
  location: string | null;
  requirements: ReturnType<typeof buildJobRubric>;
};

export type JobFitIntelligenceResult = {
  version: "job-fit-intelligence-v1";
  summary: string;
  metadata: Omit<JobFitMetadata, "requirements"> & { requirementCount: number };
  scoring: {
    fitScore: number;
    evidenceConfidence: number;
    marketLeverage: number | null;
    opportunityUpside: number | null;
  };
  audit: JobFitResult;
  requirementEvidence: JobFitRequirementEvidence[];
  advocacy: {
    label: "Why Rahul";
    claims: Array<{ text: string; citations: string[] }>;
  };
  research: {
    status: "not-configured" | "pending" | "complete" | "failed";
    citations: Array<{ title: string; url: string; excerpt: string; sourceTier: "official" | "market" | "discovery"; categories: Array<"company" | "role" | "adjacent-openings" | "market">; retrievedAt: string }>;
    insights: Array<{ heading: string; analysis: string; implication: string; citations: string[] }>;
    note: string;
  };
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function hasPhrase(value: string, phrase: string) {
  const haystack = ` ${normalize(value)} `;
  const needle = normalize(phrase);
  return needle.length > 0 && haystack.includes(` ${needle} `);
}

function isNegated(value: string, phrase: string) {
  const text = normalize(value);
  const escaped = normalize(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(?:\\bnot\\b|\\bno\\b|\\bwithout\\b|\\boptional\\b)(?:\\s+\\w+){0,4}\\s+${escaped}`).test(text)
    || new RegExp(`${escaped}(?:\\s+\\w+){0,4}\\s+(?:\\bis not\\b|\\bnot required\\b|\\boptional\\b)`).test(text);
}

function evidenceText(item: ContextEvidence) {
  return `${item.title} ${item.section ?? ""} ${item.summary} ${item.snippet} ${item.body} ${item.tags.join(" ")}`;
}

function metadataField(jd: string, labels: string[]) {
  const lines = jd.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const label = labels.find((candidate) => new RegExp(`^${candidate}\\s*[:\\-]`, "i").test(line));
    if (label) return line.replace(new RegExp(`^${label}\\s*[:\\-]\\s*`, "i"), "").slice(0, 120) || null;
  }
  return null;
}

export function extractJobFitMetadata(jdText: string): JobFitMetadata {
  const requirements = buildJobRubric(jdText).filter((requirement) =>
    requirement.aliases.some((alias) => hasPhrase(jdText, alias) && !isNegated(jdText, alias)),
  );
  const company = metadataField(jdText, ["company", "employer"])
    ?? jdText.match(/\bat\s+([A-Z][\w&.-]*(?:\s+[A-Z][\w&.-]*){0,3})/)?.[1]
    ?? null;
  const role = metadataField(jdText, ["role", "position", "title"])
    ?? jdText.match(/\b([A-Z][A-Za-z/& -]{2,80}?(?:Engineer|Developer|Scientist|Manager|Lead))\s+at\s+[A-Z]/)?.[1]
    ?? jdText.match(/\b(?:hiring|seeking)\s+(?:for\s+)?(?:a|an)?\s*([A-Z][\w /-]{3,80}(?:engineer|developer|scientist|manager|lead))/i)?.[1]
    ?? null;
  const location = metadataField(jdText, ["location", "work location"])
    ?? jdText.match(/\b(?:in|location)\s*[:,-]?\s*(Bengaluru|Bangalore|Mumbai|Delhi|Hyderabad|Pune|Remote|India)\b/i)?.[1]
    ?? null;
  return { company, role, location, requirements };
}

export function buildRequirementEvidenceLedger(jdText: string, evidence: ContextEvidence[]): JobFitRequirementEvidence[] {
  return extractJobFitMetadata(jdText).requirements.map((requirement) => {
    const matches = evidence
      .map((item) => {
        const source = evidenceText(item);
        const matchedSignals = requirement.aliases.filter((alias) => hasPhrase(source, alias));
        return { item, matchedSignals };
      })
      .filter(({ matchedSignals }) => matchedSignals.length > 0)
      .sort((a, b) => b.matchedSignals.length - a.matchedSignals.length || a.item.title.localeCompare(b.item.title));
    return {
      requirement: requirement.name,
      category: requirement.category,
      priority: requirement.priority,
      evidence: matches.map(({ item, matchedSignals }) => ({
        title: item.section ? `${item.title} - ${item.section}` : item.title,
        url: item.url,
        kind: item.kind,
        excerpt: item.snippet,
        matchedSignals,
      })),
    };
  });
}

export function buildJobFitIntelligenceResult(jdText: string, evidence: ContextEvidence[]): JobFitIntelligenceResult {
  const metadata = extractJobFitMetadata(jdText);
  const requirementEvidence = buildRequirementEvidenceLedger(jdText, evidence);
  const relevantEvidence = Array.from(new Map(requirementEvidence.flatMap((entry) => entry.evidence.map((item) => [item.url, item]))).values());
  const audit = deterministicJobFit(jdText, evidence, evidence);
  const claims = requirementEvidence
    .filter((entry) => entry.evidence.length > 0)
    .sort((a, b) => b.evidence.length - a.evidence.length)
    .slice(0, 3)
    .map((entry) => ({
      text: `${entry.requirement} is supported by ${entry.evidence.length} cited public portfolio source${entry.evidence.length === 1 ? "" : "s"}.`,
      citations: entry.evidence.map((item) => item.url),
    }));
  return {
    version: "job-fit-intelligence-v1",
    summary: `This is an evidence-led assessment of public portfolio evidence for ${metadata.role ?? "this role"}. It is not a hiring decision and does not infer unlisted experience.`,
    metadata: { company: metadata.company, role: metadata.role, location: metadata.location, requirementCount: metadata.requirements.length },
    scoring: {
      fitScore: audit.overallScore,
      evidenceConfidence: Math.round(Math.min(100, (relevantEvidence.length / Math.max(1, metadata.requirements.length * 2)) * 100)),
      marketLeverage: null,
      opportunityUpside: null,
    },
    audit,
    requirementEvidence,
    advocacy: { label: "Why Rahul", claims },
    research: {
      status: process.env.TAVILY_API_KEY || process.env.SCRAPE_DO_API_KEY ? "pending" : "not-configured",
      citations: [],
      insights: [],
      note: process.env.TAVILY_API_KEY || process.env.SCRAPE_DO_API_KEY
        ? "External role and company research is queued for the durable research worker."
        : "Add Tavily and Scrape.do credentials to enable cited market and company research.",
    },
  };
}

export function withFinalJobFitAudit(intelligence: JobFitIntelligenceResult, audit: JobFitResult): JobFitIntelligenceResult {
  return {
    ...intelligence,
    summary: audit.verdict,
    scoring: { ...intelligence.scoring, fitScore: audit.overallScore },
    audit,
  };
}

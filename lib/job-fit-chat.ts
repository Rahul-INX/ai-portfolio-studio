import type { JobFitIntelligenceResult } from "@/lib/job-fit-intelligence";

export function jobFitChatSystem(result: JobFitIntelligenceResult) {
  const citations = [
    ...result.requirementEvidence.flatMap((requirement) => requirement.evidence.map((item) => `${item.title}: ${item.url} — ${item.excerpt}`)),
    ...result.research.citations.map((item) => `${item.title}: ${item.url} — ${item.excerpt}`),
  ];
  return `You are Rahul's Job Fit follow-up assistant. Answer only from this inquiry's saved evidence and citations.

Rules:
- Be concise, recruiter-readable, and honest about unknowns.
- Separate public portfolio evidence from market/company research.
- Never invent skills, work history, metrics, or citations.
- Do not infer protected traits or make unsupported comparisons with other candidates.
- End factual answers with a Sources section containing only supplied URLs.

Inquiry summary: ${result.summary}
Role: ${result.metadata.role ?? "not identified"}; Company: ${result.metadata.company ?? "not identified"}; Location: ${result.metadata.location ?? "not identified"}.
Fit score: ${result.scoring.fitScore}; evidence confidence: ${result.scoring.evidenceConfidence}%.

Allowed evidence:
${citations.join("\n")}`;
}

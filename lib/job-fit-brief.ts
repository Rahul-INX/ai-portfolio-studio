import type { JobFitIntelligenceResult } from "@/lib/job-fit-intelligence";

function lines(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value)).join("\n");
}

export function renderJobFitRecruiterBrief(result: JobFitIntelligenceResult) {
  const citations = new Map<string, string>();
  const requirements = result.requirementEvidence.map((requirement) => {
    const evidence = requirement.evidence.map((item) => {
      citations.set(item.url, item.title);
      return `  - ${item.title}: ${item.url}`;
    });
    return lines([`- ${requirement.requirement} (${requirement.priority})`, evidence.length ? evidence.join("\n") : "  - No public portfolio evidence found."]);
  });
  for (const source of result.research.citations) citations.set(source.url, source.title);
  return lines([
    "# Job Fit Recruiter Brief",
    "",
    "Generated from the retained Job Fit evidence ledger.",
    `Role: ${result.metadata.role ?? "Not identified"}`,
    `Location: ${result.metadata.location ?? "Not identified"}`,
    "",
    "## Evidence-led assessment",
    result.summary,
    "",
    `Fit score: ${result.scoring.fitScore}/100`,
    `Evidence confidence: ${result.scoring.evidenceConfidence}/100`,
    "",
    "## Why Rahul",
    ...result.advocacy.claims.map((claim) => `- ${claim.text}`),
    "",
    "## Requirement evidence",
    ...requirements,
    "",
    "## Research",
    result.research.note,
    ...(result.research.insights ?? []).flatMap((insight) => [
      `### ${insight.heading}`,
      insight.analysis,
      `Hiring implication: ${insight.implication}`,
      ...insight.citations.map((url) => `- Source: ${citations.get(url) ?? url}: ${url}`),
    ]),
    "",
    "## Sources",
    ...Array.from(citations, ([url, title]) => `- ${title}: ${url}`),
  ]);
}

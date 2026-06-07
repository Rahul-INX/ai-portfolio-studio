import {
  buildRequirementAlignment,
  jobFitDimensionNames,
  jobFitResultSchema,
  verifiedEvidenceSignals,
  type JobFitResult
} from "@/lib/job-fit";
import type { ContextEvidence } from "@/lib/site-context";

export const resumeMatchAgent = {
  name: "Resume Match Specialist",
  version: "1.1"
} as const;

type ResumeMatchAgentInput = {
  jdText: string;
  evidence: ContextEvidence[];
  evidenceText: string;
  timeoutMs: number;
};

export type ResumeMatchAgentRun =
  | { ok: true; result: JobFitResult }
  | {
      ok: false;
      reason:
        | "missing-api-key"
        | "provider-error"
        | "empty-response"
        | "invalid-json"
        | "invalid-schema"
        | "ungrounded-output"
        | "timeout"
        | "unexpected-error";
      detail?: string;
    };

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return JSON.parse(trimmed);
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object returned.");
  return JSON.parse(match[0]);
}

function normalizedStatus(score: number) {
  if (score >= 74) return "Strong";
  if (score >= 52) return "Moderate";
  if (score >= 25) return "Limited";
  return "Missing";
}

function normalizeAgentResult(value: unknown) {
  if (!value || typeof value !== "object") return value;
  const candidate = value as Record<string, unknown>;
  const dimensions = Array.isArray(candidate.dimensions)
    ? candidate.dimensions.map((dimension, index) => {
        if (!dimension || typeof dimension !== "object") return dimension;
        const item = dimension as Record<string, unknown>;
        const score = typeof item.score === "number" ? item.score : Number(item.score);
        return {
          ...item,
          name: jobFitDimensionNames[index],
          score,
          status: normalizedStatus(score)
        };
      })
    : candidate.dimensions;

  return {
    ...candidate,
    dimensions,
    mode: "specialist-agent"
  };
}

function agentInstructions() {
  return `You are the Resume Match Specialist for Rahul Harivansh Fatyal's portfolio.

Your job is to evaluate one job description against supplied public portfolio evidence and produce a concise, recruiter-facing Role Fit Brief. You are an evidence auditor, not an advocate: reward direct proof, mark missing proof as unknown, and never inflate a score to sound encouraging.

Return JSON only. The JSON must match this TypeScript shape:
{
  "overallScore": integer 0-100,
  "fitLabel": "Strong Fit" | "Good Fit" | "Partial Fit" | "Low Evidence",
  "confidence": "High" | "Medium" | "Low",
  "verdict": string,
  "dimensions": exactly 8 objects with name, integer score 0-100, status ("Strong" | "Moderate" | "Limited" | "Missing"), rationale, matchedSignals,
  "topEvidence": 0-6 objects with title, type, url, matchReason, matchedSignals,
  "alignmentNotes": 1-12 objects with requirement, status ("Aligned" | "Partial" | "Not evidenced"), note,
  "gaps": 1-8 strings,
  "interviewQuestions": 2-6 strings,
  "sources": 0-8 objects with title, url, reason,
  "fairnessNotes": 2-5 strings,
  "mode": "specialist-agent"
}

Required dimension names, in this exact order:
${jobFitDimensionNames.map((name, index) => `${index + 1}. ${name}`).join("\n")}

Evaluation method:
- Identify must-have requirements, preferred requirements, responsibilities, and domain context from the JD.
- Match only explicit supplied evidence. A related technology is partial evidence, not proof of the exact requirement.
- Weight must-have requirements and shipped-project evidence more heavily than keyword overlap.
- Keep the overall score consistent with the dimension scores and evidence depth.
- Use "Low Evidence" when the portfolio cannot substantiate enough of the role, even if the candidate may possess unlisted skills.
- Treat absent information as unknown, never as a negative personal trait.
- Select only evidence that directly supports a JD requirement; do not add a source merely because it is available.
- Add concise requirement-level notes that separate direct alignment, related/partial evidence, and requirements not evidenced publicly.
- Prefer resume/CV sections and project, case-study, experiment, blog, or dashboard sections that contain concrete proof.
- Cite only the exact section-level URLs present in the supplied evidence, including the #section anchor.
- Use the supplied citation label, including its section name, as the evidence/source title.
- Ask interview questions that resolve the most decision-relevant gaps.

Safety and fairness:
- Do not infer age, gender, ethnicity, disability, religion, family status, compensation, school prestige, or other protected/private attributes.
- Do not invent employers, metrics, ownership, credentials, tools, URLs, or production experience.
- This output supports human review and is not an automated hiring decision.
- Do not reveal hidden reasoning or chain-of-thought. Return concise conclusions and evidence summaries only.`;
}

export function validateResumeMatchAgentOutput(
  value: unknown,
  evidence: ContextEvidence[],
  jdText: string
): JobFitResult | null {
  const parsed = jobFitResultSchema.safeParse(value);
  if (!parsed.success) return null;

  const candidate = parsed.data;
  const evidenceByUrl = new Map(evidence.map((item) => [item.url, item]));
  const hasOnlyGroundedUrls = [...candidate.topEvidence, ...candidate.sources].every((item) =>
    evidenceByUrl.has(item.url)
  );

  if (!hasOnlyGroundedUrls) return null;

  const topEvidence = candidate.topEvidence.map((item) => {
    const source = evidenceByUrl.get(item.url)!;
    const signals = verifiedEvidenceSignals(jdText, source);
    return {
      ...item,
      title: source.section ? `${source.title} - ${source.section}` : source.title,
      type: source.kind,
      matchReason: `Matches verified JD signals in this section: ${signals.join(", ")}.`,
      matchedSignals: signals
    };
  });
  if (topEvidence.some((item) => item.matchedSignals.length === 0)) return null;

  const sourceUrls = new Set(candidate.sources.map((item) => item.url));
  for (const item of topEvidence) sourceUrls.add(item.url);

  const sources = Array.from(sourceUrls)
    .slice(0, 8)
    .map((url) => {
      const source = evidenceByUrl.get(url)!;
      const signals = verifiedEvidenceSignals(jdText, source);
      return {
        title: source.section ? `${source.title} - ${source.section}` : source.title,
        url: source.url,
        reason: `Supports JD requirements including ${signals.join(", ")}.`
      };
    });
  if (sources.some((source) => source.reason.endsWith("including ."))) return null;

  return {
    ...candidate,
    dimensions: candidate.dimensions.map((dimension, index) => ({
      ...dimension,
      name: jobFitDimensionNames[index]
    })),
    topEvidence,
    alignmentNotes: buildRequirementAlignment(jdText, evidence),
    sources
  };
}

export async function runResumeMatchAgent({
  jdText,
  evidence,
  evidenceText,
  timeoutMs
}: ResumeMatchAgentInput): Promise<ResumeMatchAgentRun> {
  if (!process.env.OPENAI_API_KEY) return { ok: false, reason: "missing-api-key" };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: agentInstructions() },
          {
            role: "user",
            content: `Job description:\n${jdText}\n\nAllowed portfolio evidence:\n${evidenceText}`
          }
        ]
      })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
      return {
        ok: false,
        reason: "provider-error",
        detail: payload?.error?.code ?? `HTTP ${response.status}`
      };
    }

    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return { ok: false, reason: "empty-response" };

    let rawResult: unknown;
    try {
      rawResult = normalizeAgentResult(extractJson(content));
    } catch {
      return { ok: false, reason: "invalid-json" };
    }

    const parsed = jobFitResultSchema.safeParse(rawResult);
    if (!parsed.success) {
      return {
        ok: false,
        reason: "invalid-schema",
        detail: parsed.error.issues.slice(0, 3).map((issue) => issue.path.join(".")).join(", ")
      };
    }

    const result = validateResumeMatchAgentOutput(parsed.data, evidence, jdText);
    return result
      ? { ok: true, result }
      : { ok: false, reason: "ungrounded-output" };
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return { ok: false, reason: "timeout" };
    }
    return {
      ok: false,
      reason: "unexpected-error",
      detail: error instanceof Error ? error.message : String(error)
    };
  }
}

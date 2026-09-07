import {
  buildRequirementAlignment,
  buildJobRubric,
  jobFitResultSchema,
  verifiedEvidenceSignals,
  type JobFitResult
} from "@/lib/job-fit";
import type { ContextEvidence } from "@/lib/site-context";
import { ProviderCallError, runTextWithFallback } from "@/lib/ai-providers";
import { z } from "zod";

export const resumeMatchAgent = {
  name: "Resume Match Specialist",
  version: "1.2"
} as const;

type ResumeMatchAgentInput = {
  ownerName: string;
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
        | "refusal"
        | "incomplete-response"
        | "invalid-json"
        | "invalid-schema"
        | "ungrounded-output"
        | "timeout"
        | "rate-limit"
        | "unexpected-error";
      detail?: string;
    };

function normalizedStatus(score: number) {
  if (score >= 74) return "Strong";
  if (score >= 52) return "Moderate";
  if (score >= 25) return "Limited";
  return "Missing";
}

function normalizeAgentResult(value: unknown, jdText: string) {
  if (!value || typeof value !== "object") return value;
  const candidate = value as Record<string, unknown>;
  const rubric = buildJobRubric(jdText);
  const dimensions = Array.isArray(candidate.dimensions)
    ? candidate.dimensions.map((dimension, index) => {
        if (!dimension || typeof dimension !== "object") return dimension;
        const item = dimension as Record<string, unknown>;
        const score = typeof item.score === "number" ? item.score : Number(item.score);
        return {
          ...item,
          name: rubric[index]?.name ?? String(item.name ?? `Criterion ${index + 1}`),
          category: rubric[index]?.category ?? item.category ?? "Other",
          priority: rubric[index]?.priority ?? item.priority ?? "Context",
          weight: rubric[index]?.weight ?? item.weight ?? 3,
          evidenceStandard: rubric[index]?.evidenceStandard ?? item.evidenceStandard ?? "Direct portfolio evidence is required.",
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

export function agentInstructions(ownerName: string, jdText: string) {
  const rubric = buildJobRubric(jdText);
  return `You are the Resume Match Specialist for ${ownerName}'s portfolio.

Your job is to evaluate one job description against supplied public portfolio evidence and produce a concise, recruiter-facing Role Fit Brief. You are an evidence auditor, not an advocate: reward direct proof, mark missing proof as unknown, and never inflate a score to sound encouraging.

The response is constrained by a strict JSON Schema. Populate every field exactly once and do not add fields.

JD-derived rubric, in this exact order:
${rubric.map((item, index) => `${index + 1}. ${item.name} | ${item.category} | ${item.priority} | weight ${item.weight} | ${item.evidenceStandard}`).join("\n")}

Writing rules:
- Use the supplied rubric name exactly for each dimension; never copy a full JD sentence into a name.
- Keep names as clean noun phrases, verdicts under 45 words, rationales under 30 words, and gaps under 20 words.
- Start gaps with the missing capability, not boilerplate such as "The candidate should".
- Write interview questions as direct, specific questions that can be asked verbatim.
- Keep evidence summaries factual and free of promotional adjectives.

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

const unsupportedStrictSchemaKeywords = new Set([
  "$schema",
  "default",
  "minLength",
  "maxLength"
]);

function strictProviderSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(strictProviderSchema);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !unsupportedStrictSchemaKeywords.has(key))
      .map(([key, item]) => [key, strictProviderSchema(item)])
  );
}

export function resumeMatchOutputJsonSchema() {
  return strictProviderSchema(z.toJSONSchema(jobFitResultSchema)) as Record<string, unknown>;
}

export function createResumeMatchRequestBody(ownerName: string, jdText: string, evidenceText: string) {
  return {
    contents: [{
      role: "user",
      parts: [{ text: `${agentInstructions(ownerName, jdText)}\n\nJob description:\n${jdText}\n\nAllowed portfolio evidence:\n${evidenceText}` }]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: resumeMatchOutputJsonSchema()
    }
  };
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
    dimensions: candidate.dimensions,
    topEvidence,
    alignmentNotes: buildRequirementAlignment(jdText, evidence),
    sources
  };
}

export async function runResumeMatchAgent({
  ownerName,
  jdText,
  evidence,
  evidenceText,
  timeoutMs
}: ResumeMatchAgentInput): Promise<ResumeMatchAgentRun> {
  try {
    const response = await runTextWithFallback({
      system: agentInstructions(ownerName, jdText),
      messages: [{
        role: "user",
        content: `Job description:\n${jdText}\n\nAllowed portfolio evidence:\n${evidenceText}`,
      }],
      temperature: 0.1,
      jsonSchema: resumeMatchOutputJsonSchema(),
      timeoutMs,
      enforceQuota: true,
    });

    let rawResult: unknown;
    try {
      rawResult = normalizeAgentResult(JSON.parse(response.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")), jdText);
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
    if (error instanceof ProviderCallError) {
      return { ok: false, reason: error.reason, detail: error.message };
    }
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

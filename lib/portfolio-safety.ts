import { z } from "zod";
import { runJsonWithFallback, type ProviderPrompt } from "@/lib/ai-providers";

export const portfolioReviewKinds = ["project", "case-study", "experiment", "blog", "dashboard"] as const;
export type PortfolioReviewKind = (typeof portfolioReviewKinds)[number];

export const portfolioDraftSchema = z.object({
  title: z.string().trim().min(4).max(100),
  summary: z.string().trim().min(40).max(700),
  tags: z.array(z.string().trim().min(2).max(32)).min(1).max(5),
  reviewNotes: z.array(z.string().trim().min(4).max(180)).max(5),
});

export type PortfolioSafetyFinding = { type: "redacted" | "review"; label: string };
type PortfolioDraft = z.infer<typeof portfolioDraftSchema>;
type PortfolioGenerator = (
  prompt: ProviderPrompt,
  schema: typeof portfolioDraftSchema,
) => Promise<{ text: string; provider: "GEMINI" | "OPENAI" | "ANTHROPIC" | "XAI"; model: string; value: PortfolioDraft }>;

const replacements: Array<{ label: string; expression: RegExp; replacement: string }> = [
  { label: "email address", expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, replacement: "[redacted email]" },
  { label: "phone number", expression: /(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)(?!\w)/g, replacement: "[redacted phone]" },
  { label: "web address", expression: /\b(?:https?:\/\/|www\.)\S+/gi, replacement: "[redacted URL]" },
  { label: "ticket or account identifier", expression: /\b(?:ticket|case|account|customer|client)[ _:#-]*[A-Z0-9-]{4,}\b/gi, replacement: "[redacted identifier]" },
];

function normalize(value: string) {
  return value.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim();
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function redactPortfolioSource(source: string, restrictedTerms: string[] = []) {
  let value = normalize(source);
  const findings: PortfolioSafetyFinding[] = [];
  for (const replacement of replacements) {
    if (replacement.expression.test(value)) {
      value = value.replace(replacement.expression, replacement.replacement);
      findings.push({ type: "redacted", label: replacement.label });
    }
    replacement.expression.lastIndex = 0;
  }
  for (const term of unique(restrictedTerms)) {
    const expression = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    if (expression.test(value)) {
      value = value.replace(expression, "[redacted organization detail]");
      findings.push({ type: "redacted", label: `owner-marked term: ${term}` });
    }
  }
  return { text: value, findings };
}

function safeText(value: string, restrictedTerms: string[]) {
  return redactPortfolioSource(value, restrictedTerms).text;
}

export function portfolioSafetyPrompt(kind: PortfolioReviewKind) {
  return `You produce a short, public-safe portfolio draft for a ${kind}.

The supplied source has already been mechanically redacted, but it may still contain private or company-specific material. Write only a truthful, generic account of the candidate's own technical contribution.

Rules:
- Never name or infer a company, client, customer, product, internal system, employee, location, contact, URL, ticket, account, proprietary dataset, revenue, or confidential metric.
- Use generic wording such as “an enterprise support workflow” only when necessary.
- Do not fabricate results, scale, team size, ownership, production status, or tools.
- Keep the summary to 2–4 concise sentences and focus on problem, method, and public-safe outcome.
- Tags must be broadly public technical topics, not organization or product names.
- reviewNotes must identify what the owner still needs to verify before publishing.
- Return only JSON matching the requested schema. This is a draft for owner review, never a confidentiality certification.`;
}

export async function reviewPortfolioSource(
  input: { source: string; kind: PortfolioReviewKind; restrictedTerms?: string[] },
  run: PortfolioGenerator = runJsonWithFallback,
) {
  const redacted = redactPortfolioSource(input.source, input.restrictedTerms);
  const prompt: ProviderPrompt = {
    system: portfolioSafetyPrompt(input.kind),
    messages: [{ role: "user", content: `Create a public-safe ${input.kind} draft from this redacted source:\n\n${redacted.text}` }],
    temperature: 0.1,
    jsonSchema: z.toJSONSchema(portfolioDraftSchema),
    timeoutMs: 30_000,
    enforceQuota: true,
  };
  const result = await run(prompt, portfolioDraftSchema);
  const draft = portfolioDraftSchema.parse({
    ...result.value,
    title: safeText(result.value.title, input.restrictedTerms ?? []),
    summary: safeText(result.value.summary, input.restrictedTerms ?? []),
    tags: unique(result.value.tags.map((tag) => safeText(tag, input.restrictedTerms ?? []))).slice(0, 5),
    reviewNotes: unique(result.value.reviewNotes.map((note) => safeText(note, input.restrictedTerms ?? []))).slice(0, 5),
  });
  const outputFindings = redactPortfolioSource(JSON.stringify(result.value), input.restrictedTerms).findings;
  return {
    draft,
    provider: result.provider,
    model: result.model,
    findings: unique([...redacted.findings, ...outputFindings].map((finding) => `${finding.type}:${finding.label}`)).map((entry) => {
      const [type, label] = entry.split(":", 2);
      return { type: type as PortfolioSafetyFinding["type"], label };
    }),
    requiresOwnerReview: true,
  };
}

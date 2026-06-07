import { z } from "zod";
import type { ContextEvidence } from "@/lib/site-context";

export const fitLabels = ["Strong Fit", "Good Fit", "Partial Fit", "Low Evidence"] as const;
export const confidenceLevels = ["High", "Medium", "Low"] as const;

export const jobFitDimensionSchema = z.object({
  name: z.string().min(3),
  score: z.number().int().min(0).max(100),
  status: z.enum(["Strong", "Moderate", "Limited", "Missing"]),
  rationale: z.string().min(12),
  matchedSignals: z.array(z.string()).default([])
});

export const jobFitEvidenceSchema = z.object({
  title: z.string().min(3),
  type: z.string().min(1),
  url: z.string().regex(/^\/(?:[a-z0-9-/]+)?(?:#[-a-z0-9]+)?$/i),
  matchReason: z.string().min(12),
  matchedSignals: z.array(z.string()).default([])
});

export const jobFitSourceSchema = z.object({
  title: z.string().min(3),
  url: z.string().regex(/^\/(?:[a-z0-9-/]+)?(?:#[-a-z0-9]+)?$/i),
  reason: z.string().min(8)
});

export const jobFitAlignmentNoteSchema = z.object({
  requirement: z.string().min(2),
  status: z.enum(["Aligned", "Partial", "Not evidenced"]),
  note: z.string().min(12)
});

export const jobFitResultSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  fitLabel: z.enum(fitLabels),
  confidence: z.enum(confidenceLevels),
  verdict: z.string().min(20),
  dimensions: z.array(jobFitDimensionSchema).min(8).max(8),
  topEvidence: z.array(jobFitEvidenceSchema).max(6),
  alignmentNotes: z.array(jobFitAlignmentNoteSchema).min(1).max(12),
  gaps: z.array(z.string()).min(1).max(8),
  interviewQuestions: z.array(z.string()).min(2).max(6),
  sources: z.array(jobFitSourceSchema).max(8),
  fairnessNotes: z.array(z.string()).min(2).max(5),
  mode: z.enum(["specialist-agent", "deterministic-fallback"])
});

export type JobFitResult = z.infer<typeof jobFitResultSchema>;

export const jobFitDimensionNames = [
  "GenAI / RAG alignment",
  "Data science and ML alignment",
  "Backend/API/product engineering",
  "NLP, retrieval, and vector search",
  "Evidence depth from shipped projects",
  "Communication, documentation, and product thinking",
  "Domain adaptability",
  "Gaps or unproven areas"
] as const;

const stopwords = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "build",
  "can",
  "engineer",
  "engineering",
  "experience",
  "for",
  "from",
  "has",
  "have",
  "into",
  "job",
  "knowledge",
  "needs",
  "our",
  "preferred",
  "required",
  "requirements",
  "responsibilities",
  "role",
  "strong",
  "systems",
  "that",
  "the",
  "this",
  "to",
  "using",
  "work",
  "with",
  "will",
  "you",
  "your"
]);

const requirementCatalog = [
  { requirement: "Generative AI / LLMs", aliases: ["genai", "generative ai", "llm", "large language model"], related: ["ai", "pydantic ai"] },
  { requirement: "Retrieval-augmented generation", aliases: ["rag", "retrieval augmented generation"], related: ["retrieval", "vector search", "langchain"] },
  { requirement: "Python", aliases: ["python"], related: ["fastapi", "data science", "machine learning"] },
  { requirement: "FastAPI / API engineering", aliases: ["fastapi", "api engineering", "rest api", "backend api"], related: ["backend", "api", "flask"] },
  { requirement: "LangChain", aliases: ["langchain"], related: ["rag", "retrieval", "llm"] },
  { requirement: "Vector search / embeddings", aliases: ["vector search", "vector database", "embeddings", "faiss"], related: ["semantic search", "retrieval"] },
  { requirement: "NLP", aliases: ["nlp", "natural language processing"], related: ["text classification", "document processing", "semantic"] },
  { requirement: "Document processing", aliases: ["document processing", "document intelligence", "document extraction", "pdf", "docx"], related: ["extraction", "ocr", "resume"] },
  { requirement: "Data science / machine learning", aliases: ["data science", "machine learning", "ml engineer", "ml engineering"], related: ["forecasting", "model", "analytics"] },
  { requirement: "Analytics / dashboards", aliases: ["analytics", "dashboard", "power bi", "streamlit"], related: ["metrics", "visualization", "data"] },
  { requirement: "SQL / databases", aliases: ["sql", "postgresql", "sqlite", "database"], related: ["data model", "prisma"] },
  { requirement: "Cloud platforms", aliases: ["aws", "azure", "gcp", "cloud"], related: ["deployment", "infrastructure"] },
  { requirement: "Containers / orchestration", aliases: ["docker", "kubernetes", "container"], related: ["deployment", "infrastructure"] },
  { requirement: "Frontend engineering", aliases: ["angular", "react", "next.js", "typescript frontend"], related: ["typescript", "web application", "full stack"] },
  { requirement: "Evaluation and quality", aliases: ["evaluation", "evaluate", "quality", "benchmark"], related: ["metrics", "testing", "reliability"] },
  { requirement: "Production delivery", aliases: ["production", "deployed", "deployment", "ship", "shipped"], related: ["operations", "monitoring", "maintained"] },
  { requirement: "Communication and tradeoffs", aliases: ["communicate", "communication", "tradeoff", "stakeholder"], related: ["documentation", "case study", "explainable"] },
  { requirement: "Leadership / ownership", aliases: ["leadership", "lead", "ownership", "own end to end"], related: ["coordination", "team", "ncc"] }
] as const;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ");
}

function containsPhrase(value: string, phrase: string) {
  const normalizedValue = ` ${normalize(value).replace(/\s+/g, " ").trim()} `;
  const normalizedPhrase = normalize(phrase).replace(/\s+/g, " ").trim();
  return normalizedPhrase.length > 0 && normalizedValue.includes(` ${normalizedPhrase} `);
}

function tokens(value: string) {
  return normalize(value)
    .split(/\s+/)
    .map((term) => term.replace(/^[^a-z0-9+#]+|[^a-z0-9+#]+$/g, ""))
    .filter(Boolean);
}

export function extractJobTerms(value: string) {
  const counts = new Map<string, number>();
  for (const term of tokens(value)) {
    const trimmed = term.trim();
    if (trimmed.length < 3 || stopwords.has(trimmed)) continue;
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 60)
    .map(([term]) => term);
}

function evidenceText(item: ContextEvidence) {
  return normalize(`${item.title} ${item.summary} ${item.snippet} ${item.body} ${item.tags.join(" ")}`);
}

function matchedSignals(terms: string[], item: ContextEvidence, limit = 8) {
  const evidenceTokens = new Set(tokens(evidenceText(item)));
  return terms.filter((term) => evidenceTokens.has(term)).slice(0, limit);
}

export function verifiedEvidenceSignals(jdText: string, item: ContextEvidence, limit = 8) {
  return matchedSignals(extractJobTerms(jdText), item, limit);
}

export function selectRelevantJobEvidence(
  jdText: string,
  evidence: ContextEvidence[],
  limit = 12
) {
  const terms = extractJobTerms(jdText);
  const ranked = evidence
    .map((item) => {
      const signals = matchedSignals(terms, item);
      const titleAndTags = normalize(`${item.title} ${item.section ?? ""} ${item.tags.join(" ")}`);
      const highValueSignals = signals.filter((term) => titleAndTags.includes(term)).length;
      const sourceWeight =
        item.kind === "cv" || item.kind === "project" || item.kind === "case-study"
          ? 3
          : item.kind === "experiment" || item.kind === "blog" || item.kind === "dashboard"
            ? 2
            : 1;

      return {
        item,
        signalCount: signals.length,
        highValueSignals,
        score: signals.length * 4 + highValueSignals * 3 + sourceWeight
      };
    })
    .filter(({ item, signalCount, highValueSignals }) =>
      signalCount >= 2 ||
      ((item.kind === "skill" || item.kind === "certification") && highValueSignals >= 1)
    )
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));

  const seenUrls = new Set<string>();
  return ranked
    .filter(({ item }) => {
      if (seenUrls.has(item.url)) return false;
      seenUrls.add(item.url);
      return true;
    })
    .slice(0, limit)
    .map(({ item }) => item);
}

export function buildRequirementAlignment(
  jdText: string,
  evidence: ContextEvidence[]
): JobFitResult["alignmentNotes"] {
  const requested = requirementCatalog.filter((item) =>
    item.aliases.some((alias) => containsPhrase(jdText, alias))
  );
  const requirements = requested.length
    ? requested
    : extractJobTerms(jdText).slice(0, 6).map((term) => ({
        requirement: term.replace(/\b\w/g, (character) => character.toUpperCase()),
        aliases: [term],
        related: [] as string[]
      }));

  return requirements.slice(0, 12).map((requirement) => {
    const directSources = evidence.filter((item) =>
      requirement.aliases.some((alias) => containsPhrase(evidenceText(item), alias))
    );
    const relatedSignals = requirement.related.filter((alias) =>
      evidence.some((item) => containsPhrase(evidenceText(item), alias))
    );

    if (directSources.length) {
      const kindPriority = new Map([
        ["skill", 0],
        ["certification", 1],
        ["project", 2],
        ["case-study", 3],
        ["experiment", 4],
        ["dashboard", 5],
        ["blog", 6],
        ["timeline", 7],
        ["cv", 8],
        ["document", 9],
        ["profile", 10],
        ["explorer", 11]
      ]);
      const sourceTypes = Array.from(new Set(directSources.map((item) => item.kind)))
        .sort((a, b) => (kindPriority.get(a) ?? 99) - (kindPriority.get(b) ?? 99))
        .slice(0, 3);
      return {
        requirement: requirement.requirement,
        status: "Aligned" as const,
        note: `Direct public evidence appears in ${sourceTypes.join(", ")} resource${sourceTypes.length === 1 ? "" : "s"}.`
      };
    }

    if (relatedSignals.length) {
      return {
        requirement: requirement.requirement,
        status: "Partial" as const,
        note: `Related evidence exists for ${relatedSignals.slice(0, 3).join(", ")}, but the exact JD requirement is not directly demonstrated.`
      };
    }

    return {
      requirement: requirement.requirement,
      status: "Not evidenced" as const,
      note: "No direct public portfolio evidence was found; verify this requirement during recruiter or technical review."
    };
  });
}

function dimensionStatus(score: number): JobFitResult["dimensions"][number]["status"] {
  if (score >= 74) return "Strong";
  if (score >= 52) return "Moderate";
  if (score >= 25) return "Limited";
  return "Missing";
}

function fitLabel(score: number, evidenceCount: number): JobFitResult["fitLabel"] {
  if (evidenceCount < 2 || score < 35) return "Low Evidence";
  if (score >= 78) return "Strong Fit";
  if (score >= 58) return "Good Fit";
  return "Partial Fit";
}

function confidence(score: number, evidenceCount: number): JobFitResult["confidence"] {
  if (evidenceCount >= 6 && score >= 62) return "High";
  if (evidenceCount >= 3 && score >= 40) return "Medium";
  return "Low";
}

function sourceFromEvidence(item: ContextEvidence): JobFitResult["sources"][number] {
  return {
    title: item.section ? `${item.title} - ${item.section}` : item.title,
    url: item.url,
    reason: `Relevant ${item.kind} evidence for this JD.`
  };
}

export function deterministicJobFit(
  jdText: string,
  evidence: ContextEvidence[],
  alignmentEvidence: ContextEvidence[] = evidence
): JobFitResult {
  const terms = extractJobTerms(jdText);
  const scored = evidence
    .map((item) => {
      const signals = matchedSignals(terms, item);
      return { item, signals, score: signals.length };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const evidenceCoverage = Math.min(100, Math.round((scored.reduce((sum, item) => sum + item.score, 0) / Math.max(terms.length, 1)) * 180));
  const ragTerms = ["rag", "retrieval", "langchain", "vector", "embedding", "faiss", "llm", "genai", "agent"];
  const dataTerms = ["data", "science", "machine", "learning", "ml", "forecasting", "analytics", "model"];
  const backendTerms = ["api", "backend", "fastapi", "flask", "sqlite", "postgresql", "typescript", "next"];
  const nlpTerms = ["nlp", "text", "document", "semantic", "classification", "resume", "retrieval"];
  const communicationTerms = ["documentation", "case", "study", "explainable", "evidence", "dashboard", "workflow"];

  const allEvidenceText = evidence.map(evidenceText).join(" ");
  const scoreByTerms = (needles: string[]) => {
    const matched = needles.filter((term) => allEvidenceText.includes(term));
    return {
      score: Math.min(100, Math.round((matched.length / needles.length) * 88)),
      matched
    };
  };

  const buckets = [
    scoreByTerms(ragTerms),
    scoreByTerms(dataTerms),
    scoreByTerms(backendTerms),
    scoreByTerms(nlpTerms),
    { score: Math.min(100, evidence.length * 12), matched: evidence.slice(0, 5).map((item) => item.title) },
    scoreByTerms(communicationTerms),
    { score: Math.min(82, Math.round(evidenceCoverage * 0.72) + 18), matched: scored.flatMap((item) => item.signals).slice(0, 6) },
    { score: Math.max(18, 100 - evidenceCoverage), matched: terms.slice(0, 6) }
  ];

  const dimensions = jobFitDimensionNames.map((name, index) => {
    const bucket = buckets[index];
    const score = index === 7 ? Math.min(72, bucket.score) : bucket.score;
    return {
      name,
      score,
      status: dimensionStatus(score),
      rationale:
        index === 7
          ? "This dimension tracks areas where the public portfolio may not fully prove every JD requirement."
          : bucket.matched.length
            ? `Matched portfolio signals include ${bucket.matched.slice(0, 4).join(", ")}.`
            : "The available public portfolio evidence is limited for this requirement.",
      matchedSignals: bucket.matched.slice(0, 6)
    };
  });

  const positiveDimensions = dimensions.slice(0, 7);
  const overallScore = Math.max(
    18,
    Math.min(88, Math.round(positiveDimensions.reduce((sum, item) => sum + item.score, 0) / positiveDimensions.length))
  );

  const topEvidence = scored.map(({ item, signals }) => ({
    title: item.section ? `${item.title} - ${item.section}` : item.title,
    type: item.kind,
    url: item.url,
    matchReason: signals.length
      ? `Aligns with the JD through ${signals.slice(0, 4).join(", ")}.`
      : "Relevant portfolio evidence for this role.",
    matchedSignals: signals
  }));

  const sources = scored.map(({ item }) => sourceFromEvidence(item));

  return jobFitResultSchema.parse({
    overallScore,
    fitLabel: fitLabel(overallScore, scored.length),
    confidence: confidence(overallScore, scored.length),
    verdict:
      scored.length > 1
        ? "The public portfolio contains multiple sections with direct signals relevant to this job description."
        : "The public portfolio has limited direct evidence for this JD, so this brief should be treated as a starting point for recruiter review.",
    dimensions,
    topEvidence,
    alignmentNotes: buildRequirementAlignment(jdText, alignmentEvidence),
    gaps: [
      "Confirm exact production ownership, team size, and business impact for requirements that matter to this JD.",
      "Validate any domain-specific tools, cloud services, or compliance responsibilities not visible in the public portfolio."
    ],
    interviewQuestions: [
      "Which portfolio project is closest to this role, and what tradeoffs did you own end to end?",
      "How would you evaluate retrieval quality, model reliability, and user trust for this JD's use case?",
      "Which missing JD requirements would require ramp-up, and what is your plan to close them?"
    ],
    sources,
    fairnessNotes: [
      "This result is grounded in public portfolio evidence and is not a hiring decision.",
      "The scorer avoids demographic, age, school-prestige, and unverifiable private claims.",
      "Missing evidence is treated as unknown rather than assumed capability."
    ],
    mode: "deterministic-fallback"
  });
}

export function coerceJobFitResult(value: unknown, fallback: JobFitResult): JobFitResult {
  const parsed = jobFitResultSchema.safeParse(value);
  if (!parsed.success) return fallback;
  return parsed.data;
}

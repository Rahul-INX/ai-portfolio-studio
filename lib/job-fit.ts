import { z } from "zod";
import type { ContextEvidence } from "@/lib/site-context";

export const fitLabels = ["Strong Fit", "Good Fit", "Partial Fit", "Low Evidence"] as const;
export const confidenceLevels = ["High", "Medium", "Low"] as const;

export const jobFitDimensionSchema = z.object({
  name: z.string().min(3),
  category: z.enum(["Responsibility", "Technical", "Experience", "Domain", "Delivery", "Collaboration", "Other"]),
  priority: z.enum(["Must have", "Preferred", "Context"]),
  weight: z.number().int().min(1).max(5),
  evidenceStandard: z.string().min(8),
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
  dimensions: z.array(jobFitDimensionSchema).min(3).max(12),
  topEvidence: z.array(jobFitEvidenceSchema).max(6),
  alignmentNotes: z.array(jobFitAlignmentNoteSchema).min(1).max(12),
  gaps: z.array(z.string()).min(1).max(8),
  interviewQuestions: z.array(z.string()).min(2).max(6),
  sources: z.array(jobFitSourceSchema).max(8),
  fairnessNotes: z.array(z.string()).min(2).max(5),
  mode: z.enum(["specialist-agent", "deterministic-fallback"])
});

export type JobFitResult = z.infer<typeof jobFitResultSchema>;

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

type RubricCriterion = {
  name: string;
  aliases: readonly string[];
  related: readonly string[];
  category: JobFitResult["dimensions"][number]["category"];
  priority: JobFitResult["dimensions"][number]["priority"];
  weight: number;
  evidenceStandard: string;
};

function criterionCategory(name: string): RubricCriterion["category"] {
  const value = normalize(name);
  if (/(lead|communicat|stakeholder|mentor|collaborat|team)/.test(value)) return "Collaboration";
  if (/(year|experience|senior|track record)/.test(value)) return "Experience";
  if (/(deliver|production|deploy|monitor|quality|test|own)/.test(value)) return "Delivery";
  if (/(domain|health|finance|retail|energy|legal|compliance)/.test(value)) return "Domain";
  if (/(responsib|design|build|develop|manage|implement|architect)/.test(value)) return "Responsibility";
  if (/(python|java|sql|api|cloud|docker|react|angular|model|data|ai|ml|nlp|rag|vector)/.test(value)) return "Technical";
  return "Other";
}

function priorityFor(text: string): Pick<RubricCriterion, "priority" | "weight"> {
  const value = normalize(text);
  if (/(must|required|minimum|needs?|need to|responsible for|you will)/.test(value)) return { priority: "Must have", weight: 5 };
  if (/(preferred|nice to have|bonus|plus)/.test(value)) return { priority: "Preferred", weight: 2 };
  return { priority: "Context", weight: 3 };
}

function evidenceStandard(category: RubricCriterion["category"]) {
  if (category === "Technical") return "Direct skill plus project or implementation evidence.";
  if (category === "Experience") return "Timeline, role, or dated project evidence with comparable scope.";
  if (category === "Delivery") return "Shipped outcome, operating constraint, metric, or production responsibility.";
  if (category === "Collaboration") return "Role, ownership, leadership, stakeholder, or team evidence.";
  if (category === "Domain") return "Direct domain work; adjacent technology alone is insufficient.";
  return "Direct portfolio evidence demonstrating the stated requirement.";
}

function cleanCriterion(value: string) {
  return value
    .replace(/^[\s•*\-\d.)]+/, "")
    .replace(/^(requirements?|qualifications?|responsibilities?|skills?)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 110);
}

function sentenceCriterionName(value: string) {
  const sentence = cleanCriterion(value)
    .replace(/^(?:you|the (?:candidate|person|engineer|role)|this role)\s+(?:will|must|should|needs? to|is responsible for)\s+/i, "")
    .replace(/^(?:must|should|required to|responsible for)\s+/i, "")
    .replace(/[.;:]+$/, "");
  const normalized = normalize(sentence);

  if (/\bsoftware\b/.test(normalized) && /\b(users?|customers?|business outcomes?|business impact)\b/.test(normalized)) {
    return "Software delivery and business impact";
  }
  if (/\b(reliability|maintainability|availability|quality)\b/.test(normalized) && /\b(production|software|systems?|services?)\b/.test(normalized)) {
    return "Production reliability and quality";
  }
  if (/\b(stakeholders?|communicat|collaborat|cross functional)\b/.test(normalized)) {
    return "Stakeholder communication and collaboration";
  }
  if (/\b(lead|leadership|mentor|ownership|own end to end)\b/.test(normalized)) {
    return "Technical leadership and ownership";
  }

  const objectPhrase = sentence
    .replace(/^(?:(?:design|build|develop|implement|create|deliver|test|maintain|manage|lead|own|support|improve|drive|ensure|work)(?:ing)?(?:,\s*|\s+and\s+|\s+))+/i, "")
    .split(/\s+(?:that|which|so that|in order to)\s+/i)[0]
    .trim();
  const candidate = objectPhrase.length >= 8 ? objectPhrase : sentence;
  const words = candidate.split(/\s+/).slice(0, 9).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function buildJobRubric(jdText: string): RubricCriterion[] {
  const catalogMatches: RubricCriterion[] = requirementCatalog
    .filter((item) => item.aliases.some((alias) => containsPhrase(jdText, alias)))
    .map((item) => {
      const source = item.aliases.find((alias) => containsPhrase(jdText, alias)) ?? item.requirement;
      const priority = priorityFor(jdText.split(/(?<=[.!?;\n])/).find((line) => containsPhrase(line, source)) ?? "");
      const category = criterionCategory(item.requirement);
      return {
        name: item.requirement,
        aliases: item.aliases,
        related: item.related,
        category,
        ...priority,
        evidenceStandard: evidenceStandard(category)
      };
    });

  const sentenceCandidates = jdText
    .split(/\r?\n|(?<=[.;])\s+/)
    .map(cleanCriterion)
    .filter((line) => line.length >= 18 && line.length <= 110)
    .filter((line) => /(must|required|preferred|nice to have|bonus|responsib|experience|proficien|ability|knowledge|build|design|lead|manage|develop)/i.test(line))
    .map((line): RubricCriterion => {
      const category = criterionCategory(line);
      return {
        name: sentenceCriterionName(line),
        aliases: extractJobTerms(line).slice(0, 6),
        related: [],
        category,
        ...priorityFor(line),
        evidenceStandard: evidenceStandard(category)
      };
    });

  const fallback = extractJobTerms(jdText).slice(0, 8).map((term): RubricCriterion => {
    const name = term.replace(/\b\w/g, (character) => character.toUpperCase());
    const category = criterionCategory(name);
    return {
      name,
      aliases: [term],
      related: [],
      category,
      priority: "Context",
      weight: 3,
      evidenceStandard: evidenceStandard(category)
    };
  });

  const seen = new Set<string>();
  const substantive = [...catalogMatches, ...sentenceCandidates];
  return [...substantive, ...(substantive.length < 3 ? fallback : [])]
    .filter((item) => {
      const key = normalize(item.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 12);
}

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
  const requirements = buildJobRubric(jdText).map((item) => ({
    requirement: item.name,
    aliases: item.aliases,
    related: item.related
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

  const rubric = buildJobRubric(jdText);
  const dimensions = rubric.map((criterion) => {
    const directSources = alignmentEvidence
      .filter((item) => criterion.aliases.some((alias) => containsPhrase(evidenceText(item), alias)))
      .filter((item, index, items) => items.findIndex((candidate) => candidate.url === item.url) === index);
    const related = criterion.related.filter((alias) =>
      alignmentEvidence.some((item) => containsPhrase(evidenceText(item), alias))
    );
    const directSignalCount = criterion.aliases.filter((alias) =>
      directSources.some((item) => containsPhrase(evidenceText(item), alias))
    ).length;
    const sourceQuality = directSources
      .map((item) =>
        item.kind === "project" || item.kind === "case-study" ? 4 :
        item.kind === "experiment" || item.kind === "dashboard" ? 3 :
        item.kind === "timeline" || item.kind === "cv" || item.kind === "certification" ? 2 :
        1
      )
      .sort((a, b) => b - a)
      .slice(0, 3)
      .reduce((sum, value) => sum + value, 0);
    const hasInspectableEvidence = directSources.some((item) =>
      ["project", "case-study", "experiment", "dashboard"].includes(item.kind)
    );
    const rawDirectScore = 24 + directSignalCount * 10 + sourceQuality * 5;
    const score = directSources.length
      ? Math.min(hasInspectableEvidence ? 95 : 58, rawDirectScore)
      : related.length
        ? Math.min(38, 18 + related.length * 6)
        : 0;
    const matched = [
      ...criterion.aliases.filter((alias) => directSources.some((item) => containsPhrase(evidenceText(item), alias))),
      ...related
    ].slice(0, 6);
    return {
      name: criterion.name,
      category: criterion.category,
      priority: criterion.priority,
      weight: criterion.weight,
      evidenceStandard: criterion.evidenceStandard,
      score,
      status: dimensionStatus(score),
      rationale: directSources.length
        ? `${directSources.length} public evidence source${directSources.length === 1 ? "" : "s"} meet part of this criterion.`
        : related.length
          ? `Only adjacent evidence was found: ${related.slice(0, 3).join(", ")}.`
          : "No direct public portfolio evidence meets this JD criterion.",
      matchedSignals: matched
    };
  });

  const totalWeight = dimensions.reduce((sum, item) => sum + item.weight, 0);
  const overallScore = totalWeight
    ? Math.round(dimensions.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight)
    : 0;

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
    gaps: (() => {
      const gaps = dimensions
        .filter((item) => item.score < 52)
        .slice(0, 8)
        .map((item) => `${item.priority} criterion not sufficiently evidenced: ${item.name}`);
      return gaps.length
        ? gaps
        : ["Validate scope, recency, ownership, and outcomes for the strongest matched criteria during interview review."];
    })(),
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

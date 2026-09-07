import {
  getBlogs,
  getCaseStudies,
  getCertifications,
  getDashboards,
  getExperiments,
  getPortfolioDocuments,
  getProjects,
  getSiteProfile,
  getSkills,
  getTimeline
} from "@/lib/content";
import { citationLink, contentKindLabel, sectionRouteForTarget } from "@/lib/citations";
import type { CitationTarget } from "@/lib/citations";
import {
  safeBlogs,
  safeCaseStudies,
  safeCertifications,
  safeDashboards,
  safeExperiments,
  safePortfolioDocuments,
  safeProjects,
  safeSiteProfile,
  safeSkills,
  safeTimeline
} from "@/lib/safe-content";
import type { ContentKind } from "@/lib/types";

export type SiteContextItem = CitationTarget & {
  id: string;
  kind: CitationTarget["kind"];
  slug?: string;
  url: string;
  summary: string;
  body: string;
  tags: string[];
  imageUrl?: string;
  fileUrl?: string;
};

export type ContextEvidence = SiteContextItem & {
  citationId: string;
  snippet: string;
  reason: string;
};

export type ContextGatheringResult = {
  evidence: ContextEvidence[];
  routeMap: string;
  decision: {
    currentPath: string;
    usedCurrentPageOnly: boolean;
    reason: string;
    scopes: string[];
  };
};

const stopwords = new Set([
  "about",
  "after",
  "again",
  "also",
  "and",
  "are",
  "can",
  "does",
  "for",
  "give",
  "from",
  "has",
  "have",
  "his",
  "how",
  "into",
  "is",
  "link",
  "me",
  "the",
  "this",
  "that",
  "to",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
  "your"
]);

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ");
}

function terms(value: string) {
  return normalize(value)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => (term.length > 2 || term === "cv") && !stopwords.has(term));
}

function textOf(item: SiteContextItem) {
  return `${item.title} ${item.summary} ${item.body} ${item.tags.join(" ")}`;
}

function overlapScore(queryTerms: string[], item: SiteContextItem) {
  const haystack = normalize(textOf(item));
  const title = normalize(item.title);
  const tags = item.tags.map(normalize);
  const url = normalize(item.url.replaceAll("/", " "));
  return queryTerms.reduce((score, term) => {
    if (title.includes(term)) return score + 5;
    if (tags.some((tag) => tag.includes(term))) return score + 4;
    if (url.includes(term)) return score + 3;
    if (haystack.includes(term)) return score + 1;
    return score;
  }, 0);
}

function snippetFor(queryTerms: string[], item: SiteContextItem) {
  const body = [item.summary, item.body].filter(Boolean).join("\n");
  const sentences = body
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  const match = sentences.find((sentence) => {
    const normalized = normalize(sentence);
    return queryTerms.some((term) => normalized.includes(term));
  });
  return (match ?? item.summary ?? body).slice(0, 520);
}

function classifyContextIntent(message: string, currentItem?: SiteContextItem) {
  const normalized = normalize(message);
  const downloadIntent = [
    "resume",
    "cv",
    "download",
    "pdf",
    "document",
    "profile",
    "contact"
  ].some((term) => normalized.includes(term));
  if (downloadIntent) {
    return { search: true, reason: "The question asks for resume, CV, download, profile, or contact evidence.", intent: "download" as const };
  }
  if (!currentItem) return { search: true, reason: "No current-page content was found for this route.", intent: "portfolio" as const };
  const broadIntent = [
    "all",
    "best",
    "compare",
    "project",
    "projects",
    "portfolio",
    "strongest",
    "skills",
    "timeline",
    "experience",
    "work",
    "which"
  ].some((term) => normalized.includes(term));
  if (broadIntent) {
    return { search: true, reason: "The question asks for site-wide comparison or portfolio-level evidence.", intent: "portfolio" as const };
  }
  const queryTerms = terms(message);
  const currentScore = overlapScore(queryTerms, currentItem);
  return currentScore >= 3
    ? { search: false, reason: "The current page has enough matching evidence for a grounded answer.", intent: "page" as const }
    : { search: true, reason: "The current page does not contain enough matching evidence.", intent: "portfolio" as const };
}

function toEvidence(item: SiteContextItem, queryTerms: string[], reason: string, index: number): ContextEvidence {
  return {
    ...item,
    citationId: `S${index + 1}`,
    snippet: snippetFor(queryTerms, item),
    reason
  };
}

function gatherByKind(items: SiteContextItem[], queryTerms: string[], kind: SiteContextItem["kind"], limit: number) {
  return items
    .filter((item) => item.kind === kind)
    .map((item) => ({ item, score: overlapScore(queryTerms, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item, score }) => ({ item, reason: `${contentKindLabel(kind)} context matched ${score} query signal(s).` }));
}

function contextItem(target: Omit<SiteContextItem, "url">): SiteContextItem {
  return {
    ...target,
    url: sectionRouteForTarget(target)
  };
}

function blogHeadingSections(content: string) {
  const lines = content.split(/\r?\n/);
  const sections: Array<{ section: string; body: string }> = [];
  let current: { section: string; body: string[] } | undefined;

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      if (current) sections.push({ section: current.section, body: current.body.join("\n").trim() });
      current = { section: match[1].trim(), body: [] };
      continue;
    }
    current?.body.push(line);
  }
  if (current) sections.push({ section: current.section, body: current.body.join("\n").trim() });
  return sections;
}

export async function buildSiteContextItems(useSafeContent = false): Promise<SiteContextItem[]> {
  const [
    profile,
    projects,
    caseStudies,
    experiments,
    blogs,
    dashboards,
    skills,
    certifications,
    timeline,
    documents
  ] = useSafeContent
    ? [
        safeSiteProfile,
        safeProjects,
        safeCaseStudies,
        safeExperiments,
        safeBlogs,
        safeDashboards,
        safeSkills,
        safeCertifications,
        safeTimeline,
        safePortfolioDocuments
      ]
    : await Promise.all([
        getSiteProfile(),
        getProjects(),
        getCaseStudies(),
        getExperiments(),
        getBlogs(),
        getDashboards(),
        getSkills(),
        getCertifications(),
        getTimeline(),
        getPortfolioDocuments()
      ]);

  const baseItems: SiteContextItem[] = [
    contextItem({
      id: "profile:home",
      kind: "profile",
      title: `${profile.name} profile`,
      section: "Overview",
      summary: profile.heroSummary,
      body: `${profile.role}. ${profile.seoDescription}. Skills: ${skills.map((skill) => `${skill.name} ${skill.category}`).join(", ")}. Timeline: ${timeline.map((item) => `${item.period} ${item.title} ${item.description}`).join(" ")}`,
      tags: ["Profile", "GenAI", "Data Science", "Skills", "Timeline"]
    }),
    contextItem({
      id: "explorer:index",
      kind: "explorer",
      title: profile.explorerTitle,
      section: "Explorer",
      summary: profile.explorerDescription,
      body: "Searchable portfolio map for projects, case studies, experiments, blogs, and dashboards.",
      tags: ["Explorer", "Index", "Portfolio"]
    }),
    contextItem({
      id: "timeline:career",
      kind: "timeline",
      title: profile.timelineTitle,
      section: "Timeline",
      summary: profile.timelineDescription,
      body: timeline.map((item) => `${item.period}: ${item.title}. ${item.description}`).join("\n"),
      tags: ["Timeline", "Resume", "Career"]
    }),
  ];

  const cvItems = [
    contextItem({
      id: "cv:summary",
      kind: "cv" as const,
      title: `${profile.name} CV`,
      section: "Summary",
      summary: profile.seoDescription,
      body: `${profile.heroSummary}\n${projects.map((item) => `${item.title}: ${item.summary} ${item.businessImpact}`).join("\n")}`,
      tags: ["CV", "Resume", "Profile", "Skills", "Projects", "Career"]
    }),
    contextItem({
      id: "cv:skills",
      kind: "cv" as const,
      title: `${profile.name} CV`,
      section: "Skills",
      summary: "Technical and professional skills across GenAI, data science, engineering, and leadership.",
      body: skills.map((item) => `${item.name}: ${item.category}`).join("\n"),
      tags: ["CV", "Skills", "GenAI", "Data Science", "Engineering"]
    }),
    contextItem({
      id: "cv:projects",
      kind: "cv" as const,
      title: `${profile.name} CV`,
      section: "Projects",
      summary: "Selected project evidence for RAG, document intelligence, resume matching, tutoring, ML, and NLP.",
      body: projects.map((item) => `${item.title}: ${item.summary} ${item.businessImpact}`).join("\n"),
      tags: ["CV", "Projects", "RAG", "Resume", "NLP"]
    }),
    contextItem({
      id: "cv:experience",
      kind: "cv" as const,
      title: `${profile.name} CV`,
      section: "Experience",
      summary: "Experience signals across web development, entrepreneurship coordination, and NCC leadership.",
      body: timeline.map((item) => `${item.period} ${item.title}: ${item.description}`).join("\n"),
      tags: ["CV", "Experience", "Leadership"]
    }),
    contextItem({
      id: "cv:education",
      kind: "cv" as const,
      title: `${profile.name} CV`,
      section: "Education",
      summary: "Education and foundation evidence represented in the editable timeline.",
      body: timeline.filter((item) => /education|foundation|school|college|university/i.test(`${item.title} ${item.description}`)).map((item) => `${item.period}: ${item.title}. ${item.description}`).join("\n"),
      tags: ["CV", "Education", "Timeline"]
    }),
    contextItem({
      id: "cv:certifications",
      kind: "cv" as const,
      title: `${profile.name} CV`,
      section: "Certifications",
      summary: "Certification signals across machine learning, Python, analytics, AWS, and English communication.",
      body: certifications.map((item) => `${item.title}: ${item.issuer}`).join("\n"),
      tags: ["CV", "Certifications", "Machine Learning", "Python", "AWS"]
    }),
    contextItem({
      id: "cv:leadership",
      kind: "cv" as const,
      title: `${profile.name} CV`,
      section: "Leadership",
      summary: "Leadership and interest signals from NCC, entrepreneurship coordination, volunteering, and technical curiosity.",
      body: timeline.filter((item) => /lead|mentor|coordinat|team|manage/i.test(`${item.title} ${item.description}`)).map((item) => `${item.title}: ${item.description}`).join("\n"),
      tags: ["CV", "Leadership", "NCC", "Entrepreneurship"]
    })
  ];

  const documentItems = documents.map((item) =>
    contextItem({
      id: `document:${item.kind.toLowerCase()}`,
      kind: "document" as const,
      title: item.title,
      section: "Resume Downloads",
      summary: item.description,
      body: `${item.title}. ${item.description}. Download URL: ${item.fileUrl}. Version: ${item.versionLabel ?? "Public document"}.`,
      tags: [item.kind, "Resume", "CV", "Download", "PDF", "Profile"],
      fileUrl: item.fileUrl
    })
  );

  const skillItems = skills.map((skill) =>
    contextItem({
      id: `skill:${slugifyResource(skill.name)}`,
      kind: "skill" as const,
      title: skill.name,
      section: `Skill ${skill.name}`,
      summary: `${skill.name} is listed as a ${skill.category} skill signal.`,
      body: `Skill: ${skill.name}. Category: ${skill.category}. Public proficiency signal: ${skill.level}. Portfolio weight: ${skill.weight}.`,
      tags: ["Skill", skill.category, skill.name]
    })
  );

  const certificationItems = certifications.map((item) =>
    contextItem({
      id: `certification:${slugifyResource(item.title)}`,
      kind: "certification" as const,
      title: item.title,
      section: `Certification ${item.title}`,
      summary: `${item.title} certification issued by ${item.issuer}.`,
      body: `${item.title}. Issuer: ${item.issuer}. Issued: ${item.issuedAt ? new Date(item.issuedAt).toISOString().slice(0, 10) : "not specified"}.`,
      tags: ["Certification", item.issuer, item.title]
    })
  );

  const timelineItems = timeline.map((item) =>
    contextItem({
      id: `timeline:${slugifyResource(item.title)}`,
      kind: "timeline" as const,
      title: item.title,
      section: `Timeline ${item.title}`,
      summary: item.description,
      body: `${item.period}. ${item.description}. Signal: ${item.signal}.`,
      tags: ["Timeline", item.signal, item.period]
    })
  );

  const projectItems = projects.flatMap((item) => [
    contextItem({
      id: `project:${item.slug}:overview`,
      kind: "project" as const,
      slug: item.slug,
      title: item.title,
      section: "Overview",
      summary: item.summary,
      body: `${item.subtitle}\n${item.description}\nStack: ${item.techStack.join(", ")}\nDates: ${item.startDate ?? "not specified"} to ${item.endDate ?? item.publishedAt ?? "present"}`,
      tags: item.tags,
      imageUrl: item.imageUrl
    }),
    contextItem({
      id: `project:${item.slug}:impact`,
      kind: "project" as const,
      slug: item.slug,
      title: item.title,
      section: "Impact",
      summary: item.summary,
      body: item.businessImpact,
      tags: item.tags,
      imageUrl: item.imageUrl
    }),
    contextItem({
      id: `project:${item.slug}:metrics`,
      kind: "project" as const,
      slug: item.slug,
      title: item.title,
      section: "Metrics",
      summary: item.summary,
      body: item.metrics.map((metric) => `${metric.label}: ${metric.value}`).join("\n"),
      tags: item.tags,
      imageUrl: item.imageUrl
    }),
    contextItem({
      id: `project:${item.slug}:architecture`,
      kind: "project" as const,
      slug: item.slug,
      title: item.title,
      section: "Architecture",
      summary: item.summary,
      body: `${item.architectureCanvas.layers.join(", ")}\n${item.architectureCanvas.principles.join(", ")}\n${item.architectureCanvas.riskControls.join(", ")}`,
      tags: item.tags,
      imageUrl: item.imageUrl
    })
  ]);

  const caseStudyItems = caseStudies.flatMap((item) =>
    [
      ["Problem", item.problem],
      ["Context", item.context],
      ["Approach", item.approach],
      ["Business Value", item.businessValue]
    ].map(([section, body]) =>
      contextItem({
        id: `case-study:${item.slug}:${section}`,
        kind: "case-study" as const,
        slug: item.slug,
        title: item.title,
        section,
        summary: item.summary,
        body,
        tags: item.tags,
        imageUrl: item.imageUrl
      })
    )
  );

  const experimentItems = experiments.flatMap((item) =>
    [
      ["Hypothesis", item.hypothesis],
      ["Method", item.method],
      ["Findings", item.findings],
      ["Next Step", item.nextStep],
      ["Metrics", item.metrics.map((metric) => `${metric.label}: ${metric.value}`).join("\n")]
    ].map(([section, body]) =>
      contextItem({
        id: `experiment:${item.slug}:${section}`,
        kind: "experiment" as const,
        slug: item.slug,
        title: item.title,
        section,
        summary: item.summary,
        body,
        tags: item.tags,
        imageUrl: item.imageUrl
      })
    )
  );

  const blogItems = blogs.flatMap((item) => {
    const sections = blogHeadingSections(item.content);
    const sectionItems = sections.length
      ? sections.map(({ section, body }) =>
          contextItem({
            id: `blog:${item.slug}:${section}`,
            kind: "blog" as const,
            slug: item.slug,
            title: item.title,
            section,
            summary: item.excerpt,
            body,
            tags: item.tags,
            imageUrl: item.imageUrl
          })
        )
      : [];
    return [
      contextItem({
        id: `blog:${item.slug}:article`,
        kind: "blog" as const,
        slug: item.slug,
        title: item.title,
        section: "Article",
        summary: item.excerpt,
        body: item.content,
        tags: item.tags,
        imageUrl: item.imageUrl
      }),
      ...sectionItems
    ];
  });

  const dashboardItems = dashboards.map((item) =>
    contextItem({
      id: `dashboard:${item.slug}:preview`,
      kind: "dashboard" as const,
      slug: item.slug,
      title: item.title,
      section: "Preview",
      summary: item.summary,
      body: item.summary,
      tags: item.tags,
      imageUrl: item.imageUrl
    })
  );

  return [
    ...baseItems,
    ...cvItems,
    ...documentItems,
    ...skillItems,
    ...certificationItems,
    ...timelineItems,
    ...projectItems,
    ...caseStudyItems,
    ...experimentItems,
    ...blogItems,
    ...dashboardItems
  ];
}

function slugifyResource(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function gatherAllPortfolioEvidence(message: string): Promise<ContextEvidence[]> {
  let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
  const fallback = new Promise<SiteContextItem[]>((resolve) => {
    fallbackTimer = setTimeout(() => {
      void buildSiteContextItems(true).then(resolve);
    }, 3_000);
  });
  const items = await Promise.race([buildSiteContextItems(), fallback]);
  if (fallbackTimer) clearTimeout(fallbackTimer);
  const queryTerms = terms(message);

  return items.map((item, index) =>
    toEvidence(
      item,
      queryTerms,
      `${contentKindLabel(item.kind)} resource considered during the site-wide JD evidence search.`,
      index
    )
  );
}

export async function gatherPortfolioContext(message: string, currentPath = "/", limit = 7): Promise<ContextGatheringResult> {
  const items = await buildSiteContextItems();
  const queryTerms = terms(message);
  const normalizedPath = currentPath.split("?")[0].replace(/\/$/, "") || "/";
  const currentItem = items.find((item) => item.url.split("#")[0] === normalizedPath);
  const decision = classifyContextIntent(message, currentItem);

  const gathered = decision.search
    ? (
        await Promise.all(
          (decision.intent === "download"
            ? (["document", "cv", "profile", "timeline"] as Array<SiteContextItem["kind"]>)
            : (["profile", "timeline", "project", "case-study", "experiment", "blog", "dashboard", "document", "cv"] as Array<SiteContextItem["kind"]>)
          ).map(
            async (kind) => gatherByKind(items, queryTerms, kind, kind === "project" ? 3 : kind === "document" || kind === "cv" ? 3 : 2)
          )
        )
      ).flat()
    : currentItem
      ? [{ item: currentItem, reason: "Current page was sufficient for the question." }]
      : [];

  const withCurrentFirst = currentItem
    ? [{ item: currentItem, reason: "Current browser page context." }, ...gathered]
    : gathered;

  const seen = new Set<string>();
  const evidence = withCurrentFirst
    .filter(({ item }) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .slice(0, limit)
    .map(({ item, reason }, index) => toEvidence(item, queryTerms, reason, index));

  return {
    evidence,
    routeMap: items.map((item) => `${item.url} -> ${item.title}`).join("\n"),
    decision: {
      currentPath: normalizedPath,
      usedCurrentPageOnly: !decision.search,
      reason: decision.reason,
      scopes: Array.from(new Set(evidence.map((item) => String(item.kind))))
    }
  };
}

export function evidenceBlock(evidence: ContextEvidence[]) {
  return evidence
    .map(
      (item) =>
        `[${item.citationId}] ${item.title}\nCitation: ${citationLink(item)}\nURL: ${item.url}\nType: ${item.kind}\nTags: ${item.tags.join(", ")}\nWhy included: ${item.reason}\nSummary: ${item.summary}\nSnippet: ${item.snippet}${item.imageUrl ? `\nImage: ${item.imageUrl}` : ""}${item.fileUrl ? `\nDownload: ${item.fileUrl}` : ""}`
    )
    .join("\n\n");
}

export function sourcesBlock(evidence: ContextEvidence[]) {
  return evidence.map((item) => `- ${citationLink(item)} - ${item.reason}`).join("\n");
}

export function kindToContentKind(kind: SiteContextItem["kind"]): ContentKind | undefined {
  return kind === "profile" || kind === "timeline" || kind === "skill" || kind === "certification" || kind === "explorer" || kind === "document" || kind === "cv" ? undefined : kind;
}

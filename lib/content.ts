import { cache } from "react";
import { canReadDatabase, markDatabaseUnavailable } from "@/lib/database-availability";

/**
 * Retry wrapper for transient Neon serverless Postgres connection errors.
 * Retries up to `maxRetries` times with exponential backoff.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const isTransient =
        message.includes("connection pool") ||
        message.includes("Server has closed the connection") ||
        message.includes("Connection reset") ||
        message.includes("forcibly closed") ||
        message.includes("connect_timeout") ||
        message.includes("ECONNRESET");
      if (!isTransient || attempt === maxRetries) throw error;
      // Exponential backoff: 200ms, 600ms
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1) * (attempt + 1)));
    }
  }
  throw lastError;
}
import { prisma } from "@/lib/prisma";
import {
  allSafeItems,
  safeAchievements,
  safeBlogs,
  safeCaseStudies,
  safeCertifications,
  safeDashboards,
  safeExperiments,
  safeProjects,
  safePortfolioDocuments,
  safeSiteProfile,
  safeSkills,
  safeTimeline
} from "@/lib/safe-content";
import type {
  ArchitectureCanvas,
  AchievementSignal,
  ExplorerItem,
  Metric,
  PortfolioDocument,
  SafeBlog,
  SafeCaseStudy,
  SafeDashboard,
  SafeExperiment,
  SafeProject,
  SiteProfile
} from "@/lib/types";

type AchievementRow = {
  id: string;
  title: string;
  issuer: string;
  category: string;
  summary: string;
  awardedAt: Date | string | null;
  proofUrl: string | null;
  imageUrl: string | null;
  imageRatio: string | null;
  highlighted: boolean;
  sortOrder: number;
  publishedAt: Date | string | null;
};

function achievementClient() {
  return (prisma as typeof prisma & { achievement?: {
    findMany: typeof prisma.achievement extends undefined ? never : typeof prisma.achievement.findMany;
  } }).achievement;
}

async function queryAchievements(): Promise<AchievementRow[]> {
  const model = achievementClient();
  if (model) return model.findMany({
    where: { visibility: "PUBLISHED" },
    orderBy: [{ highlighted: "desc" }, { sortOrder: "asc" }, { awardedAt: "desc" }]
  }) as Promise<AchievementRow[]>;
  return prisma.$queryRaw<AchievementRow[]>`
    SELECT
      id, title, issuer, category, summary, "awardedAt", "proofUrl", "imageUrl", "imageRatio",
      highlighted, "sortOrder", "publishedAt"
    FROM "Achievement"
    WHERE visibility = 'PUBLISHED'
    ORDER BY highlighted DESC, "sortOrder" ASC, "awardedAt" DESC
  `;
}

export const getSiteProfile = cache(async (): Promise<SiteProfile> => {
  if (!canReadDatabase()) return safeSiteProfile;
  try {
    const profile = await withRetry(() => prisma.siteProfile.findUnique({ where: { id: "main" } }));
    return profile ?? safeSiteProfile;
  } catch (error) {
    markDatabaseUnavailable(error);
    return safeSiteProfile;
  }
});

function asMetrics(value: unknown): Metric[] {
  return Array.isArray(value) ? (value as Metric[]) : [];
}

function asArchitecture(value: unknown): ArchitectureCanvas {
  if (value && typeof value === "object") {
    return value as ArchitectureCanvas;
  }
  return { layers: [], principles: [], riskControls: [] };
}

export const getProjects = cache(async (): Promise<SafeProject[]> => {
  if (!canReadDatabase()) return safeProjects;
  try {
    const rows = await withRetry(() =>
      prisma.project.findMany({
        where: { visibility: "PUBLISHED" },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }]
      })
    );
    return rows.map((row) => ({
      id: row.id,
      kind: "project",
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      summary: row.summary,
      description: row.description,
      status: row.status,
      techStack: row.techStack,
      tags: row.tags,
      githubUrl: row.githubUrl ?? undefined,
      demoUrl: row.demoUrl ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      metrics: asMetrics(row.metrics),
      businessImpact: row.businessImpact,
      architectureCanvas: asArchitecture(row.architectureCanvas),
      featured: row.featured,
      startDate: row.startDate?.toISOString(),
      endDate: row.endDate?.toISOString(),
      publishedAt: row.publishedAt?.toISOString()
    }));
  } catch (error) {
    markDatabaseUnavailable(error);
    return safeProjects;
  }
});

export const getCaseStudies = cache(async (): Promise<SafeCaseStudy[]> => {
  if (!canReadDatabase()) return safeCaseStudies;
  try {
    const rows = await withRetry(() =>
      prisma.caseStudy.findMany({
        where: { visibility: "PUBLISHED" },
        orderBy: { publishedAt: "desc" }
      })
    );
    return rows.map((row) => ({
      id: row.id,
      kind: "case-study",
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      problem: row.problem,
      context: row.context,
      approach: row.approach,
      businessValue: row.businessValue,
      tags: row.tags,
      imageUrl: row.imageUrl ?? undefined,
      publishedAt: row.publishedAt?.toISOString()
    }));
  } catch (error) {
    markDatabaseUnavailable(error);
    return safeCaseStudies;
  }
});

export const getExperiments = cache(async (): Promise<SafeExperiment[]> => {
  if (!canReadDatabase()) return safeExperiments;
  try {
    const rows = await withRetry(() =>
      prisma.experiment.findMany({
        where: { visibility: "PUBLISHED" },
        orderBy: { publishedAt: "desc" }
      })
    );
    return rows.map((row) => ({
      id: row.id,
      kind: "experiment",
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      hypothesis: row.hypothesis,
      method: row.method,
      findings: row.findings,
      nextStep: row.nextStep,
      status: row.status,
      tags: row.tags,
      metrics: asMetrics(row.metrics),
      imageUrl: row.imageUrl ?? undefined,
      publishedAt: row.publishedAt?.toISOString()
    }));
  } catch (error) {
    markDatabaseUnavailable(error);
    return safeExperiments;
  }
});

export const getBlogs = cache(async (): Promise<SafeBlog[]> => {
  if (!canReadDatabase()) return safeBlogs;
  try {
    const rows = await withRetry(() =>
      prisma.blog.findMany({
        where: { visibility: "PUBLISHED" },
        orderBy: { publishedAt: "desc" }
      })
    );
    return rows.map((row) => ({
      id: row.id,
      kind: "blog",
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      tags: row.tags,
      readTime: row.readTime,
      seoTitle: row.seoTitle,
      seoSummary: row.seoSummary,
      imageUrl: row.imageUrl ?? undefined,
      publishedAt: row.publishedAt?.toISOString()
    }));
  } catch (error) {
    markDatabaseUnavailable(error);
    return safeBlogs;
  }
});

export const getDashboards = cache(async (): Promise<SafeDashboard[]> => {
  if (!canReadDatabase()) return safeDashboards;
  try {
    const rows = await withRetry(() =>
      prisma.dashboard.findMany({
        where: { visibility: "PUBLISHED" },
        orderBy: { publishedAt: "desc" }
      })
    );
    return rows.map((row) => ({
      id: row.id,
      kind: "dashboard",
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      embedUrl: row.embedUrl ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      tags: row.tags,
      publishedAt: row.publishedAt?.toISOString()
    }));
  } catch (error) {
    markDatabaseUnavailable(error);
    return safeDashboards;
  }
});

export const getExplorerItems = cache(async (): Promise<ExplorerItem[]> => {
  if (!canReadDatabase()) return allSafeItems;
  // Fetch sequentially to avoid exhausting Neon's connection pool.
  // Each getter is individually cached by React, so subsequent calls are free.
  const projects = await getProjects();
  const caseStudies = await getCaseStudies();
  const experiments = await getExperiments();
  const blogs = await getBlogs();
  const dashboards = await getDashboards();
  return [...projects, ...caseStudies, ...experiments, ...blogs, ...dashboards];
});

export const getSkills = cache(async () => {
  if (!canReadDatabase()) return safeSkills;
  try {
    const rows = await withRetry(() => prisma.skill.findMany({ orderBy: [{ category: "asc" }, { level: "desc" }] }));
    return rows.length
      ? rows.map((row) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          level: row.level,
          weight: row.weight
        }))
      : safeSkills;
  } catch (error) {
    markDatabaseUnavailable(error);
    return safeSkills;
  }
});

export const getTimeline = cache(async () => {
  if (!canReadDatabase()) return safeTimeline;
  try {
    const rows = await withRetry(() => prisma.timelineEvent.findMany({ orderBy: { sortOrder: "asc" } }));
    return rows.length
      ? rows.map((row) => ({
          id: row.id,
          title: row.title,
          period: row.period,
          description: row.description,
          signal: row.signal,
          sortOrder: row.sortOrder
        }))
      : safeTimeline;
  } catch (error) {
    markDatabaseUnavailable(error);
    return safeTimeline;
  }
});

export const getCertifications = cache(async () => {
  if (!canReadDatabase()) return safeCertifications;
  try {
    const rows = await withRetry(() => prisma.certification.findMany({ orderBy: { issuedAt: "desc" } }));
    return rows.length
      ? rows.map((row) => ({
          id: row.id,
          title: row.title,
          issuer: row.issuer,
          issuedAt: row.issuedAt,
          url: row.url
        }))
      : safeCertifications;
  } catch (error) {
    markDatabaseUnavailable(error);
    return safeCertifications;
  }
});

export const getAchievements = cache(async (): Promise<AchievementSignal[]> => {
  if (!canReadDatabase()) return safeAchievements;
  try {
    const rows = await withRetry(() => queryAchievements());
    return rows.length
      ? rows.map((row) => ({
          id: row.id,
          title: row.title,
          issuer: row.issuer,
          category: row.category,
          summary: row.summary,
          awardedAt: row.awardedAt,
          proofUrl: row.proofUrl,
          imageUrl: row.imageUrl,
          imageRatio: row.imageRatio === "1/1" || row.imageRatio === "16/9" ? row.imageRatio : "4/3",
          highlighted: row.highlighted,
          sortOrder: row.sortOrder,
          publishedAt: row.publishedAt instanceof Date ? row.publishedAt.toISOString() : row.publishedAt ?? undefined
        }))
      : safeAchievements;
  } catch (error) {
    markDatabaseUnavailable(error);
    return safeAchievements;
  }
});

export const getPortfolioDocuments = cache(async (): Promise<PortfolioDocument[]> => {
  if (!canReadDatabase()) return safePortfolioDocuments;
  try {
    const rows = await withRetry(() =>
      prisma.portfolioDocument.findMany({
        where: { visibility: "PUBLISHED" },
        orderBy: [{ kind: "asc" }, { publishedAt: "desc" }]
      })
    );
    return rows.length
      ? rows.map((row) => ({
          id: row.id,
          kind: row.kind,
          title: row.title,
          description: row.description,
          fileUrl: row.fileUrl,
          versionLabel: row.versionLabel,
          publishedAt: row.publishedAt?.toISOString()
        }))
      : safePortfolioDocuments;
  } catch (error) {
    markDatabaseUnavailable(error);
    return safePortfolioDocuments;
  }
});

import { isVolatileExternalMedia } from "@/lib/media";
import type { CertificationSignal, ExplorerItem } from "@/lib/types";

type HealthKind = ExplorerItem["kind"] | "site-profile" | "certification" | "timeline";

type ContentHealthContext = {
  profile?: { heroTitle?: string; heroSummary?: string };
  certifications?: CertificationSignal[];
  timeline?: Array<{ id?: string; title: string; description: string }>;
};

export type ContentHealthIssue = {
  kind: HealthKind;
  slug: string;
  title: string;
  message: string;
};

const markdownLink = /!?(?:\[[^\]]*\])\(https?:\/\//i;
const copyDefect = /\b(?:isin't|Artifificial|Architectured|Applictions|reccords)\b|Secured hands on/i;
const stalePreviewUrl = /rahul-portfolio-[\w-]+-rahul-inxs-projects\.vercel\.app/i;

export function scanContentHealth(items: ExplorerItem[], context: ContentHealthContext = {}) {
  const issues: ContentHealthIssue[] = [];

  for (const item of items) {
    const summary = "summary" in item ? item.summary : item.excerpt;
    if (markdownLink.test(summary)) {
      issues.push({ kind: item.kind, slug: item.slug, title: item.title, message: "Card copy contains Markdown; public cards show plain text." });
    }
    if (isVolatileExternalMedia(item.imageUrl)) {
      issues.push({ kind: item.kind, slug: item.slug, title: item.title, message: "LinkedIn-hosted media can expire; upload a copy to the CMS." });
    }
    if (copyDefect.test(JSON.stringify(item))) {
      issues.push({ kind: item.kind, slug: item.slug, title: item.title, message: "Published copy contains a known spelling or grammar defect." });
    }
    if (stalePreviewUrl.test(JSON.stringify(item))) {
      issues.push({ kind: item.kind, slug: item.slug, title: item.title, message: "Published copy links to an old protected Vercel preview; use a canonical relative route." });
    }
    if (item.kind === "project" && !item.githubUrl && !item.demoUrl) {
      issues.push({ kind: item.kind, slug: item.slug, title: item.title, message: "No public repo or demo is linked; add sanitized proof or keep the limitation explicit." });
    }
    if (item.kind === "project" && item.metrics.some((metric) => /^↓\s*\d+$/.test(metric.value.trim()))) {
      issues.push({ kind: item.kind, slug: item.slug, title: item.title, message: "A reduction metric is missing its unit or percentage." });
    }
  }

  const profileCopy = `${context.profile?.heroTitle ?? ""} ${context.profile?.heroSummary ?? ""}`;
  if (copyDefect.test(profileCopy)) {
    issues.push({ kind: "site-profile", slug: "main", title: "Homepage hero", message: "Hero copy contains a known spelling or grammar defect." });
  }

  for (const certification of context.certifications ?? []) {
    if (!certification.url) {
      issues.push({ kind: "certification", slug: certification.id ?? certification.title, title: certification.title, message: "Credential has no public verification or uploaded proof link." });
    }
  }

  for (const event of context.timeline ?? []) {
    if (copyDefect.test(event.description)) {
      issues.push({ kind: "timeline", slug: event.id ?? event.title, title: event.title, message: "Timeline copy contains a known spelling or grammar defect." });
    }
    if (stalePreviewUrl.test(event.description)) {
      issues.push({ kind: "timeline", slug: event.id ?? event.title, title: event.title, message: "Timeline links to an old protected Vercel preview; use a canonical relative route." });
    }
  }

  return issues;
}

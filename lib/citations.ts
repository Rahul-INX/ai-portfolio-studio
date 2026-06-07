import type { ContentKind } from "@/lib/types";

export type CitationTarget = {
  kind: ContentKind | "profile" | "timeline" | "skill" | "certification" | "explorer" | "document" | "cv";
  slug?: string;
  title: string;
  section?: string;
};

export function slugifySection(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function routeForTarget(target: Pick<CitationTarget, "kind" | "slug">) {
  if (target.kind === "profile") return "/";
  if (target.kind === "timeline") return "/timeline";
  if (target.kind === "skill") return "/timeline";
  if (target.kind === "certification") return "/timeline";
  if (target.kind === "explorer") return "/explorer";
  if (target.kind === "document") return "/timeline";
  if (target.kind === "cv") return "/cv";
  if (!target.slug) return "/";
  if (target.kind === "project") return `/project/${target.slug}`;
  if (target.kind === "case-study") return `/case-study/${target.slug}`;
  if (target.kind === "experiment") return `/experiment/${target.slug}`;
  if (target.kind === "blog") return `/blog/${target.slug}`;
  if (target.kind === "dashboard") return `/dashboard/${target.slug}`;
  return "/";
}

export function sectionRouteForTarget(target: Pick<CitationTarget, "kind" | "slug" | "section">) {
  const route = routeForTarget(target);
  return target.section ? `${route}#${slugifySection(target.section)}` : route;
}

export function citationLabel(target: Pick<CitationTarget, "title" | "section">) {
  return target.section ? `${target.title} - ${target.section}` : target.title;
}

export function citationLink(target: CitationTarget) {
  return `[${citationLabel(target)}](${sectionRouteForTarget(target)})`;
}

export function contentKindLabel(kind: CitationTarget["kind"]) {
  if (kind === "case-study") return "Case Study";
  return kind
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

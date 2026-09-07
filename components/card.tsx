"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ExplorerItem } from "@/lib/types";
import { ContextualEditLink } from "@/components/contextual-edit-link";
import { useEditMode } from "@/components/edit-mode-provider";
import { InlineContentField } from "@/components/inline-content-field";
import { markdownToPlainText } from "@/lib/markdown";

const kindLabel: Record<ExplorerItem["kind"], string> = {
  project: "Project",
  "case-study": "Case Study",
  experiment: "Experiment",
  blog: "Blog",
  dashboard: "Dashboard"
};

/**
 * Color mapping for each content kind.
 * Uses CSS custom properties set by the kind-color system:
 *   badge bg (light tint), text (saturated), border (mid-opacity)
 */
const kindStyle: Record<ExplorerItem["kind"], { bg: string; text: string; border: string; dot: string }> = {
  project:      { bg: "bg-blue-50   dark:bg-blue-950/40",   text: "text-blue-700   dark:text-blue-300",  border: "border-blue-200 dark:border-blue-800",  dot: "bg-blue-500" },
  "case-study": { bg: "bg-amber-50  dark:bg-amber-950/40",  text: "text-amber-700  dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500" },
  experiment:   { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800", dot: "bg-violet-500" },
  blog:         { bg: "bg-teal-50   dark:bg-teal-950/40",   text: "text-teal-700   dark:text-teal-300",  border: "border-teal-200 dark:border-teal-800",  dot: "bg-teal-500" },
  dashboard:    { bg: "bg-rose-50   dark:bg-rose-950/40",   text: "text-rose-700   dark:text-rose-300",  border: "border-rose-200 dark:border-rose-800",  dot: "bg-rose-500" },
};

export function ContentCard({ item }: { item: ExplorerItem }) {
  const { editMode } = useEditMode();
  const href = `/${item.kind}/${item.slug}`;
  const style = kindStyle[item.kind];
  const summary = "summary" in item ? item.summary : item.excerpt;
  const readableSummary = markdownToPlainText(summary);
  const projectMetric = item.kind === "project" ? item.metrics.find((metric) => metric.accent) ?? item.metrics[0] : undefined;
  const evidence =
    item.kind === "project" ? item.businessImpact :
    item.kind === "case-study" ? item.businessValue :
    item.kind === "experiment" ? item.findings :
    undefined;
  const stack = item.kind === "project" ? item.techStack : item.tags;

  return (
    <article
      aria-label={`Open ${item.title}`}
      className="surface group relative flex min-h-[23rem] flex-col rounded-lg p-6 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]"
    >
      {!editMode ? <Link href={href} aria-label={`Open ${item.title}`} className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2" /> : null}
      <div className="flex items-center justify-between gap-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs uppercase tracking-[0.14em] ${style.bg} ${style.text} ${style.border}`}
        >
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
          {kindLabel[item.kind]}
        </span>
        <div className="flex items-center gap-2">
        <ContextualEditLink kind={item.kind} record={item.slug} label={item.title} />
        <ArrowUpRight aria-hidden className="h-4 w-4 transition group-hover:text-[var(--accent)]" />
        </div>
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-[-0.025em]">
        <InlineContentField item={item} field="title" label={`${item.title} title`} value={item.title} />
      </h3>
      <div className="mt-3 line-clamp-3 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground),transparent_28%)]">
        <InlineContentField item={item} field={item.kind === "blog" ? "excerpt" : "summary"} label={`${item.title} summary`} value={summary} displayValue={readableSummary} multiline />
      </div>
      {projectMetric ? (
        <div className="mt-5 border-l-2 border-[var(--signal)] pl-3">
          <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--muted)]">{projectMetric.label}</p>
          <p className="mt-1 text-base font-semibold">{projectMetric.value}</p>
        </div>
      ) : evidence ? (
        <p className="mt-5 line-clamp-2 border-l-2 border-[var(--accent)] pl-3 text-xs leading-5 text-[var(--muted)]">
          {markdownToPlainText(evidence)}
        </p>
      ) : null}
      <div className="mt-auto pt-6">
        <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Stack and methods</p>
        <div className="flex flex-wrap gap-2">
        {stack.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-md bg-[color-mix(in_srgb,var(--accent-soft),transparent_72%)] px-2.5 py-1 text-xs">
            {tag}
          </span>
        ))}
        </div>
      </div>
    </article>
  );
}

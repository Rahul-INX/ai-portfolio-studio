import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ExplorerItem } from "@/lib/types";

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
  const style = kindStyle[item.kind];

  return (
    <article className="surface flex min-h-64 flex-col rounded-lg p-5 transition duration-200 hover:-translate-y-0.5 hover:border-cobalt-500">
      <div className="flex items-center justify-between gap-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs uppercase tracking-[0.14em] ${style.bg} ${style.text} ${style.border}`}
        >
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
          {kindLabel[item.kind]}
        </span>
        <Link
          href={`/${item.kind}/${item.slug}`}
          aria-label={`Open ${item.title}`}
          className="grid h-9 w-9 place-items-center rounded-md border hairline transition hover:border-cobalt-500"
        >
          <ArrowUpRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-normal">{item.title}</h3>
      <p className="mt-3 line-clamp-4 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground),transparent_28%)]">
        {"summary" in item ? item.summary : item.excerpt}
      </p>
      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        {item.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-md bg-[color-mix(in_srgb,var(--accent-soft),transparent_72%)] px-2.5 py-1 text-xs">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

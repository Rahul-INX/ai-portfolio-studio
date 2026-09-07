"use client";

import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { ContentCard } from "@/components/card";
import type { ContentKind, ExplorerItem } from "@/lib/types";

/* ─── Type filter definitions ─────────────────────────────────── */

type TypeFilter = { kind: ContentKind; label: string; dot: string; activeBg: string; activeText: string; activeBorder: string };

const typeFilters: TypeFilter[] = [
  { kind: "project",    label: "Projects",      dot: "bg-blue-500",    activeBg: "bg-blue-50 dark:bg-blue-950/40",      activeText: "text-blue-700 dark:text-blue-300",      activeBorder: "border-blue-200 dark:border-blue-800" },
  { kind: "case-study", label: "Case Studies",   dot: "bg-amber-500",   activeBg: "bg-amber-50 dark:bg-amber-950/40",    activeText: "text-amber-700 dark:text-amber-300",    activeBorder: "border-amber-200 dark:border-amber-800" },
  { kind: "experiment", label: "Experiments",    dot: "bg-violet-500",  activeBg: "bg-violet-50 dark:bg-violet-950/40",  activeText: "text-violet-700 dark:text-violet-300",  activeBorder: "border-violet-200 dark:border-violet-800" },
  { kind: "blog",       label: "Blogs",          dot: "bg-teal-500",    activeBg: "bg-teal-50 dark:bg-teal-950/40",      activeText: "text-teal-700 dark:text-teal-300",      activeBorder: "border-teal-200 dark:border-teal-800" },
  { kind: "dashboard",  label: "Dashboards",     dot: "bg-rose-500",    activeBg: "bg-rose-50 dark:bg-rose-950/40",      activeText: "text-rose-700 dark:text-rose-300",      activeBorder: "border-rose-200 dark:border-rose-800" },
];

/* ─── Tag filters (derived from items) ────────────────────────── */

function deriveTagFilters(items: ExplorerItem[]): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  // Top 12 tags by frequency
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag]) => tag);
}

/* ─── Component ───────────────────────────────────────────────── */

export function ExplorerClient({ items }: { items: ExplorerItem[] }) {
  const [query, setQuery] = useState("");
  const [activeKinds, setActiveKinds] = useState<Set<ContentKind>>(new Set());
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  const publishableItems = useMemo(
    () => items.filter((item) => item.kind !== "dashboard" || Boolean(item.embedUrl || item.imageUrl)),
    [items],
  );
  const featured = useMemo(() => {
    const featuredProjects = publishableItems.filter(
      (item): item is Extract<ExplorerItem, { kind: "project" }> => item.kind === "project" && Boolean(item.featured),
    );
    const remainingProjects = publishableItems.filter(
      (item): item is Extract<ExplorerItem, { kind: "project" }> => item.kind === "project" && !item.featured,
    );
    return [...featuredProjects, ...remainingProjects].slice(0, 3);
  }, [publishableItems]);

  const tagFilters = useMemo(() => deriveTagFilters(publishableItems), [publishableItems]);

  // Compute available kinds with counts
  const kindCounts = useMemo(() => {
    const counts = new Map<ContentKind, number>();
    for (const item of publishableItems) {
      counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
    }
    return counts;
  }, [publishableItems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return publishableItems.filter((item) => {
      const text = `${item.title} ${"summary" in item ? item.summary : item.excerpt} ${item.tags.join(" ")}`.toLowerCase();
      const matchesQuery = !q || text.includes(q);
      const matchesKind = activeKinds.size === 0 || activeKinds.has(item.kind);
      const matchesTag = !activeTag || item.tags.includes(activeTag);
      return matchesQuery && matchesKind && matchesTag;
    });
  }, [activeKinds, activeTag, publishableItems, query]);

  const archiveIsOpen = showArchive || Boolean(query || activeKinds.size || activeTag);

  function toggleKind(kind: ContentKind) {
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) {
        next.delete(kind);
      } else {
        next.add(kind);
      }
      return next;
    });
  }

  return (
    <div>
      <section aria-labelledby="featured-work-title">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b hairline pb-5">
          <div>
            <p className="eyebrow">Start here</p>
            <h2 id="featured-work-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Selected work</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[var(--muted)]">Three systems chosen for the clearest evidence of product thinking, technical judgment, and implementation depth.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((item) => <ContentCard key={`${item.kind}-${item.slug}`} item={item} />)}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="archive-title">
        <div className="surface overflow-hidden rounded-lg">
          <button
            type="button"
            aria-expanded={archiveIsOpen}
            aria-controls="portfolio-archive"
            onClick={() => setShowArchive((current) => !current)}
            className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-[color-mix(in_srgb,var(--accent),transparent_94%)]"
          >
            <span>
              <span className="eyebrow">Supporting evidence</span>
              <span id="archive-title" className="mt-2 block text-lg font-semibold">Browse the full archive</span>
              <span className="mt-1 block text-sm text-[var(--muted)]">Experiments, writing, and additional systems stay available without competing with the hiring story.</span>
            </span>
            <ArrowRight aria-hidden className={`h-5 w-5 shrink-0 transition ${archiveIsOpen ? "rotate-90" : ""}`} />
          </button>
        </div>

        {archiveIsOpen ? <div id="portfolio-archive" className="mt-4">
      <div className="surface rounded-lg p-4">
        {/* Search bar */}
        <label className="relative block">
          <span className="sr-only">Search portfolio content</span>
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, experiments, writing, dashboards..."
            className="h-12 w-full rounded-md border hairline bg-[var(--panel-strong)] pl-11 pr-4 text-sm outline-none transition placeholder:text-[color-mix(in_srgb,var(--foreground),transparent_58%)] focus:border-cobalt-500"
          />
        </label>

        {/* Type filters */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2.5">
            <SlidersHorizontal aria-hidden className="h-3.5 w-3.5 text-[var(--muted)]" />
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--muted)]">Type</span>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Content type filters">
            {typeFilters.map((tf) => {
              const isActive = activeKinds.has(tf.kind);
              const count = kindCounts.get(tf.kind) ?? 0;
              if (count === 0) return null;
              return (
                <button
                  key={tf.kind}
                  type="button"
                  onClick={() => toggleKind(tf.kind)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? `${tf.activeBg} ${tf.activeText} ${tf.activeBorder}`
                      : "border-[var(--line)] text-[var(--muted)] hover:border-[color-mix(in_srgb,var(--foreground),transparent_60%)]"
                  }`}
                >
                  <span className={`inline-block h-2 w-2 rounded-full transition-opacity ${tf.dot} ${isActive ? "opacity-100" : "opacity-40"}`} aria-hidden />
                  {tf.label}
                  <span className={`ml-0.5 font-mono text-[0.6rem] tabular-nums ${isActive ? "opacity-80" : "opacity-40"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
            {activeKinds.size > 0 && (
              <button
                type="button"
                onClick={() => setActiveKinds(new Set())}
                className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-red-400 hover:text-red-500"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Tag filters */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--muted)]">Topics</span>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Topic filters">
            <button
              type="button"
              role="tab"
              aria-selected={!activeTag}
              onClick={() => setActiveTag(null)}
              className="rounded-md border px-3 py-1.5 text-xs transition aria-selected:border-cobalt-500 aria-selected:bg-cobalt-500 aria-selected:text-white"
            >
              All Topics
            </button>
            {tagFilters.map((tag) => (
              <button
                key={tag}
                type="button"
                role="tab"
                aria-selected={activeTag === tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className="rounded-md border px-3 py-1.5 text-xs transition aria-selected:border-cobalt-500 aria-selected:bg-cobalt-500 aria-selected:text-white"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          {activeKinds.size > 0 || activeTag || query
            ? `${filtered.length} matching items`
            : `${filtered.length} ${filtered.length === 1 ? "item" : "items"}`}
        </p>
        {(activeKinds.size > 0 || activeTag || query) && (
          <button
            type="button"
            onClick={() => { setQuery(""); setActiveKinds(new Set()); setActiveTag(null); }}
            className="text-xs text-[var(--muted)] underline underline-offset-2 transition hover:text-[var(--foreground)]"
          >
            Reset all
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <ContentCard key={`${item.kind}-${item.slug}`} item={item} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-lg font-medium text-[var(--muted)]">No items match your filters</p>
          <p className="mt-2 text-sm text-[color-mix(in_srgb,var(--muted),transparent_40%)]">
            Try broadening your search or removing some filters.
          </p>
        </div>
      )}
        </div> : null}
      </section>
    </div>
  );
}

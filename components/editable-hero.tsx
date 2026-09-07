"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Database, SearchCheck, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { EditableSection } from "@/components/editable-section";
import { readApiResponse } from "@/lib/api-response";
import type { SiteProfile } from "@/lib/types";

const signals = [
  { icon: Database, label: "focusLabel", value: "focusValue" },
  { icon: ShieldCheck, label: "styleLabel", value: "styleValue" },
  { icon: BarChart3, label: "modelLabel", value: "modelValue" }
] as const;

function publicSignal(value: string, fallback: string) {
  return /\b(editable|edit mode|cms)\b/i.test(value) ? fallback : value;
}

export function EditableHero({ profile }: { profile: SiteProfile }) {
  const router = useRouter();
  const [draft, setDraft] = useState(profile);
  const [status, setStatus] = useState<"clean" | "dirty" | "saving" | "saved" | "error">("clean");
  const [message, setMessage] = useState("");

  function update(field: keyof SiteProfile, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setStatus("dirty");
    setMessage("Unsaved changes");
  }

  async function save(close: () => void) {
    setStatus("saving");
    setMessage("Saving...");
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "site-profile", ...draft, id: undefined })
      });
      await readApiResponse(response);
      setStatus("saved");
      setMessage("Saved and published");
      router.refresh();
      close();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Save failed.");
    }
  }

  return (
    <EditableSection
      label="hero"
      editor={({ close }) => (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save(close);
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Inline editor</p>
              <h2 className="mt-2 text-2xl font-semibold">Hero content</h2>
            </div>
            <button type="button" onClick={close} className="grid h-10 w-10 place-items-center rounded-md border hairline" aria-label="Close hero editor">
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-7 grid gap-5">
            {[
              ["heroEyebrow", "Eyebrow", 1],
              ["heroTitle", "Headline", 3],
              ["heroSummary", "Summary", 5],
              ["primaryCtaLabel", "Primary CTA", 1],
              ["secondaryCtaLabel", "Secondary CTA", 1]
            ].map(([field, label, rows]) => (
              <label key={field}>
                <span className="text-sm font-semibold">{label}</span>
                <textarea
                  value={String(draft[field as keyof SiteProfile] ?? "")}
                  rows={Number(rows)}
                  onChange={(event) => update(field as keyof SiteProfile, event.target.value)}
                  className="mt-2 w-full rounded-lg border hairline bg-[var(--panel)] px-3 py-2 outline-none focus:border-[var(--accent)]"
                />
              </label>
            ))}
            <div className="grid gap-4 sm:grid-cols-2">
              {signals.flatMap((signal) => [
                <label key={signal.label}>
                  <span className="text-sm font-semibold">Signal label</span>
                  <input value={draft[signal.label]} onChange={(event) => update(signal.label, event.target.value)} className="mt-2 h-11 w-full rounded-lg border hairline bg-[var(--panel)] px-3" />
                </label>,
                <label key={signal.value}>
                  <span className="text-sm font-semibold">Signal value</span>
                  <input value={draft[signal.value]} onChange={(event) => update(signal.value, event.target.value)} className="mt-2 h-11 w-full rounded-lg border hairline bg-[var(--panel)] px-3" />
                </label>
              ])}
            </div>
          </div>
          <div className="sticky bottom-0 mt-7 flex items-center justify-between gap-4 border-t hairline bg-[var(--panel-strong)] py-4">
            <p aria-live="polite" className={`text-sm ${status === "error" ? "text-red-700 dark:text-red-300" : "text-[var(--muted)]"}`}>{message || "No unsaved changes"}</p>
            <button disabled={status === "saving" || status === "clean"} className="h-11 rounded-md bg-[var(--foreground)] px-5 text-sm font-semibold text-[var(--background)] disabled:opacity-50">
              {status === "saving" ? "Saving..." : "Save hero"}
            </button>
          </div>
        </form>
      )}
    >
      <div className="p-1">
        <p className="eyebrow">{draft.heroEyebrow}</p>
        <h1 className="display-title editorial-title text-balance mt-6 max-w-5xl text-[var(--foreground)]">{draft.heroTitle}</h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-[var(--text-secondary)] sm:text-xl">{draft.heroSummary}</p>
        <div className="mt-8 grid gap-px overflow-hidden rounded-xl border hairline bg-[var(--line)] sm:grid-cols-3">
          {signals.map((signal) => (
            <div key={signal.label} className="bg-[var(--panel-strong)] p-4">
              <div className="flex items-center gap-2">
                <signal.icon aria-hidden className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--muted)]">{publicSignal(draft[signal.label], "Evidence signal")}</p>
              </div>
              <p className="mt-2 text-sm font-semibold leading-5">{publicSignal(draft[signal.value], "Explore the work, methods, and results.")}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/explorer" className="inline-flex h-12 items-center gap-2 rounded-md bg-[var(--foreground)] px-5 text-sm font-semibold text-[var(--background)] transition hover:bg-[var(--accent)] hover:text-white">
            {draft.primaryCtaLabel} <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
          <Link href="/timeline" className="inline-flex h-12 items-center rounded-md border hairline px-5 text-sm font-semibold transition hover:border-[var(--accent)]">
            {draft.secondaryCtaLabel}
          </Link>
          <Link href="/job-fit" className="inline-flex h-12 items-center gap-2 rounded-md border hairline px-5 text-sm font-semibold transition hover:border-[var(--accent)]">
            Check Job Fit <SearchCheck aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </EditableSection>
  );
}

"use client";

import { CheckCircle2, FileText, ShieldAlert, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { readApiResponse } from "@/lib/api-response";

type ReviewKind = "project" | "case-study" | "experiment" | "blog" | "dashboard";
type ReviewResult = {
  draft: { title: string; summary: string; tags: string[]; reviewNotes: string[] };
  provider: string;
  model: string;
  findings: Array<{ type: "redacted" | "review"; label: string }>;
  requiresOwnerReview: boolean;
};

export function PortfolioSafetyReview({
  kind,
  onApply,
}: {
  kind: ReviewKind;
  onApply: (draft: ReviewResult["draft"]) => void;
}) {
  const [sourceText, setSourceText] = useState("");
  const [restrictedTerms, setRestrictedTerms] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function analyze() {
    setBusy(true);
    setMessage("Creating a redacted, public-safe draft...");
    setReview(null);
    try {
      const formData = new FormData();
      formData.set("kind", kind);
      formData.set("sourceText", sourceText);
      formData.set("restrictedTerms", restrictedTerms);
      if (file) formData.set("sourceFile", file);
      const result = await readApiResponse<ReviewResult>(await fetch("/api/admin/portfolio-safety", { method: "POST", body: formData }));
      setReview(result);
      setMessage("Draft ready. Review it before applying or saving.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The safety review could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[var(--accent)]/30 bg-[color-mix(in_srgb,var(--accent),transparent_94%)] md:col-span-2" aria-labelledby="publish-safety-title">
      <div className="border-b border-[var(--accent)]/20 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Publish-safety review</p>
            <h2 id="publish-safety-title" className="mt-2 text-xl font-semibold">Turn private working notes into a public portfolio draft</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Raw material is not stored by this review. Obvious identifiers and owner-marked terms are redacted before the configured AI provider receives the source. You must still review every draft.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--panel-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]"><ShieldAlert aria-hidden className="h-4 w-4" /> Human approval required</span>
        </div>
      </div>
      <div className="grid gap-4 p-5 sm:p-6">
        <label>
          <span className="text-sm font-semibold">Paste working notes</span>
          <textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} rows={7} placeholder="Paste your notes, implementation summary, or sanitized work description…" className="mt-2 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 py-2 text-sm leading-6 outline-none focus:border-[var(--accent)]" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-sm font-semibold">Or attach TXT, PDF, or DOCX</span>
            <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">Up to 4 MB. Legacy .doc files should be saved as DOCX or pasted.</span>
            <span className="mt-2 flex h-11 items-center gap-2 rounded-md border hairline bg-[var(--panel-strong)] px-3 text-sm">
              <Upload aria-hidden className="h-4 w-4 text-[var(--accent)]" />
              <input type="file" accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="min-w-0 text-sm" />
            </span>
            {file ? <span className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]"><FileText aria-hidden className="h-3.5 w-3.5" />{file.name}</span> : null}
          </label>
          <label>
            <span className="text-sm font-semibold">Organization/client/product terms to remove</span>
            <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">Comma-separated. Add names the automatic review cannot reliably infer.</span>
            <input value={restrictedTerms} onChange={(event) => setRestrictedTerms(event.target.value)} placeholder="Company, client, product, internal tool" className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 text-sm outline-none focus:border-[var(--accent)]" />
          </label>
        </div>
        <label className="flex items-start gap-3 rounded-md border hairline bg-[var(--panel-strong)] p-3 text-sm leading-6">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
          <span>I have removed material I am not allowed to process, and I understand this creates a draft—not a confidentiality certification or an automatic publication.</span>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-[var(--muted)]">{message || "Nothing has been sent or saved yet."}</p>
          <button type="button" onClick={analyze} disabled={!confirmed || busy} className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"><Sparkles aria-hidden className="h-4 w-4" />{busy ? "Reviewing…" : "Create safe draft"}</button>
        </div>
      </div>
      {review ? (
        <div className="border-t border-[var(--accent)]/20 bg-[var(--panel-strong)] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="eyebrow">Editable result</p><p className="mt-1 text-sm text-[var(--muted)]">Generated with {review.provider} · {review.model}</p></div>
            <button type="button" onClick={() => onApply(review.draft)} className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent)] transition hover:bg-[color-mix(in_srgb,var(--accent),transparent_90%)]"><CheckCircle2 aria-hidden className="h-4 w-4" />Use this draft in the editor</button>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-md border hairline p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Suggested title</p><p className="mt-2 text-lg font-semibold">{review.draft.title}</p><p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Suggested tags</p><div className="mt-2 flex flex-wrap gap-2">{review.draft.tags.map((tag) => <span key={tag} className="rounded-md bg-[var(--surface-support)] px-2 py-1 text-xs">{tag}</span>)}</div></div>
            <div className="rounded-md border hairline p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Suggested public summary</p><p className="mt-2 text-sm leading-7">{review.draft.summary}</p></div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Redaction log</p><ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">{review.findings.filter((finding) => finding.type === "redacted").length ? review.findings.filter((finding) => finding.type === "redacted").map((finding) => <li key={finding.label}>• {finding.label}</li>) : <li>• No automatic identifiers detected.</li>}</ul></div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Owner review before publishing</p><ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">{review.draft.reviewNotes.map((note) => <li key={note}>• {note}</li>)}<li>• Confirm no confidential detail remains.</li></ul></div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

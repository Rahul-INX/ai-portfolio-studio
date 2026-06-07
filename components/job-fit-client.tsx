"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleDot,
  FileText,
  Gauge,
  Loader2,
  Pencil,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Upload
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { JobFitResult } from "@/lib/job-fit";

const samplePrompt =
  "Paste a JD for a GenAI, RAG, data science, ML engineer, NLP, backend AI, or analytics role. The brief will compare it against public portfolio evidence only.";
const generationStages = [
  "Reading role requirements",
  "Retrieving portfolio evidence",
  "Comparing skills and project signals",
  "Preparing the recruiter brief"
];

function scoreTone(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-cobalt-500";
  if (score >= 35) return "bg-amber-500";
  return "bg-rose-500";
}

function statusTone(status: string) {
  if (status === "Strong") return "text-emerald-700 dark:text-emerald-300";
  if (status === "Moderate") return "text-cobalt-600 dark:text-cobalt-300";
  if (status === "Limited") return "text-amber-700 dark:text-amber-300";
  return "text-rose-700 dark:text-rose-300";
}

function alignmentTone(status: JobFitResult["alignmentNotes"][number]["status"]) {
  if (status === "Aligned") return { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" };
  if (status === "Partial") return { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" };
  return { dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-300" };
}

function ResultPanel({ result }: { result: JobFitResult }) {
  const positiveDimensions = result.dimensions.slice(0, 7);
  const gapDimension = result.dimensions[7];
  const alignedNotes = result.alignmentNotes.filter((item) => item.status === "Aligned");
  const reviewNotes = result.alignmentNotes.filter((item) => item.status !== "Aligned");

  return (
    <div className="min-w-0 space-y-4 overflow-hidden" aria-live="polite">
      <section className="surface rounded-lg p-5">
        <div className="grid min-w-0 items-center gap-5 md:grid-cols-[minmax(13rem,0.32fr)_minmax(0,0.68fr)]">
          <div className="min-w-0 md:border-r md:pr-5 hairline">
            <div className="flex items-center gap-2">
              <Gauge aria-hidden className="h-5 w-5 text-cobalt-500" />
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
                Overall Fit
              </p>
            </div>
            <div className="mt-5 flex items-end gap-3">
              <span className="text-6xl font-semibold tracking-normal tabular-nums">{result.overallScore}</span>
              <span className="pb-2 text-sm text-[var(--muted)]">/ 100</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border hairline bg-[var(--panel-strong)] px-3 py-1.5 text-sm font-semibold">
                {result.fitLabel}
              </span>
              <span className="rounded-md border hairline px-3 py-1.5 text-sm text-[var(--muted)]">
                {result.confidence} confidence
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border hairline px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                {result.mode === "specialist-agent" ? "Resume Match Specialist" : "Deterministic fallback"}
              </span>
              <span className="text-xs text-[var(--muted)]">
                {alignedNotes.length} aligned / {reviewNotes.length} to validate
              </span>
            </div>
            <p className="mt-3 break-words text-base leading-7 text-[color-mix(in_srgb,var(--foreground),transparent_18%)]">
              {result.verdict}
            </p>
          </div>
        </div>

        <div className="mt-5 border-t hairline pt-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 aria-hidden className="h-4 w-4 text-cobalt-500" />
            <h2 className="text-sm font-semibold">Fit Dimensions</h2>
          </div>
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
            {positiveDimensions.map((dimension) => (
              <div key={dimension.name} className="min-w-0">
                <div className="mb-1.5 grid min-h-8 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-xs">
                  <span className="min-w-0 break-words font-medium leading-4">{dimension.name}</span>
                  <span className={`font-mono leading-4 ${statusTone(dimension.status)}`}>
                    {dimension.score}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--foreground),transparent_90%)]">
                  <div
                    className={`h-full rounded-full ${scoreTone(dimension.score)}`}
                    style={{ width: `${dimension.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-2 border-t hairline pt-4 md:grid-cols-[minmax(11rem,0.25fr)_minmax(0,0.75fr)] md:items-start">
            <p className="break-words text-xs font-semibold">{gapDimension.name}</p>
            <p className="break-words text-xs leading-5 text-[var(--muted)]">{gapDimension.rationale}</p>
          </div>
        </div>
      </section>

      <section className="surface rounded-lg p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CircleDot aria-hidden className="h-5 w-5 text-cobalt-500" />
              <h2 className="text-base font-semibold">Points to Note</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              JD requirements separated by direct public evidence and items that still need validation.
            </p>
          </div>
          <span className="rounded-full border hairline px-3 py-1 font-mono text-xs text-[var(--muted)]">
            {alignedNotes.length} aligned / {reviewNotes.length} to validate
          </span>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {[
            { title: "What aligns", items: alignedNotes, empty: "No direct public alignment was found.", titleClass: "text-emerald-700 dark:text-emerald-300" },
            { title: "What needs validation", items: reviewNotes, empty: "All extracted requirements have direct public evidence.", titleClass: "text-amber-700 dark:text-amber-300" }
          ].map((group) => (
            <div key={group.title} className="rounded-md border hairline bg-[var(--panel-strong)] p-4">
              <h3 className={`text-sm font-semibold ${group.titleClass}`}>{group.title}</h3>
              {group.items.length ? (
                <ul className="mt-3 space-y-3">
                  {group.items.map((item) => {
                    const tone = alignmentTone(item.status);
                    return (
                      <li key={item.requirement} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                        <span className={`mt-2 h-2 w-2 rounded-full ${tone.dot}`} aria-hidden />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">{item.requirement}</p>
                            {item.status !== "Aligned" ? <span className={`text-[0.65rem] font-semibold uppercase tracking-wide ${tone.text}`}>{item.status}</span> : null}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.note}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{group.empty}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="surface rounded-lg p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <SearchCheck aria-hidden className="h-5 w-5 text-cobalt-500" />
              <h2 className="text-base font-semibold">Evidence Dashboard</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Only site resources with verified overlap to this JD are shown.</p>
          </div>
          <span className="rounded-full border hairline px-3 py-1 font-mono text-xs text-[var(--muted)]">
            {result.topEvidence.length} relevant source{result.topEvidence.length === 1 ? "" : "s"}
          </span>
        </div>
        {result.topEvidence.length ? (
          <div className="mt-4 divide-y divide-[var(--line)] overflow-hidden rounded-md border hairline bg-[var(--panel-strong)]">
            {result.topEvidence.map((item) => (
              <article key={`${item.title}-${item.url}`} className="grid min-w-0 gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border hairline px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                      {item.type.replace("-", " ")}
                    </span>
                    <h3 className="min-w-0 break-words text-sm font-semibold">{item.title}</h3>
                  </div>
                  <p className="mt-2 break-words text-xs leading-5 text-[var(--muted)]">{item.matchReason}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.matchedSignals.slice(0, 5).map((signal) => (
                      <span key={signal} className="rounded-full bg-[color-mix(in_srgb,var(--accent-soft),transparent_76%)] px-2 py-0.5 text-[0.68rem] text-[var(--muted)]">{signal}</span>
                    ))}
                  </div>
                </div>
                <Link
                  href={item.url}
                  aria-label={`Open evidence source ${item.title}`}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border hairline px-3 text-xs font-medium transition hover:border-cobalt-500 hover:text-cobalt-600"
                >
                  View citation
                  <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-dashed hairline bg-[var(--panel-strong)] p-5">
            <p className="text-sm font-medium">No relevant public evidence found</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              No site resource met the verified-overlap threshold. Requirements remain unproven instead of being matched to nearby content.
            </p>
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface rounded-lg p-5">
          <div className="flex items-center gap-2">
            <AlertCircle aria-hidden className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-semibold">Gap Analysis</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {result.gaps.map((gap) => (
              <li key={gap} className="break-words rounded-md border hairline bg-[var(--panel-strong)] p-3 text-sm leading-6 text-[var(--muted)]">
                {gap}
              </li>
            ))}
          </ul>
        </section>

        <section className="surface rounded-lg p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 aria-hidden className="h-5 w-5 text-emerald-500" />
            <h2 className="text-base font-semibold">Interview Probes</h2>
          </div>
          <ol className="mt-4 space-y-3">
            {result.interviewQuestions.map((question, index) => (
              <li key={question} className="break-words rounded-md border hairline bg-[var(--panel-strong)] p-3 text-sm leading-6 text-[var(--muted)]">
                <span className="mr-2 font-mono text-xs text-cobalt-500">{String(index + 1).padStart(2, "0")}</span>
                {question}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="surface rounded-lg p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck aria-hidden className="h-5 w-5 text-cobalt-500" />
          <h2 className="text-base font-semibold">Unbiased Notes</h2>
        </div>
        <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--muted)] md:grid-cols-2">
          {result.fairnessNotes.map((note) => (
            <li key={note} className="break-words rounded-md border hairline bg-[var(--panel-strong)] p-3">{note}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function JobFitClient({ timeoutSeconds }: { timeoutSeconds: number }) {
  const [jdText, setJdText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<JobFitResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editorExpanded, setEditorExpanded] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(timeoutSeconds);
  const resultPanelRef = useRef<HTMLDivElement>(null);

  const characterCount = jdText.length;
  const canSubmit = useMemo(() => jdText.trim().length >= 80 || Boolean(file), [file, jdText]);
  const elapsedSeconds = timeoutSeconds - secondsRemaining;
  const generationProgress = Math.min(96, Math.max(4, (elapsedSeconds / timeoutSeconds) * 100));
  const generationStage =
    generationStages[
      Math.min(
        generationStages.length - 1,
        Math.floor(elapsedSeconds / Math.max(1, timeoutSeconds / generationStages.length))
      )
    ];

  useEffect(() => {
    if (!loading) return;

    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (!result || loading) return;

    resultPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading, result]);

  async function generateFitBrief() {
    setError("");
    setSecondsRemaining(timeoutSeconds);
    setLoading(true);
    setEditorExpanded(false);

    const formData = new FormData();
    formData.set("jdText", jdText);
    if (file) formData.set("jdFile", file);

    try {
      const response = await fetch("/api/job-fit", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as { result?: JobFitResult; error?: string };
      if (!response.ok || !payload.result) {
        throw new Error(payload.error ?? "Could not generate the fit brief.");
      }
      setResult(payload.result);
      setEditorExpanded(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate the fit brief.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await generateFitBrief();
  }

  return (
    <div className={result ? "min-w-0 space-y-4 overflow-hidden" : "grid min-w-0 items-start gap-6 overflow-hidden xl:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]"}>
      <section className={`surface h-max min-w-0 self-start rounded-lg ${result ? "p-4" : "p-5"}`}>
        <div className={result ? "grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" : "flex flex-wrap items-start justify-between gap-3"}>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText aria-hidden className="h-5 w-5 text-cobalt-500" />
              <h2 className="text-base font-semibold">{result ? "Analyzed Job Description" : "Job Description"}</h2>
            </div>
            {result && !editorExpanded ? (
              <>
                <p className="mt-2 line-clamp-2 max-w-5xl break-words text-sm leading-6 text-[var(--muted)]">
                  {jdText || file?.name}
                </p>
                <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                  {characterCount.toLocaleString()} characters{file ? ` / ${file.name}` : ""}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{samplePrompt}</p>
            )}
          </div>

          {result ? (
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-self-end">
              <button
                type="button"
                onClick={() => setEditorExpanded((current) => !current)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border hairline px-3 text-xs font-medium transition hover:border-cobalt-500"
              >
                <Pencil aria-hidden className="h-3.5 w-3.5" />
                {editorExpanded ? "Close editor" : "Edit JD"}
              </button>
              <button
                type="button"
                onClick={() => void generateFitBrief()}
                disabled={loading || !canSubmit}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-ink-900 px-3 text-xs font-medium text-white transition hover:bg-cobalt-600 disabled:opacity-50 dark:bg-ink-50 dark:text-ink-950"
              >
                <RefreshCw aria-hidden className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Run again
              </button>
            </div>
          ) : null}
        </div>

        {!result || editorExpanded ? <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Paste JD text</span>
            <textarea
              value={jdText}
              onChange={(event) => setJdText(event.target.value)}
              placeholder="Paste responsibilities, required skills, preferred qualifications, and role context..."
              className="mt-2 min-h-72 w-full resize-y rounded-md border hairline bg-[var(--panel-strong)] p-3 text-sm leading-6 outline-none transition placeholder:text-[color-mix(in_srgb,var(--foreground),transparent_58%)] focus:border-cobalt-500"
            />
          </label>

          <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
            <span>{characterCount.toLocaleString()} characters</span>
            <span>Ephemeral analysis only</span>
          </div>

          <label className="block min-w-0 overflow-hidden rounded-md border border-dashed hairline bg-[var(--panel-strong)] p-4 transition hover:border-cobalt-500">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Upload aria-hidden className="h-4 w-4 text-cobalt-500" />
              Attach JD file
            </span>
            <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">Supports .txt, .pdf, and .docx up to 4 MB.</span>
            <input
              type="file"
              accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-3 block w-full min-w-0 max-w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-ink-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white dark:file:bg-ink-50 dark:file:text-ink-950"
            />
            {file ? <span className="mt-2 block text-xs text-[var(--muted)]">{file.name}</span> : null}
          </label>

          {error ? (
            <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ink-900 px-5 text-sm font-medium text-white transition hover:bg-cobalt-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-ink-50 dark:text-ink-950"
          >
            {loading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <SearchCheck aria-hidden className="h-4 w-4" />}
            {result ? "Regenerate Fit Brief" : "Generate Fit Brief"}
          </button>
        </form> : null}
      </section>

      <div ref={resultPanelRef} className="min-w-0 scroll-mt-20">
        {loading ? (
          <section
            className="job-fit-generation surface relative grid min-h-[28rem] overflow-hidden rounded-lg p-6 sm:p-8"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="job-fit-generation-scan" aria-hidden />
            <div className="relative z-10 m-auto w-full max-w-xl text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-md border hairline bg-[color-mix(in_srgb,var(--panel-strong),transparent_12%)] shadow-quiet backdrop-blur-md">
                <Loader2 aria-hidden className="h-6 w-6 animate-spin text-cobalt-500" />
              </div>

              <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
                AI evidence analysis
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">Building the Role Fit Brief</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {secondsRemaining > 0
                  ? `Generating results in up to ${secondsRemaining} second${secondsRemaining === 1 ? "" : "s"}...`
                  : "Finalizing your evidence-backed results..."}
              </p>

              <div className="mt-7 overflow-hidden rounded-full border hairline bg-[color-mix(in_srgb,var(--foreground),transparent_92%)] p-1">
                <div
                  className="job-fit-generation-progress h-2 rounded-full"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>

              <div className="mt-4 flex min-h-6 items-center justify-center gap-2 text-xs text-[var(--muted)]">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>{generationStage}</span>
              </div>
            </div>
          </section>
        ) : result ? (
          <ResultPanel result={result} />
        ) : (
          <section className="surface min-h-[28rem] rounded-lg p-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: Gauge, label: "Fit score", value: "0-100" },
                { icon: BarChart3, label: "Dimensions", value: "8 fixed factors" },
                { icon: ShieldCheck, label: "Evidence", value: "Public site data" }
              ].map((item) => (
                <div key={item.label} className="rounded-md border hairline bg-[var(--panel-strong)] p-4">
                  <item.icon aria-hidden className="h-5 w-5 text-cobalt-500" />
                  <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-md border hairline bg-[var(--panel-strong)] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
                Output Template
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">A repeatable recruiter dashboard, not a black-box claim.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                The brief returns overall fit, factor bars, requirement notes, relevant evidence with compact citations, gaps, interview probes, and fairness notes.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

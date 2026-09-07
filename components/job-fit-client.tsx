"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
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
import { InlineProfileBlock } from "@/components/inline-profile-block";
import type { SiteProfile } from "@/lib/types";

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

function ResultPanel({ result, profile }: { result: JobFitResult; profile: SiteProfile }) {
  const [activeView, setActiveView] = useState<"criteria" | "evidence" | "interview">("criteria");
  const rankedDimensions = [...result.dimensions].sort((a, b) => b.weight - a.weight || a.score - b.score);
  const strongest = [...result.dimensions].filter((item) => item.score >= 52).sort((a, b) => b.score * b.weight - a.score * a.weight).slice(0, 3);
  const materialGaps = rankedDimensions.filter((item) => item.score < 52).slice(0, 3);
  const alignedNotes = result.alignmentNotes.filter((item) => item.status === "Aligned");
  const reviewNotes = result.alignmentNotes.filter((item) => item.status !== "Aligned");
  const evidenceGrade = (score: number) => score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : score >= 30 ? "D" : "Unproven";
  const decision =
    result.overallScore >= 78
      ? profile.jobFitProceedStrongLabel || "Strong evidence to proceed"
      : result.overallScore >= 58
        ? profile.jobFitProceedFocusLabel || "Proceed to focused interview"
        : result.overallScore >= 35
          ? profile.jobFitProceedCautionLabel || "Proceed with caution"
          : profile.jobFitProceedInsufficientLabel || "Insufficient public evidence";
  const analysisModeLabel =
    result.mode === "specialist-agent"
      ? profile.jobFitSpecialistAnalysisLabel || "Specialist analysis"
      : profile.jobFitDeterministicAnalysisLabel || "Deterministic analysis";

  return (
    <div className="job-fit-dossier min-w-0 space-y-4 overflow-hidden" aria-live="polite">
      <section className="surface overflow-hidden rounded-xl">
        <div className="grid gap-6 border-b hairline p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-end">
          <div>
            <p className="eyebrow">{profile.jobFitOutputTitle || "Decision"}</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{decision}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              {profile.jobFitOutputDescription || result.verdict}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--muted)]">
              <span><strong className="text-[var(--foreground)]">{alignedNotes.length}</strong> {profile.jobFitAlignedCriteriaLabel || "aligned criteria"}</span>
              <span><strong className="text-[var(--foreground)]">{reviewNotes.length}</strong> {profile.jobFitNeedValidationLabel || "need validation"}</span>
              <span><strong className="text-[var(--foreground)]">{result.topEvidence.length}</strong> {profile.jobFitCitedSourcesLabel || "cited sources"}</span>
              <span>{analysisModeLabel}</span>
            </div>
          </div>
          <div className="border-t hairline pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="eyebrow">Evidence coverage</p>
            <p className="mt-2 text-lg font-semibold">{result.fitLabel}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{result.confidence} confidence · based on public portfolio evidence</p>
          </div>
        </div>

        <div className="grid divide-y divide-[var(--line)] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
              <InlineProfileBlock profile={profile} field="jobFitStrengthsTitle" label="Job fit strengths title" value={profile.jobFitStrengthsTitle} />
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-5">
              {strongest.length ? strongest.map((item) => <li key={item.name}>{item.name}</li>) : <li className="text-[var(--muted)]">{profile.jobFitNoEvidenceLabel || "No criterion has sufficient direct evidence."}</li>}
            </ul>
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--signal)]">
              <InlineProfileBlock profile={profile} field="jobFitRisksTitle" label="Job fit risks title" value={profile.jobFitRisksTitle} />
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-5">
              {materialGaps.length ? materialGaps.map((item) => <li key={item.name}>{item.name}</li>) : <li className="text-[var(--muted)]">{profile.jobFitNoGapLabel || "No material evidence gaps detected."}</li>}
            </ul>
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              <InlineProfileBlock profile={profile} field="jobFitNextStepTitle" label="Job fit next step title" value={profile.jobFitNextStepTitle} />
            </p>
            <p className="mt-3 text-sm leading-6">{result.interviewQuestions[0]}</p>
          </div>
        </div>
      </section>

      <nav className="surface sticky top-16 z-20 grid grid-cols-3 gap-1 rounded-xl p-1.5 shadow-quiet" aria-label="Fit brief sections">
        {[
          { id: "criteria", label: profile.jobFitCriteriaEyebrow || "Criteria", count: result.dimensions.length },
          { id: "evidence", label: profile.jobFitEvidenceEyebrow || "Evidence", count: result.topEvidence.length },
          { id: "interview", label: profile.jobFitProbeTitle || "Interview", count: result.interviewQuestions.length }
        ].map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => setActiveView(view.id as typeof activeView)}
            aria-pressed={activeView === view.id}
            className={`flex min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
              activeView === view.id
                ? "bg-ink-900 text-white dark:bg-ink-50 dark:text-ink-950"
                : "text-[var(--muted)] hover:bg-[var(--surface-support)] hover:text-[var(--foreground)]"
            }`}
          >
            <span>{view.label}</span>
            <span className={`rounded-full px-1.5 py-0.5 font-mono text-[0.62rem] ${activeView === view.id ? "bg-white/15 dark:bg-black/10" : "bg-[var(--surface-support)]"}`}>
              {view.count}
            </span>
          </button>
        ))}
      </nav>

      <section className={`${activeView === "criteria" ? "block" : "hidden"} surface max-h-[38rem] overflow-y-auto overscroll-contain rounded-xl p-5 sm:p-6`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">
              <InlineProfileBlock profile={profile} field="jobFitCriteriaEyebrow" label="Job fit criteria eyebrow" value={profile.jobFitCriteriaEyebrow} />
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              <InlineProfileBlock profile={profile} field="jobFitCriteriaTitle" label="Job fit criteria title" value={profile.jobFitCriteriaTitle} />
            </h2>
          </div>
          <span className="text-xs text-[var(--muted)]">{result.dimensions.length} criteria extracted from this JD</span>
        </div>
        <div className="mt-5 overflow-hidden rounded-lg border hairline">
          <div className="hidden grid-cols-[minmax(0,1fr)_7rem_6rem_5rem] gap-4 bg-[var(--surface-support)] px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] md:grid">
            <span>{profile.jobFitRequirementLabel || "Requirement"}</span><span>{profile.jobFitPriorityLabel || "Priority"}</span><span>{profile.jobFitEvidenceColumnLabel || "Evidence"}</span><span className="text-right">{profile.jobFitScoreLabel || "Score"}</span>
          </div>
          {rankedDimensions.slice(0, 5).map((dimension) => (
            <article key={dimension.name} className="grid gap-3 border-t hairline p-4 first:border-t-0 md:grid-cols-[minmax(0,1fr)_7rem_6rem_5rem] md:items-center md:gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{dimension.name}</h3>
                  <span className="text-[0.65rem] uppercase tracking-[0.1em] text-[var(--muted)]">{dimension.category}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{dimension.rationale}</p>
              </div>
              <div className="text-xs"><span className="md:hidden text-[var(--muted)]">Priority: </span>{dimension.priority}<span className="text-[var(--muted)]"> · {dimension.weight}/5</span></div>
              <div className={`text-sm font-semibold ${statusTone(dimension.status)}`}><span className="md:hidden text-xs font-normal text-[var(--muted)]">Evidence: </span>{evidenceGrade(dimension.score)}</div>
              <div className="flex items-center gap-3 md:block md:text-right">
                <span className="text-lg font-semibold tabular-nums">{dimension.score}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-support)] md:mt-1.5 md:w-full">
                  <div className={`h-full rounded-full ${scoreTone(dimension.score)}`} style={{ width: `${dimension.score}%` }} />
                </div>
              </div>
            </article>
          ))}
        </div>
        {rankedDimensions.length > 5 ? (
          <details className="group mt-3 rounded-lg border hairline bg-[var(--panel-strong)]">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
              {profile.jobFitShowAllLabel || "Show all"} {rankedDimensions.length} requirements
              <ChevronDown aria-hidden className="h-4 w-4 transition group-open:rotate-180" />
            </summary>
            <div className="border-t hairline">
              {rankedDimensions.slice(5).map((dimension) => (
                <div key={dimension.name} className="grid gap-2 border-t hairline px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div><p className="text-sm font-medium">{dimension.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{dimension.priority} · Weight {dimension.weight}/5 · {dimension.rationale}</p></div>
                  <span className={`text-sm font-semibold ${statusTone(dimension.status)}`}>{dimension.score} · {evidenceGrade(dimension.score)}</span>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </section>

      <details open className={`${activeView === "evidence" ? "block" : "hidden"} surface group max-h-[38rem] overflow-y-auto overscroll-contain rounded-xl`}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <SearchCheck aria-hidden className="h-5 w-5 text-cobalt-500" />
              <h2 className="text-base font-semibold">
                <InlineProfileBlock profile={profile} field="jobFitEvidenceTitle" label="Job fit evidence title" value={profile.jobFitEvidenceTitle} />
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Only site resources with verified overlap to this JD are shown.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--muted)]">{result.topEvidence.length} {profile.jobFitCitedSourceLabel || "cited source"}{result.topEvidence.length === 1 ? "" : "s"}</span>
            <ChevronDown aria-hidden className="h-4 w-4 transition group-open:rotate-180" />
          </div>
        </summary>
        <div className="border-t hairline px-5 pb-5 sm:px-6 sm:pb-6">
        {result.topEvidence.length ? (
          <div className="mt-5 divide-y divide-[var(--line)] overflow-hidden rounded-md border hairline bg-[var(--panel-strong)]">
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
          <div className="mt-5 rounded-md border border-dashed hairline bg-[var(--panel-strong)] p-5">
            <p className="text-sm font-medium">{profile.jobFitNoEvidenceLabel || "No relevant public evidence found"}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              No site resource met the verified-overlap threshold. Requirements remain unproven instead of being matched to nearby content.
            </p>
          </div>
        )}
        </div>
      </details>

      <div className={`${activeView === "interview" ? "grid" : "hidden"} max-h-[38rem] gap-4 overflow-y-auto overscroll-contain lg:grid-cols-2`}>
        <section className="surface rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <AlertCircle aria-hidden className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-semibold">
              <InlineProfileBlock profile={profile} field="jobFitGapTitle" label="Job fit gap title" value={profile.jobFitGapTitle} />
            </h2>
          </div>
          <ul className="mt-4 divide-y divide-[var(--line)] border-y hairline">
            {result.gaps.map((gap) => (
              <li key={gap} className="break-words py-3 text-sm leading-6 text-[var(--muted)]">
                {gap}
              </li>
            ))}
          </ul>
        </section>

        <section className="surface rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 aria-hidden className="h-5 w-5 text-emerald-500" />
            <h2 className="text-base font-semibold">
              <InlineProfileBlock profile={profile} field="jobFitProbeTitle" label="Job fit probe title" value={profile.jobFitProbeTitle} />
            </h2>
          </div>
          <ol className="mt-4 divide-y divide-[var(--line)] border-y hairline">
            {result.interviewQuestions.map((question, index) => (
              <li key={question} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 py-3 text-sm leading-6 text-[var(--muted)]">
                <span className="font-mono text-xs text-[var(--accent)]">{String(index + 1).padStart(2, "0")}</span>
                {question}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <details className={`${activeView === "interview" ? "block" : "hidden"} surface group rounded-xl`}>
        <summary className="flex cursor-pointer list-none items-center justify-between p-5 sm:px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck aria-hidden className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-base font-semibold">
              <InlineProfileBlock profile={profile} field="jobFitMethodologyTitle" label="Job fit methodology title" value={profile.jobFitMethodologyTitle} />
            </h2>
          </div>
          <ChevronDown aria-hidden className="h-4 w-4 transition group-open:rotate-180" />
        </summary>
        <ul className="grid gap-3 border-t hairline p-5 text-sm leading-6 text-[var(--muted)] md:grid-cols-2 sm:p-6">
          {result.fairnessNotes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      </details>
    </div>
  );
}

export function JobFitClient({ timeoutSeconds, profile }: { timeoutSeconds: number; profile: SiteProfile }) {
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
  const generationStages = [
    profile.jobFitRunningLabel || "Reading role requirements",
    "Retrieving portfolio evidence",
    "Comparing skills and project signals",
    "Preparing the recruiter brief"
  ];
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
              <h2 className="text-base font-semibold">{result ? "Analyzed Job Description" : profile.jobFitFormTitle || "Job Description"}</h2>
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
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {profile.jobFitDescription}
              </p>
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
                {editorExpanded ? profile.jobFitCloseLabel || "Close editor" : profile.jobFitEditLabel || "Edit JD"}
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
            <span className="text-sm font-medium">{profile.jobFitPasteLabel || "Paste JD text"}</span>
            <textarea
              value={jdText}
              onChange={(event) => setJdText(event.target.value)}
              placeholder={profile.jobFitDescription}
              className="mt-2 min-h-72 w-full resize-y rounded-md border hairline bg-[var(--panel-strong)] p-3 text-sm leading-6 outline-none transition placeholder:text-[color-mix(in_srgb,var(--foreground),transparent_58%)] focus:border-cobalt-500"
            />
          </label>

          <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
            <span>{characterCount.toLocaleString()} characters</span>
            <span>{profile.jobFitEphemeralLabel || "Ephemeral analysis only"}</span>
          </div>

          <label className="block min-w-0 overflow-hidden rounded-md border border-dashed hairline bg-[var(--panel-strong)] p-4 transition hover:border-cobalt-500">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Upload aria-hidden className="h-4 w-4 text-cobalt-500" />
              {profile.jobFitAttachLabel || "Attach JD file"}
            </span>
            <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{profile.jobFitAttachHelp || "Supports .txt, .pdf, and .docx up to 4 MB."}</span>
            <input
              type="file"
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
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ink-900 px-5 text-sm font-medium text-white transition hover:bg-cobalt-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-ink-50 dark:text-ink-950"
          >
            {loading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <SearchCheck aria-hidden className="h-4 w-4" />}
            {result ? profile.jobFitRegenerateLabel || "Regenerate Fit Brief" : profile.jobFitGenerateLabel || "Generate Fit Brief"}
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
                {profile.jobFitLoadingEyebrow || "AI evidence analysis"}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">{profile.jobFitLoadingTitle || "Building the Role Fit Brief"}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {secondsRemaining > 0
                  ? profile.jobFitLoadingDescription || `Generating results in up to ${secondsRemaining} second${secondsRemaining === 1 ? "" : "s"}...`
                  : profile.jobFitFinalizingLabel || "Finalizing your evidence-backed results..."}
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
          <ResultPanel result={result} profile={profile} />
        ) : (
          <section className="surface min-h-[28rem] rounded-lg p-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: Gauge, label: "Assessment", value: "Evidence-led review" },
                { icon: BarChart3, label: profile.jobFitStatRubricLabel || "Rubric", value: "Derived from this JD" },
                { icon: ShieldCheck, label: profile.jobFitStatEvidenceLabel || "Evidence", value: "Public site data" }
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
                <InlineProfileBlock profile={profile} field="jobFitTemplateTitle" label="Job fit template title" value={profile.jobFitTemplateTitle} />
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">
                <InlineProfileBlock profile={profile} field="jobFitOutputTitle" label="Job fit output title" value={profile.jobFitOutputTitle} />
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                <InlineProfileBlock profile={profile} field="jobFitOutputDescription" label="Job fit output description" value={profile.jobFitOutputDescription} />
              </p>
              <p className="mt-3 max-w-2xl text-xs leading-5 text-[var(--muted)]">
                <InlineProfileBlock profile={profile} field="jobFitTemplateDescription" label="Job fit template description" value={profile.jobFitTemplateDescription} />
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

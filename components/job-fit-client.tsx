"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  FileText,
  Gauge,
  Loader2,
  Pencil,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JobFitResult } from "@/lib/job-fit";
import type { JobFitIntelligenceResult } from "@/lib/job-fit-intelligence";
import type { JobFitPersistedInquiry } from "@/lib/job-fit-store";
import { JobFitFollowUp } from "@/components/job-fit-follow-up";
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

function ResultPanel({
  result,
  intelligence,
  inquiry,
  profile,
  fallbackReason,
  onResearchComplete,
}: {
  result: JobFitResult;
  intelligence: JobFitIntelligenceResult | null;
  inquiry: JobFitPersistedInquiry | null;
  profile: SiteProfile;
  fallbackReason: string | null;
  onResearchComplete: () => void;
}) {
  const rankedDimensions = [...result.dimensions].sort(
    (a, b) => b.weight - a.weight || a.score - b.score,
  );
  const strongest = [...result.dimensions]
    .filter((item) => item.score >= 52)
    .sort((a, b) => b.score * b.weight - a.score * a.weight)
    .slice(0, 2);
  const materialGaps = rankedDimensions
    .filter((item) => item.score < 52)
    .slice(0, 3);
  const researchInsights = intelligence?.research.insights ?? [];
  const researchCitationByUrl = new Map(
    intelligence?.research.citations.map((citation) => [
      citation.url,
      citation,
    ]) ?? [],
  );
  const decision =
    result.overallScore >= 78
      ? profile.jobFitProceedStrongLabel || "Strong evidence to proceed"
      : result.overallScore >= 58
        ? profile.jobFitProceedFocusLabel || "Proceed to focused interview"
        : result.overallScore >= 35
          ? profile.jobFitProceedCautionLabel || "Proceed with caution"
          : profile.jobFitProceedInsufficientLabel ||
            "Insufficient public evidence";
  const analysisModeLabel =
    result.mode === "specialist-agent"
      ? profile.jobFitSpecialistAnalysisLabel || "AI specialist review"
      : profile.jobFitDeterministicAnalysisLabel || "Local evidence review";

  return (
    <div
      className="job-fit-dossier min-w-0 space-y-5 overflow-hidden"
      aria-live="polite"
    >
      {fallbackReason ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
        >
          <AlertCircle aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Deterministic fallback</p>
            <p className="mt-1 text-sm leading-6">
              {fallbackReason === "incomplete-response"
                ? "The AI response was incomplete, so this evidence-only portfolio review was used instead."
                : "No AI key is available, so this evidence-only portfolio review was used instead."}
            </p>
          </div>
        </div>
      ) : null}
      <section className="relative overflow-hidden rounded-2xl bg-ink-950 px-5 py-7 text-white shadow-quiet sm:px-8 sm:py-9">
        <div
          aria-hidden
          className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10 bg-emerald-400/10 blur-2xl"
        />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_12rem] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-emerald-300">
              <span>Recruiter recommendation</span>
              <span className="h-1 w-1 rounded-full bg-emerald-300" />
              <span className="text-white/55">{analysisModeLabel}</span>
            </div>
            <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {decision}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
              {result.verdict}
            </p>
            {intelligence ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  intelligence.metadata.role,
                  intelligence.metadata.company,
                  intelligence.metadata.location,
                ]
                  .filter((item): item is string =>
                    Boolean(item && item.length <= 80),
                  )
                  .map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/78"
                    >
                      {item}
                    </span>
                  ))}
              </div>
            ) : null}
          </div>
          <div
            className="mx-auto grid h-40 w-40 place-items-center rounded-full p-2"
            style={{
              background: `conic-gradient(#6ee7a7 ${result.overallScore * 3.6}deg, rgba(255,255,255,.12) 0deg)`,
            }}
            aria-label={`Role fit score ${result.overallScore} out of 100`}
          >
            <div className="grid h-full w-full place-items-center rounded-full bg-ink-950 text-center">
              <div>
                <p className="text-5xl font-semibold tabular-nums">
                  {result.overallScore}
                </p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-white/55">
                  Role fit / 100
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
        <article className="surface rounded-xl p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Role-fit map</p>
              <h3 className="mt-2 text-xl font-semibold">
                What the evidence says
              </h3>
            </div>
            <p className="text-xs text-[var(--muted)]">
              {result.dimensions.length} LLM-extracted criteria
            </p>
          </div>
          <div className="mt-6 space-y-4">
            {rankedDimensions.slice(0, 6).map((dimension) => (
              <div key={dimension.name}>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{dimension.name}</p>
                    <p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.1em] text-[var(--muted)]">
                      {dimension.priority} · {dimension.category}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${statusTone(dimension.status)}`}
                  >
                    {dimension.score}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-support)]">
                  <div
                    className={`h-full rounded-full ${scoreTone(dimension.score)}`}
                    style={{ width: `${dimension.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {rankedDimensions.length > 6 ? (
            <details className="group mt-5 border-t hairline pt-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-cobalt-600 dark:text-cobalt-300">
                Show {rankedDimensions.length - 6} more criteria
                <ChevronDown
                  aria-hidden
                  className="h-4 w-4 transition group-open:rotate-180"
                />
              </summary>
              <div className="mt-4 space-y-4">
                {rankedDimensions.slice(6).map((dimension) => (
                  <div key={dimension.name}>
                    <div className="flex justify-between gap-4 text-sm">
                      <span>{dimension.name}</span>
                      <span className="font-semibold tabular-nums">
                        {dimension.score}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-support)]">
                      <div
                        className={`h-full rounded-full ${scoreTone(dimension.score)}`}
                        style={{ width: `${dimension.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </article>

        <aside
          className="surface overflow-hidden rounded-xl"
          aria-label="Recruiter decision signals"
        >
          <div className="border-b hairline p-5">
            <p className="eyebrow">Decision signals</p>
            <h3 className="mt-2 text-xl font-semibold">Where to focus</h3>
          </div>
          <div className="divide-y divide-[var(--line)]">
            <div className="p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                Best-supported
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {strongest.length ? (
                  strongest.map((item) => <li key={item.name}>{item.name}</li>)
                ) : (
                  <li className="text-[var(--muted)]">
                    No strong public proof yet.
                  </li>
                )}
              </ul>
            </div>
            <div className="p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
                Validate next
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {materialGaps.length ? (
                  materialGaps
                    .slice(0, 2)
                    .map((item) => <li key={item.name}>{item.name}</li>)
                ) : (
                  <li>No material evidence gap.</li>
                )}
              </ul>
            </div>
            <div className="p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-cobalt-600 dark:text-cobalt-300">
                Ask in interview
              </p>
              <p className="mt-3 text-sm leading-6">
                {result.interviewQuestions[0]}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="surface rounded-xl p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Selected proof</p>
            <h3 className="mt-2 text-xl font-semibold">
              Portfolio evidence worth opening
            </h3>
          </div>
          <span className="text-xs text-[var(--muted)]">
            {result.topEvidence.length} verified section
            {result.topEvidence.length === 1 ? "" : "s"}
          </span>
        </div>
        {result.topEvidence.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {result.topEvidence.slice(0, 6).map((item, index) => (
              <article
                key={`${item.title}-${item.url}`}
                className="min-w-0 rounded-lg border hairline bg-[var(--panel-strong)] p-4"
              >
                <div className="flex gap-3">
                  <span className="font-mono text-xs text-[var(--accent)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-6">{item.matchReason}</p>
                    <Link
                      href={item.url}
                      className="mt-2 inline-flex max-w-full items-center gap-1 text-xs font-semibold text-cobalt-600 hover:underline dark:text-cobalt-300"
                    >
                      <span className="truncate">{item.title}</span>
                      <ArrowUpRight aria-hidden className="h-3 w-3 shrink-0" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-[var(--muted)]">
            No public portfolio section directly supports this role yet.
          </p>
        )}
      </section>

      {intelligence ? (
        <section
          className="surface rounded-xl p-5 sm:p-6"
          aria-label="Current market research"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Current market context</p>
              <h3 className="mt-2 text-xl font-semibold">
                What external signals mean for this candidate
              </h3>
            </div>
            <span className="rounded-full border hairline bg-[var(--panel-strong)] px-2.5 py-1 text-[0.68rem]">
              {intelligence.research.status === "complete"
                ? `${intelligence.research.citations.length} sources reviewed`
                : intelligence.research.status === "pending"
                  ? "Research in progress"
                  : "Research unavailable"}
            </span>
          </div>
          {researchInsights.length ? (
            <div
              className={`mt-5 grid gap-3 ${researchInsights.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}
            >
              {researchInsights.map((insight) => (
                <article
                  key={insight.heading}
                  className="rounded-lg border hairline bg-[var(--panel-strong)] p-4"
                >
                  <h4 className="text-sm font-semibold">{insight.heading}</h4>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {insight.analysis}
                  </p>
                  <p className="mt-3 border-l-2 border-emerald-500 pl-3 text-xs leading-5">
                    <span className="font-semibold">
                      Recruiter implication:
                    </span>{" "}
                    {insight.implication}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {insight.citations.map((url) => {
                      const citation = researchCitationByUrl.get(url);
                      return citation ? (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          title={citation.title}
                          className="inline-flex max-w-48 items-center gap-1 rounded-full border hairline px-2 py-1 text-[0.65rem] leading-none text-cobalt-600 hover:border-cobalt-500 dark:text-cobalt-300"
                        >
                          <span className="truncate">{citation.title}</span>
                          <ArrowUpRight
                            aria-hidden
                            className="h-2.5 w-2.5 shrink-0"
                          />
                        </a>
                      ) : null;
                    })}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              {intelligence.research.note}
            </p>
          )}
        </section>
      ) : null}

      <JobFitFollowUp
        inquiry={inquiry}
        onResearchComplete={onResearchComplete}
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <details className="surface group rounded-xl">
          <summary className="flex cursor-pointer list-none items-center justify-between p-5 sm:p-6">
            <div>
              <p className="eyebrow">Interview diligence</p>
              <h3 className="mt-2 text-lg font-semibold">Gaps to validate</h3>
            </div>
            <ChevronDown
              aria-hidden
              className="h-4 w-4 transition group-open:rotate-180"
            />
          </summary>
          <ul className="divide-y divide-[var(--line)] border-t hairline px-5 sm:px-6">
            {result.gaps.map((gap) => (
              <li
                key={gap}
                className="py-3 text-sm leading-6 text-[var(--muted)]"
              >
                {gap}
              </li>
            ))}
          </ul>
        </details>
        <details className="surface group rounded-xl">
          <summary className="flex cursor-pointer list-none items-center justify-between p-5 sm:p-6">
            <div>
              <p className="eyebrow">Interview guide</p>
              <h3 className="mt-2 text-lg font-semibold">
                Questions that test the fit
              </h3>
            </div>
            <ChevronDown
              aria-hidden
              className="h-4 w-4 transition group-open:rotate-180"
            />
          </summary>
          <ol className="divide-y divide-[var(--line)] border-t hairline px-5 sm:px-6">
            {result.interviewQuestions.map((question, index) => (
              <li
                key={question}
                className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 py-3 text-sm leading-6 text-[var(--muted)]"
              >
                <span className="font-mono text-xs text-[var(--accent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {question}
              </li>
            ))}
          </ol>
        </details>
      </section>

      <details className="surface group rounded-xl">
        <summary className="flex cursor-pointer list-none items-center justify-between p-5 sm:px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck aria-hidden className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold">
              Method and fairness guardrails
            </h3>
          </div>
          <ChevronDown
            aria-hidden
            className="h-4 w-4 transition group-open:rotate-180"
          />
        </summary>
        <ul className="grid gap-3 border-t hairline p-5 text-sm leading-6 text-[var(--muted)] md:grid-cols-2 sm:p-6">
          {result.fairnessNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export function JobFitClient({
  timeoutSeconds,
  profile,
}: {
  timeoutSeconds: number;
  profile: SiteProfile;
}) {
  const [jdText, setJdText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<JobFitResult | null>(null);
  const [intelligence, setIntelligence] =
    useState<JobFitIntelligenceResult | null>(null);
  const [inquiry, setInquiry] = useState<JobFitPersistedInquiry | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editorExpanded, setEditorExpanded] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(timeoutSeconds);
  const resultPanelRef = useRef<HTMLDivElement>(null);

  const characterCount = jdText.length;
  const canSubmit = useMemo(
    () => jdText.trim().length >= 80 || Boolean(file),
    [file, jdText],
  );
  const elapsedSeconds = timeoutSeconds - secondsRemaining;
  const generationProgress = Math.min(
    96,
    Math.max(4, (elapsedSeconds / timeoutSeconds) * 100),
  );
  const generationStages = [
    profile.jobFitRunningLabel || "Reading role requirements",
    "Retrieving portfolio evidence",
    "Comparing skills and project signals",
    "Preparing the recruiter brief",
  ];
  const generationStage =
    generationStages[
      Math.min(
        generationStages.length - 1,
        Math.floor(
          elapsedSeconds /
            Math.max(1, timeoutSeconds / generationStages.length),
        ),
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

    resultPanelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [loading, result]);

  async function generateFitBrief() {
    setError("");
    setFallbackReason(null);
    setSecondsRemaining(timeoutSeconds);
    setLoading(true);
    setEditorExpanded(false);

    const formData = new FormData();
    formData.set("jdText", jdText);
    if (file) formData.set("jdFile", file);

    try {
      const response = await fetch("/api/job-fit", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        result?: JobFitResult;
        intelligence?: JobFitIntelligenceResult;
        inquiry?: JobFitPersistedInquiry;
        fallbackReason?: string;
        error?: string;
      };
      if (!response.ok || !payload.result) {
        throw new Error(payload.error ?? "Could not generate the fit brief.");
      }
      setResult(payload.result);
      setIntelligence(payload.intelligence ?? null);
      setInquiry(payload.inquiry ?? null);
      setFallbackReason(payload.fallbackReason ?? null);
      setEditorExpanded(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not generate the fit brief.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await generateFitBrief();
  }

  const refreshResearch = useCallback(async () => {
    if (!inquiry?.persisted) return;
    try {
      const response = await fetch(
        `/api/job-fit/inquiries/${encodeURIComponent(inquiry.id)}`,
      );
      const payload = (await response.json()) as {
        inquiry?: {
          status: string;
          coreResult?: JobFitIntelligenceResult;
          briefAvailable?: boolean;
          sourceAvailable?: boolean;
        };
      };
      if (!response.ok || !payload.inquiry?.coreResult) return;
      setIntelligence(payload.inquiry.coreResult);
      setInquiry((current) =>
        current
          ? {
              ...current,
              status: payload.inquiry!.status,
              briefAvailable: Boolean(payload.inquiry!.briefAvailable),
              sourceAvailable: Boolean(payload.inquiry!.sourceAvailable),
            }
          : current,
      );
    } catch {
      /* The persisted core assessment remains visible if a refresh fails. */
    }
  }, [inquiry]);

  const handleResearchComplete = useCallback(() => {
    void refreshResearch();
  }, [refreshResearch]);

  return (
    <div
      className={
        result
          ? "min-w-0 space-y-4 overflow-hidden"
          : "grid min-w-0 items-start gap-6 overflow-hidden xl:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]"
      }
    >
      <section
        className={`surface h-max min-w-0 self-start rounded-lg ${result ? "p-4" : "p-5"}`}
      >
        <div
          className={
            result
              ? "grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
              : "flex flex-wrap items-start justify-between gap-3"
          }
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText aria-hidden className="h-5 w-5 text-cobalt-500" />
              <h2 className="text-base font-semibold">
                {result
                  ? "Analyzed Job Description"
                  : profile.jobFitFormTitle || "Job Description"}
              </h2>
            </div>
            {result && !editorExpanded ? (
              <>
                <p className="mt-2 line-clamp-2 max-w-5xl break-words text-sm leading-6 text-[var(--muted)]">
                  {jdText || file?.name}
                </p>
                <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                  {characterCount.toLocaleString()} characters
                  {file ? ` / ${file.name}` : ""}
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
                {editorExpanded
                  ? profile.jobFitCloseLabel || "Close editor"
                  : profile.jobFitEditLabel || "Edit JD"}
              </button>
              <button
                type="button"
                onClick={() => void generateFitBrief()}
                disabled={loading || !canSubmit}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-ink-900 px-3 text-xs font-medium text-white transition hover:bg-cobalt-600 disabled:opacity-50 dark:bg-ink-50 dark:text-ink-950"
              >
                <RefreshCw
                  aria-hidden
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Run again
              </button>
            </div>
          ) : null}
        </div>

        {!result || editorExpanded ? (
          <form
            onSubmit={(event) => void submit(event)}
            className="mt-5 space-y-4"
          >
            <label className="block">
              <span className="text-sm font-medium">
                {profile.jobFitPasteLabel || "Paste JD text"}
              </span>
              <textarea
                value={jdText}
                onChange={(event) => setJdText(event.target.value)}
                placeholder={profile.jobFitDescription}
                className="mt-2 min-h-72 w-full resize-y rounded-md border hairline bg-[var(--panel-strong)] p-3 text-sm leading-6 outline-none transition placeholder:text-[color-mix(in_srgb,var(--foreground),transparent_58%)] focus:border-cobalt-500"
              />
            </label>

            <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
              <span>{characterCount.toLocaleString()} characters</span>
              <span>
                {profile.jobFitEphemeralLabel || "Ephemeral analysis only"}
              </span>
            </div>

            <label className="block min-w-0 overflow-hidden rounded-md border border-dashed hairline bg-[var(--panel-strong)] p-4 transition hover:border-cobalt-500">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Upload aria-hidden className="h-4 w-4 text-cobalt-500" />
                {profile.jobFitAttachLabel || "Attach JD file"}
              </span>
              <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                {profile.jobFitAttachHelp ||
                  "Supports .txt, .pdf, and .docx up to 4 MB."}
              </span>
              <input
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="mt-3 block w-full min-w-0 max-w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-ink-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white dark:file:bg-ink-50 dark:file:text-ink-950"
              />
              {file ? (
                <span className="mt-2 block text-xs text-[var(--muted)]">
                  {file.name}
                </span>
              ) : null}
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
              {loading ? (
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                <SearchCheck aria-hidden className="h-4 w-4" />
              )}
              {result
                ? profile.jobFitRegenerateLabel || "Regenerate Fit Brief"
                : profile.jobFitGenerateLabel || "Generate Fit Brief"}
            </button>
          </form>
        ) : null}
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
                <Loader2
                  aria-hidden
                  className="h-6 w-6 animate-spin text-cobalt-500"
                />
              </div>

              <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
                {profile.jobFitLoadingEyebrow || "AI evidence analysis"}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">
                {profile.jobFitLoadingTitle || "Building the Role Fit Brief"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {secondsRemaining > 0
                  ? profile.jobFitLoadingDescription ||
                    `Generating results in up to ${secondsRemaining} second${secondsRemaining === 1 ? "" : "s"}...`
                  : profile.jobFitFinalizingLabel ||
                    "Finalizing your evidence-backed results..."}
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
          <ResultPanel
            result={result}
            intelligence={intelligence}
            inquiry={inquiry}
            profile={profile}
            fallbackReason={fallbackReason}
            onResearchComplete={handleResearchComplete}
          />
        ) : (
          <section className="surface min-h-[28rem] rounded-lg p-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Gauge,
                  label: "Assessment",
                  value: "Evidence-led review",
                },
                {
                  icon: BarChart3,
                  label: profile.jobFitStatRubricLabel || "Rubric",
                  value: "Derived from this JD",
                },
                {
                  icon: ShieldCheck,
                  label: profile.jobFitStatEvidenceLabel || "Evidence",
                  value: "Public site data",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border hairline bg-[var(--panel-strong)] p-4"
                >
                  <item.icon aria-hidden className="h-5 w-5 text-cobalt-500" />
                  <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-md border hairline bg-[var(--panel-strong)] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
                <InlineProfileBlock
                  profile={profile}
                  field="jobFitTemplateTitle"
                  label="Job fit template title"
                  value={profile.jobFitTemplateTitle}
                />
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">
                <InlineProfileBlock
                  profile={profile}
                  field="jobFitOutputTitle"
                  label="Job fit output title"
                  value={profile.jobFitOutputTitle}
                />
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                <InlineProfileBlock
                  profile={profile}
                  field="jobFitOutputDescription"
                  label="Job fit output description"
                  value={profile.jobFitOutputDescription}
                />
              </p>
              <p className="mt-3 max-w-2xl text-xs leading-5 text-[var(--muted)]">
                <InlineProfileBlock
                  profile={profile}
                  field="jobFitTemplateDescription"
                  label="Job fit template description"
                  value={profile.jobFitTemplateDescription}
                />
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getSiteProfile } from "@/lib/content";
import { getPublicJobFitShare } from "@/lib/job-fit-store";

export const dynamic = "force-dynamic";

function scoreTone(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-cobalt-500";
  if (score >= 35) return "bg-amber-500";
  return "bg-rose-500";
}

export default async function SharedJobFitPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [profile, share] = await Promise.all([
    getSiteProfile(),
    getPublicJobFitShare(token),
  ]);
  if (!share) notFound();

  const result = share.result;
  const audit = result.audit;
  const role =
    share.role && share.role.length <= 80 ? share.role : "Role Fit Brief";
  const company =
    share.company && share.company.length <= 80 ? share.company : null;
  const location =
    share.location && share.location.length <= 80 ? share.location : null;
  const decision =
    audit.overallScore >= 78
      ? "Strong evidence to proceed"
      : audit.overallScore >= 58
        ? "Proceed to focused interview"
        : audit.overallScore >= 35
          ? "Proceed with caution"
          : "Insufficient public evidence";
  const dimensions = [...audit.dimensions].sort(
    (a, b) => b.weight - a.weight || a.score - b.score,
  );
  const citations = Array.from(
    new Map(
      result.research.citations.map((citation) => [citation.url, citation]),
    ).values(),
  ).sort(
    (a, b) =>
      Number(b.sourceTier === "official") - Number(a.sourceTier === "official"),
  );
  const insights = result.research.insights ?? [];
  const citationByUrl = new Map(
    citations.map((citation) => [citation.url, citation]),
  );

  return (
    <SiteShell profile={profile}>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Shared recruiter brief</p>
            <h1 className="editorial-title mt-3 text-4xl">{role}</h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {[company, location].filter(Boolean).join(" · ") ||
                "Role details not identified"}
            </p>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Available until {new Date(share.expiresAt).toLocaleDateString()}
          </p>
        </div>

        <section className="relative mt-8 overflow-hidden rounded-2xl bg-ink-950 px-5 py-7 text-white shadow-quiet sm:px-8 sm:py-9">
          <div
            aria-hidden
            className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-emerald-400/10 blur-2xl"
          />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_12rem] lg:items-center">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                Recruiter recommendation ·{" "}
                {audit.mode === "specialist-agent"
                  ? "AI specialist review"
                  : "Local evidence review"}
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {decision}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
                {audit.verdict}
              </p>
            </div>
            <div
              className="mx-auto grid h-40 w-40 place-items-center rounded-full p-2"
              style={{
                background: `conic-gradient(#6ee7a7 ${audit.overallScore * 3.6}deg, rgba(255,255,255,.12) 0deg)`,
              }}
              aria-label={`Role fit score ${audit.overallScore} out of 100`}
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-ink-950 text-center">
                <div>
                  <p className="text-5xl font-semibold tabular-nums">
                    {audit.overallScore}
                  </p>
                  <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-white/55">
                    Role fit / 100
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="surface mt-5 rounded-xl p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Role-fit map</p>
              <h2 className="mt-2 text-xl font-semibold">
                Evidence against the role
              </h2>
            </div>
            <p className="text-xs text-[var(--muted)]">
              {dimensions.length} criteria
            </p>
          </div>
          <div className="mt-6 grid gap-x-8 gap-y-5 md:grid-cols-2">
            {dimensions.map((dimension) => (
              <div key={dimension.name}>
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{dimension.name}</p>
                    <p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.1em] text-[var(--muted)]">
                      {dimension.priority} · {dimension.category}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
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
        </section>

        <section className="surface mt-5 rounded-xl p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Selected proof</p>
              <h2 className="mt-2 text-xl font-semibold">
                Portfolio evidence worth opening
              </h2>
            </div>
            <span className="text-xs text-[var(--muted)]">
              {audit.topEvidence.length} verified sections
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {audit.topEvidence.slice(0, 6).map((item, index) => (
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
        </section>

        {citations.length ? (
          <section className="surface mt-5 rounded-xl p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Current market context</p>
                <h2 className="mt-2 text-xl font-semibold">
                  What external signals mean for this candidate
                </h2>
              </div>
              <span className="rounded-full border hairline bg-[var(--panel-strong)] px-2.5 py-1 text-[0.68rem]">
                {result.research.citations.length} sources reviewed
              </span>
            </div>
            {insights.length ? (
              <div
                className={`mt-5 grid gap-3 ${insights.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}
              >
                {insights.map((insight) => (
                  <article
                    key={insight.heading}
                    className="rounded-lg border hairline bg-[var(--panel-strong)] p-4"
                  >
                    <h3 className="text-sm font-semibold">{insight.heading}</h3>
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
                        const citation = citationByUrl.get(url);
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
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {result.research.note}
              </p>
            )}
          </section>
        ) : null}

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <article className="surface rounded-xl p-5 sm:p-6">
            <p className="eyebrow">Validate in interview</p>
            <ul className="mt-4 divide-y divide-[var(--line)] border-y hairline">
              {audit.gaps.slice(0, 4).map((gap) => (
                <li
                  key={gap}
                  className="py-3 text-sm leading-6 text-[var(--muted)]"
                >
                  {gap}
                </li>
              ))}
            </ul>
          </article>
          <article className="surface rounded-xl p-5 sm:p-6">
            <p className="eyebrow">Suggested questions</p>
            <ol className="mt-4 divide-y divide-[var(--line)] border-y hairline">
              {audit.interviewQuestions.map((question, index) => (
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
          </article>
        </section>
      </section>
    </SiteShell>
  );
}

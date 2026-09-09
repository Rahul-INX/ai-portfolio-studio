import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ContentHealthIssue } from "@/lib/content-health";

const labels: Record<ContentHealthIssue["kind"], string> = {
  project: "Project",
  "case-study": "Case study",
  experiment: "Experiment",
  blog: "Blog",
  dashboard: "Dashboard",
  "site-profile": "Homepage",
  certification: "Certification",
  timeline: "Timeline"
};

export function ContentHealthPanel({ issues }: { issues: ContentHealthIssue[] }) {
  return (
    <details className="surface mt-8 rounded-xl" aria-labelledby="content-health-title">
      <summary className="cursor-pointer list-none p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Publishing readiness</p>
          <h2 id="content-health-title" className="mt-2 text-xl font-semibold">Content health</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Fix these before a recruiter encounters broken proof, expiring media, or unfinished card copy.</p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${issues.length ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
          {issues.length ? <AlertTriangle aria-hidden className="h-4 w-4" /> : <CheckCircle2 aria-hidden className="h-4 w-4" />}
          {issues.length ? `${issues.length} ${issues.length === 1 ? "item needs" : "items need"} attention` : "Ready to review"}
        </div>
      </div>
      </summary>
      {issues.length ? (
        <ul className="mx-5 mb-5 divide-y hairline rounded-lg border hairline sm:mx-6 sm:mb-6">
          {issues.map((issue) => (
            <li key={`${issue.kind}-${issue.slug}-${issue.message}`} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold">{issue.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{issue.message}</p>
              </div>
              <Link href={`/admin/new-project?kind=${issue.kind}&record=${encodeURIComponent(issue.slug)}`} className="inline-flex h-9 items-center rounded-md border hairline px-3 text-sm font-semibold transition hover:border-[var(--accent)]">Edit {labels[issue.kind]}</Link>
            </li>
          ))}
        </ul>
      ) : null}
    </details>
  );
}

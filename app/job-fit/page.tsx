import type { Metadata } from "next";
import { JobFitClient } from "@/components/job-fit-client";
import { InlineProfileBlock } from "@/components/inline-profile-block";
import { SiteShell } from "@/components/site-shell";
import { getSiteProfile } from "@/lib/content";
import { getJobFitSettings } from "@/lib/job-fit-settings";
import { getPublicJobFitActivity } from "@/lib/job-fit-store";

export const metadata: Metadata = {
  title: "Check Job Fit",
  description: "Generate a recruiter-facing Role Fit Brief from a job description using public portfolio evidence."
};

export default async function JobFitPage() {
  const [profile, settings, activity] = await Promise.all([getSiteProfile(), getJobFitSettings(), getPublicJobFitActivity()]);

  return (
    <SiteShell profile={profile}>
      <section className="mx-auto max-w-7xl overflow-x-clip px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="max-w-4xl">
          <InlineProfileBlock profile={profile} field="jobFitEyebrow" label="Job fit eyebrow" value={profile.jobFitEyebrow} className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300" />
          <h1 className="editorial-title mt-5 text-4xl text-[var(--foreground)] sm:text-5xl">
            <InlineProfileBlock profile={profile} field="jobFitTitle" label="Job fit title" value={profile.jobFitTitle} />
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[color-mix(in_srgb,var(--foreground),transparent_26%)]">
            <InlineProfileBlock profile={profile} field="jobFitDescription" label="Job fit description" value={profile.jobFitDescription} />
          </p>
        </div>
        {activity.length ? <div className="mt-6 flex flex-wrap gap-2" aria-label="Approved Job Fit activity">{activity.map((label) => <span key={label} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-[0_0_18px_rgba(16,185,129,0.16)] dark:text-emerald-200">Evaluated: {label}</span>)}</div> : null}
        <div className="mt-8">
          <JobFitClient timeoutSeconds={settings.fallbackTimeoutSeconds} profile={profile} />
        </div>
      </section>
    </SiteShell>
  );
}

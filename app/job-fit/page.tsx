import type { Metadata } from "next";
import { JobFitClient } from "@/components/job-fit-client";
import { SiteShell } from "@/components/site-shell";
import { getSiteProfile } from "@/lib/content";
import { getJobFitSettings } from "@/lib/job-fit-settings";

export const metadata: Metadata = {
  title: "Check Job Fit",
  description: "Generate a recruiter-facing Role Fit Brief from a job description using public portfolio evidence."
};

export default async function JobFitPage() {
  const [profile, settings] = await Promise.all([getSiteProfile(), getJobFitSettings()]);

  return (
    <SiteShell profile={profile}>
      <section className="mx-auto max-w-7xl overflow-x-clip px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
            Recruiter Fit Review
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-[var(--foreground)] sm:text-5xl">
            Role Fit Brief
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[color-mix(in_srgb,var(--foreground),transparent_26%)]">
            Paste or attach any job description to compare the role against {profile.name}&apos;s public portfolio evidence. The evaluator derives a rubric from that JD, names missing proof clearly, and avoids unverifiable claims.
          </p>
        </div>
        <div className="mt-8">
          <JobFitClient timeoutSeconds={settings.fallbackTimeoutSeconds} />
        </div>
      </section>
    </SiteShell>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ContentStudioForm } from "@/components/content-studio-form";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { SiteShell } from "@/components/site-shell";
import { getAdminSession } from "@/lib/auth";
import {
  getBlogs,
  getAchievements,
  getCaseStudies,
  getCertifications,
  getDashboards,
  getExperiments,
  getPortfolioDocuments,
  getProjects,
  getSiteProfile,
  getSkills,
  getTimeline
} from "@/lib/content";

export const metadata: Metadata = {
  title: "Content Studio",
  robots: { index: false, follow: false }
};

export default async function NewProjectPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  // Fetch sequentially to avoid exhausting Neon's connection pool
  const profile = await getSiteProfile();
  const projects = await getProjects(true);
  const caseStudies = await getCaseStudies(true);
  const experiments = await getExperiments(true);
  const blogs = await getBlogs(true);
  const dashboards = await getDashboards(true);
  const skills = await getSkills();
  const certifications = await getCertifications();
  const achievements = await getAchievements(true);
  const timeline = await getTimeline();
  const documents = await getPortfolioDocuments(true);
  return (
    <SiteShell profile={profile}>
      <section className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12 2xl:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">CMS</p>
            <h1 className="editorial-title mt-4 text-4xl">Advanced content studio</h1>
          </div>
          <AdminLogoutButton />
        </div>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Use live-page editing for common changes. This studio remains available for blogs, structured records, uploads, bulk work, and recovery.
        </p>
        <ContentStudioForm
          data={{ profile, projects, caseStudies, experiments, blogs, dashboards, skills, certifications, achievements, timeline, documents }}
        />
      </section>
    </SiteShell>
  );
}

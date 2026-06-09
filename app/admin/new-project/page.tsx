import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ContentStudioForm } from "@/components/content-studio-form";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { SiteShell } from "@/components/site-shell";
import { authOptions } from "@/lib/auth";
import {
  getBlogs,
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
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/admin/login");
  // Fetch sequentially to avoid exhausting Neon's connection pool
  const profile = await getSiteProfile();
  const projects = await getProjects();
  const caseStudies = await getCaseStudies();
  const experiments = await getExperiments();
  const blogs = await getBlogs();
  const dashboards = await getDashboards();
  const skills = await getSkills();
  const certifications = await getCertifications();
  const timeline = await getTimeline();
  const documents = await getPortfolioDocuments();
  return (
    <SiteShell profile={profile}>
      <section className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12 2xl:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">CMS</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal">Advanced content studio</h1>
          </div>
          <AdminLogoutButton />
        </div>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Use live-page editing for common changes. This studio remains available for blogs, structured records, uploads, bulk work, and recovery.
        </p>
        <ContentStudioForm
          data={{ profile, projects, caseStudies, experiments, blogs, dashboards, skills, certifications, timeline, documents }}
        />
      </section>
    </SiteShell>
  );
}

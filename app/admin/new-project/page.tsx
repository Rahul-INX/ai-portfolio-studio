import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ContentStudioForm } from "@/components/content-studio-form";
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
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">CMS</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal">Editable content studio</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Edit the public profile, projects, case studies, experiments, blogs, dashboards, skills, certifications, and timeline records without touching source files.
        </p>
        <ContentStudioForm
          data={{ profile, projects, caseStudies, experiments, blogs, dashboards, skills, certifications, timeline, documents }}
        />
      </section>
    </SiteShell>
  );
}

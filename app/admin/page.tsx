import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Database, FileDown, FileText, FlaskConical, LayoutDashboard, PenTool, Workflow } from "lucide-react";
import { JobFitSettingsForm } from "@/components/job-fit-settings-form";
import { SiteShell } from "@/components/site-shell";
import { authOptions } from "@/lib/auth";
import { getExplorerItems, getSiteProfile } from "@/lib/content";
import { getJobFitSettings } from "@/lib/job-fit-settings";

export const metadata: Metadata = {
  title: "Admin CMS",
  robots: { index: false, follow: false }
};

const modules = [
  { label: "Projects", icon: Workflow, detail: "Metrics, stack, impact, architecture canvas" },
  { label: "Case Studies", icon: FileText, detail: "Problem, context, approach, business value" },
  { label: "Experiments", icon: FlaskConical, detail: "RAG, vector DB, LLM benchmarks, extraction notes" },
  { label: "Blogs", icon: PenTool, detail: "Markdown articles, SEO fields, syntax highlighting" },
  { label: "Dashboards", icon: LayoutDashboard, detail: "Power BI, Streamlit, analytics galleries" },
  { label: "Resume", icon: Database, detail: "Skills, certifications, timeline" },
  { label: "Documents", icon: FileDown, detail: "Resume and CV downloads" }
];

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/admin/login");
  const [items, profile, jobFitSettings] = await Promise.all([
    getExplorerItems(),
    getSiteProfile(),
    getJobFitSettings()
  ]);

  return (
    <SiteShell profile={profile}>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">{profile.adminEyebrow}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal">{profile.adminTitle}</h1>
            <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
              {profile.adminDescription}
            </p>
          </div>
          <Link href="/admin/new-project" className="rounded-md bg-ink-900 px-5 py-3 text-sm font-medium text-white dark:bg-ink-50 dark:text-ink-950">
            Open studio
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="surface rounded-lg p-5">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Published Items</p>
            <p className="mt-3 text-3xl font-semibold text-cobalt-500">{items.length}</p>
          </div>
          <div className="surface rounded-lg p-5">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Database</p>
            <p className="mt-3 text-lg font-semibold">{process.env.DATABASE_URL ? "Configured" : "Preview fallback"}</p>
          </div>
          <div className="surface rounded-lg p-5">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Auth</p>
            <p className="mt-3 text-lg font-semibold">NextAuth credentials</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <article key={module.label} className="surface rounded-lg p-5">
              <module.icon aria-hidden className="h-5 w-5 text-cobalt-500" />
              <h2 className="mt-4 text-lg font-semibold">{module.label}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{module.detail}</p>
            </article>
          ))}
        </div>
        <JobFitSettingsForm initialSettings={jobFitSettings} />
      </section>
    </SiteShell>
  );
}

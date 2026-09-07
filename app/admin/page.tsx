import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, Database, FileDown, FileText, FlaskConical, LayoutDashboard, PenTool, Workflow } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AiProviderSettings } from "@/components/ai-provider-settings";
import { ContentHealthPanel } from "@/components/content-health-panel";
import { JobFitSettingsForm } from "@/components/job-fit-settings-form";
import { GoogleDriveMediaSettings } from "@/components/google-drive-media-settings";
import { SiteShell } from "@/components/site-shell";
import { getAdminSession } from "@/lib/auth";
import { getExplorerItems, getSiteProfile } from "@/lib/content";
import { scanContentHealth } from "@/lib/content-health";
import { getJobFitSettings } from "@/lib/job-fit-settings";

export const metadata: Metadata = {
  title: "Admin CMS",
  robots: { index: false, follow: false }
};

const modules = [
  { label: "Projects", icon: Workflow, detail: "Metrics, stack, impact, architecture canvas", kind: "project" },
  { label: "Case Studies", icon: FileText, detail: "Problem, context, approach, business value", kind: "case-study" },
  { label: "Experiments", icon: FlaskConical, detail: "RAG, vector DB, LLM benchmarks, extraction notes", kind: "experiment" },
  { label: "Blogs", icon: PenTool, detail: "Markdown articles, SEO fields, syntax highlighting", kind: "blog" },
  { label: "Dashboards", icon: LayoutDashboard, detail: "Power BI, Streamlit, analytics galleries", kind: "dashboard" },
  { label: "Achievements", icon: Award, detail: "Awards, leadership signals, proof links, images", kind: "achievement" },
  { label: "Resume", icon: Database, detail: "Skills, certifications, timeline", kind: "timeline" },
  { label: "Documents", icon: FileDown, detail: "Resume and CV downloads", kind: "document", record: "RESUME" }
];

const primaryTasks = [
  { label: "Edit homepage", icon: PenTool, detail: "Hero copy, contact route, selected-work framing, and credibility signals.", kind: "site-profile", record: "main" },
  { label: "Manage work", icon: Workflow, detail: "Create or refine a project, case study, experiment, or proof artifact.", kind: "project" },
  { label: "Publish and health", icon: LayoutDashboard, detail: "Review readiness issues before public content becomes recruiter-facing.", kind: "dashboard" },
];

export default async function AdminPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const [items, profile, jobFitSettings] = await Promise.all([
    getExplorerItems(),
    getSiteProfile(),
    getJobFitSettings()
  ]);
  const healthIssues = scanContentHealth(items);

  return (
    <SiteShell profile={profile}>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">{profile.adminEyebrow}</p>
            <h1 className="editorial-title mt-4 text-4xl">{profile.adminTitle}</h1>
            <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
              {profile.adminDescription}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <AdminLogoutButton />
            <Link href="/admin/new-project" className="inline-flex h-11 items-center rounded-md bg-ink-900 px-5 text-sm font-medium text-white dark:bg-ink-50 dark:text-ink-950">
              Open studio
            </Link>
          </div>
        </div>
        <ContentHealthPanel issues={healthIssues} />
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Owner workflow</p>
            <h2 className="mt-2 text-xl font-semibold">What do you need to do?</h2>
          </div>
          <p className="text-sm text-[var(--muted)]">{items.length} public records · use drafts before publishing changes.</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {primaryTasks.map((task, index) => (
            <Link key={task.label} href={`/admin/new-project?kind=${task.kind}&record=${task.record ?? "new"}`} className="surface group rounded-lg p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[var(--muted)]">0{index + 1} · task</p>
              <task.icon aria-hidden className="mt-4 h-5 w-5 text-cobalt-500 transition group-hover:text-[var(--accent)]" />
              <h2 className="mt-4 text-lg font-semibold">{task.label}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{task.detail}</p>
            </Link>
          ))}
        </div>
        <details className="surface mt-5 rounded-lg">
          <summary className="cursor-pointer list-none p-5 [&::-webkit-details-marker]:hidden">
            <span className="eyebrow">Advanced studio</span>
            <span className="mt-2 block text-lg font-semibold">Open a specific content area</span>
            <span className="mt-1 block text-sm text-[var(--muted)]">Use this for documents, timeline records, writing, and detailed structured edits.</span>
          </summary>
          <div className="grid gap-3 border-t hairline p-5 sm:grid-cols-2 xl:grid-cols-4">
            {modules.map((module) => (
              <Link key={module.label} href={`/admin/new-project?kind=${module.kind}&record=${module.record ?? "new"}`} className="rounded-lg border hairline bg-[var(--panel)] p-4 transition hover:border-[var(--accent)]">
                <module.icon aria-hidden className="h-5 w-5 text-cobalt-500" />
                <h3 className="mt-3 text-base font-semibold">{module.label}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{module.detail}</p>
              </Link>
            ))}
          </div>
        </details>
        <JobFitSettingsForm initialSettings={jobFitSettings} />
        <GoogleDriveMediaSettings />
        <AiProviderSettings />
      </section>
    </SiteShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SiteShell } from "@/components/site-shell";
import { cvSections } from "@/lib/cv-content";
import { getPortfolioDocuments, getSiteProfile } from "@/lib/content";

export const metadata: Metadata = {
  title: "CV | Rahul Harivansh Fatyal",
  description: "Detailed CV for Rahul Harivansh Fatyal covering GenAI, RAG, data science, projects, education, leadership, and certifications."
};

function SectionShell({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="surface scroll-mt-24 rounded-lg p-6">
      <h2 className="text-xl font-semibold tracking-normal">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function CvPage() {
  const [profile, documents] = await Promise.all([getSiteProfile(), getPortfolioDocuments()]);
  const resume = documents.find((item) => item.kind === "RESUME");
  const cv = documents.find((item) => item.kind === "CV");

  return (
    <SiteShell profile={profile}>
      <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Detailed CV"
          title="Rahul Harivansh Fatyal"
          description="A public-safe CV focused on GenAI systems, retrieval workflows, data science, software delivery, leadership, education, and certifications."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          {cv ? (
            <a
              href={cv.fileUrl}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-ink-900 px-5 text-sm font-medium text-white transition hover:bg-cobalt-600 dark:bg-ink-50 dark:text-ink-950"
            >
              <Download aria-hidden className="h-4 w-4" />
              Download CV
            </a>
          ) : null}
          {resume ? (
            <a
              href={resume.fileUrl}
              className="inline-flex h-11 items-center gap-2 rounded-md border hairline px-5 text-sm font-medium transition hover:border-cobalt-500"
            >
              <FileText aria-hidden className="h-4 w-4" />
              Download Resume
            </a>
          ) : null}
          <Link
            href="/timeline#resume-downloads"
            className="inline-flex h-11 items-center rounded-md border hairline px-5 text-sm font-medium transition hover:border-cobalt-500"
          >
            Resume hub
          </Link>
        </div>

        <div className="mt-10 grid gap-5">
          <SectionShell id="summary" title={cvSections.summary.title}>
            <p className="leading-7 text-[color-mix(in_srgb,var(--foreground),transparent_24%)]">{cvSections.summary.body}</p>
          </SectionShell>

          <SectionShell id="skills" title="Skills">
            <div className="grid gap-3 sm:grid-cols-2">
              {cvSections.skills.map((skill) => (
                <div key={skill} className="rounded-md border hairline p-3 text-sm leading-6 text-[var(--muted)]">
                  {skill}
                </div>
              ))}
            </div>
          </SectionShell>

          <SectionShell id="projects" title="Selected Projects">
            <div className="space-y-4">
              {cvSections.projects.map((project) => (
                <article key={project.title} className="rounded-md border hairline p-4">
                  <h3 className="font-semibold">{project.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{project.body}</p>
                </article>
              ))}
            </div>
          </SectionShell>

          <SectionShell id="experience" title="Experience">
            <div className="space-y-4">
              {cvSections.experience.map((item) => (
                <article key={item.title}>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
                </article>
              ))}
            </div>
          </SectionShell>

          <SectionShell id="education" title="Education">
            <ul className="space-y-3 text-sm leading-6 text-[var(--muted)]">
              {cvSections.education.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </SectionShell>

          <SectionShell id="certifications" title="Certifications">
            <div className="grid gap-3 sm:grid-cols-2">
              {cvSections.certifications.map((item) => (
                <div key={item} className="rounded-md border hairline p-3 text-sm text-[var(--muted)]">
                  {item}
                </div>
              ))}
            </div>
          </SectionShell>

          <SectionShell id="leadership" title="Leadership And Interests">
            <ul className="space-y-3 text-sm leading-6 text-[var(--muted)]">
              {cvSections.leadership.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </SectionShell>
        </div>
      </article>
    </SiteShell>
  );
}

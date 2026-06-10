import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SiteShell } from "@/components/site-shell";
import { getCertifications, getPortfolioDocuments, getProjects, getSiteProfile, getSkills, getTimeline } from "@/lib/content";
import { InlineProfileText } from "@/components/inline-profile-text";

export const metadata: Metadata = { title: "Detailed CV", description: "Detailed public portfolio CV with projects, skills, experience, and certifications." };

function SectionShell({ id, title, children }: { id: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="surface scroll-mt-24 rounded-lg p-6">
      <h2 className="text-xl font-semibold tracking-normal">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function CvPage() {
  const [profile, documents, skills, projects, timeline, certifications] = await Promise.all([
    getSiteProfile(), getPortfolioDocuments(), getSkills(), getProjects(), getTimeline(), getCertifications()
  ]);
  const resume = documents.find((item) => item.kind === "RESUME");
  const cv = documents.find((item) => item.kind === "CV");

  return (
    <SiteShell profile={profile}>
      <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={profile.cvHeadingEyebrow}
          title={profile.name}
          description={profile.heroSummary}
          profile={profile}
          editable={{
            eyebrow: "cvHeadingEyebrow",
            title: "name",
            description: "heroSummary"
          }}
        />
        <div className="mt-8 flex flex-wrap gap-3">
          {cv ? (
            <a
              href={cv.fileUrl}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-ink-900 px-5 text-sm font-medium text-white transition hover:bg-cobalt-600 dark:bg-ink-50 dark:text-ink-950"
            >
              <Download aria-hidden className="h-4 w-4" />
              {profile.downloadCvLabel || "Download CV"}
            </a>
          ) : null}
          {resume ? (
            <a
              href={resume.fileUrl}
              className="inline-flex h-11 items-center gap-2 rounded-md border hairline px-5 text-sm font-medium transition hover:border-cobalt-500"
            >
              <FileText aria-hidden className="h-4 w-4" />
              {profile.downloadResumeLabel || "Download Resume"}
            </a>
          ) : null}
          <Link
            href="/timeline#resume-downloads"
            className="inline-flex h-11 items-center rounded-md border hairline px-5 text-sm font-medium transition hover:border-cobalt-500"
          >
            {profile.viewCvLabel || "Resume hub"}
          </Link>
        </div>

        <div className="mt-10 grid gap-5">
          <SectionShell
            id="summary"
            title={
              <InlineProfileText profile={profile} field="cvSummaryTitle" label="CV summary title" value={profile.cvSummaryTitle} />
            }
          >
            <p className="leading-7 text-[color-mix(in_srgb,var(--foreground),transparent_24%)]">{profile.seoDescription}</p>
          </SectionShell>

          <SectionShell id="skills" title={profile.skillsTitle}>
            <div className="grid gap-3 sm:grid-cols-2">
              {skills.map((skill) => (
                <div key={skill.name} className="rounded-md border hairline p-3 text-sm leading-6 text-[var(--muted)]">
                  <strong className="text-[var(--foreground)]">{skill.name}</strong> · {skill.category}
                </div>
              ))}
            </div>
          </SectionShell>

          <SectionShell id="projects" title={profile.cvProjectsTitle}>
            <div className="space-y-4">
              {projects.map((project) => (
                <article key={project.title} className="rounded-md border hairline p-4">
                  <h3 className="font-semibold">{project.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{project.summary}</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{project.businessImpact}</p>
                </article>
              ))}
            </div>
          </SectionShell>

          <SectionShell id="experience" title={profile.cvExperienceTitle}>
            <div className="space-y-4">
              {timeline.map((item) => (
                <article key={item.title}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{item.title}</h3><span className="text-xs text-[var(--muted)]">{item.period}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
                </article>
              ))}
            </div>
          </SectionShell>

          <SectionShell id="certifications" title={profile.cvCertificationsTitle}>
            <div className="grid gap-3 sm:grid-cols-2">
              {certifications.map((item) => (
                <div key={`${item.title}-${item.issuer}`} className="rounded-md border hairline p-3 text-sm text-[var(--muted)]">
                  <strong className="text-[var(--foreground)]">{item.title}</strong><br />{item.issuer}
                </div>
              ))}
            </div>
          </SectionShell>

        </div>
      </article>
    </SiteShell>
  );
}

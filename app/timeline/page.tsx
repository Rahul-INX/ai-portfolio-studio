import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SiteShell } from "@/components/site-shell";
import { getCertifications, getPortfolioDocuments, getSiteProfile, getSkills, getTimeline } from "@/lib/content";
import { ContextualEditLink } from "@/components/contextual-edit-link";
import { InlineProfileText } from "@/components/inline-profile-text";
import { renderMarkdownToHtml } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Resume and Timeline",
  description: "Structured skills, certifications, and professional growth timeline for AI engineering."
};

export default async function TimelinePage() {
  const [timeline, skills, certifications, profile, documents] = await Promise.all([
    getTimeline(),
    getSkills(),
    getCertifications(),
    getSiteProfile(),
    getPortfolioDocuments()
  ]);

  // Pre-render all timeline descriptions as sanitized HTML on the server
  const timelineWithHtml = await Promise.all(
    timeline.map(async (item) => ({
      ...item,
      descriptionHtml: await renderMarkdownToHtml(item.description ?? "")
    }))
  );

  const resume = documents.find((item) => item.kind === "RESUME");
  const cv = documents.find((item) => item.kind === "CV");
  return (
    <SiteShell profile={profile}>
      <section id="timeline" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={profile.timelineEyebrow}
          title={profile.timelineTitle}
          description={profile.timelineDescription}
          profile={profile}
          editable={{
            eyebrow: "timelineEyebrow",
            title: "timelineTitle",
            description: "timelineDescription"
          }}
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <section id="resume-downloads" className="surface scroll-mt-24 rounded-lg p-5">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-sage-700 dark:text-sage-300">
                <InlineProfileText profile={profile} field="resumeDownloadsEyebrow" label="Resume downloads eyebrow" value={profile.resumeDownloadsEyebrow} />
              </p>
              <h2 className="mt-3 text-lg font-semibold">
                <InlineProfileText profile={profile} field="resumeDownloadsTitle" label="Resume downloads title" value={profile.resumeDownloadsTitle} />
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                <InlineProfileText profile={profile} field="resumeDownloadsDescription" label="Resume downloads description" value={profile.resumeDownloadsDescription} multiline />
              </p>
              <div className="mt-5 grid gap-3">
                {resume ? (
                  <a
                    href={resume.fileUrl}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink-900 px-4 text-sm font-medium text-white transition hover:bg-cobalt-600 dark:bg-ink-50 dark:text-ink-950"
                  >
                    <Download aria-hidden className="h-4 w-4" />
                    {profile.downloadResumeLabel || "Download Resume"}
                  </a>
                ) : null}
                {cv ? (
                  <a
                    href={cv.fileUrl}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border hairline px-4 text-sm font-medium transition hover:border-cobalt-500"
                  >
                    <Download aria-hidden className="h-4 w-4" />
                    {profile.downloadCvLabel || "Download CV"}
                  </a>
                ) : null}
                <Link
                  href="/cv"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border hairline px-4 text-sm font-medium transition hover:border-cobalt-500"
                >
                  <FileText aria-hidden className="h-4 w-4" />
                  {profile.viewCvLabel || "View CV"}
                </Link>
              </div>
            </section>
            <div className="surface rounded-lg p-5">
              <h2 id="skills" className="scroll-mt-24 text-lg font-semibold">
                <InlineProfileText profile={profile} field="skillsTitle" label="Skills title" value={profile.skillsTitle} />
              </h2>
              <div className="mt-5 space-y-4">
                {skills.map((skill) => (
                  <div id={`skill-${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`} className="scroll-mt-24" key={skill.name}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>{skill.name}</span>
                      <span className="font-mono text-xs text-[var(--muted)]">{skill.category}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-[color-mix(in_srgb,var(--foreground),transparent_90%)]">
                      <div className="h-full rounded-full bg-cobalt-500" style={{ width: `${skill.level}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 border-t hairline pt-6">
                <h2 id="certifications" className="scroll-mt-24 text-lg font-semibold">
                  <InlineProfileText profile={profile} field="certificationsTitle" label="Certifications title" value={profile.certificationsTitle} />
                </h2>
                <div className="mt-4 space-y-3">
                  {certifications.map((item) => (
                    <div
                      id={`certification-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`}
                      key={`${item.title}-${item.issuer}`}
                      className="scroll-mt-24 rounded-md border hairline p-3"
                    >
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{item.issuer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="relative space-y-6 before:absolute before:bottom-4 before:left-[0.45rem] before:top-4 before:w-px before:bg-[var(--line-strong)]">
            {timelineWithHtml.map((item) => (
              <article
                id={`timeline-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`}
                key={item.title}
                className="surface relative ml-8 scroll-mt-24 rounded-2xl p-5 before:absolute before:-left-[2.05rem] before:top-7 before:h-4 before:w-4 before:rounded-full before:border-4 before:border-[var(--background)] before:bg-[var(--accent)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-sage-700 dark:text-sage-300">
                      {item.period}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]">{item.title}</h2>
                  </div>
                  <span className="rounded-md border hairline px-3 py-1 text-sm text-[var(--muted)]">
                    {item.signal}
                  </span>
                  <ContextualEditLink kind="timeline" record={item.title} label={item.title} />
                </div>
                <div
                  className="prose-premium prose-premium-sm mt-4"
                  dangerouslySetInnerHTML={{ __html: item.descriptionHtml }}
                />
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

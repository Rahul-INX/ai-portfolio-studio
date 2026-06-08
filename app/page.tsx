import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, Database, Mail, MapPin, Phone, SearchCheck, ShieldCheck } from "lucide-react";
import { ContentCard } from "@/components/card";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { MotionPanel } from "@/components/motion-panel";
import { SectionHeading } from "@/components/section-heading";
import { SiteShell } from "@/components/site-shell";
import { GitHubIcon, LinkedInIcon } from "@/components/social-icons";
import { getExplorerItems, getProjects, getSiteProfile, getSkills } from "@/lib/content";

export default async function HomePage() {
  // Fetch sequentially to avoid exhausting Neon's connection pool.
  // React `cache()` deduplicates, so getProjects() inside getExplorerItems is free.
  const profile = await getSiteProfile();
  const projects = await getProjects();
  const items = await getExplorerItems();
  const skills = await getSkills();
  const featured = projects.filter((project) => project.featured).slice(0, 2);
  const recent = items.slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    image: profile.profileImageUrl,
    email: profile.contactEmail,
    telephone: profile.contactPhone,
    address: profile.contactLocation,
    knowsAbout: ["Retrieval-Augmented Generation", "MLOps", "Vector Search", "NLP", "Analytics"]
  };

  return (
    <SiteShell profile={profile}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section
        id="overview"
        className="quiet-grid relative overflow-hidden border-b hairline bg-[color-mix(in_srgb,var(--background),transparent_10%)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_44%,color-mix(in_srgb,var(--accent-soft),transparent_80%),transparent_24rem)]" />
        <div className="relative mx-auto grid max-w-7xl scroll-mt-24 items-center gap-10 px-4 pb-12 pt-10 sm:px-6 lg:min-h-[calc(100dvh-8.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:px-8 lg:py-12 xl:gap-16">
          <MotionPanel>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
              {profile.heroEyebrow}
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-normal text-[var(--foreground)] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08] xl:text-6xl">
              {profile.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[color-mix(in_srgb,var(--foreground),transparent_26%)]">
              {profile.heroSummary}
            </p>
            <div className="mt-7 hidden gap-2 sm:grid sm:grid-cols-3">
              {[
                { icon: Database, label: profile.focusLabel, value: profile.focusValue },
                { icon: ShieldCheck, label: profile.styleLabel, value: profile.styleValue },
                { icon: BarChart3, label: profile.modelLabel, value: profile.modelValue }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border hairline bg-[color-mix(in_srgb,var(--panel-strong),transparent_16%)] p-3.5 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <item.icon aria-hidden className="h-4 w-4 shrink-0 text-cobalt-500" />
                    <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--muted)]">{item.label}</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-5">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/explorer"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-ink-900 px-5 text-sm font-medium text-white transition hover:bg-cobalt-600 dark:bg-ink-50 dark:text-ink-950"
              >
                {profile.primaryCtaLabel} <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
              <Link
                href="/timeline"
                className="inline-flex h-11 items-center rounded-md border hairline px-5 text-sm font-medium transition hover:border-cobalt-500"
              >
                {profile.secondaryCtaLabel}
              </Link>
              <Link
                href="/job-fit"
                className="inline-flex h-11 items-center gap-2 rounded-md border hairline px-5 text-sm font-medium transition hover:border-cobalt-500"
              >
                Check Job Fit <SearchCheck aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </MotionPanel>

          <MotionPanel
            delay={0.08}
            className="surface relative mx-auto w-full max-w-sm overflow-hidden rounded-lg p-0 lg:mx-0 lg:justify-self-end"
          >
            <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-white/80 backdrop-blur-md">
              Portfolio / 2026
            </span>
            <div className="relative aspect-[4/5] border-b hairline bg-[color-mix(in_srgb,var(--panel-strong),var(--accent-soft)_10%)]">
              <Image
                src={profile.profileImageUrl || "/media/rahul-profile.jpeg"}
                alt={`${profile.name} portrait`}
                fill
                priority
                sizes="(min-width: 1024px) 24rem, (min-width: 640px) 24rem, calc(100vw - 2rem)"
                className="object-cover"
              />
            </div>
            <div className="flex items-center justify-between gap-4 bg-[var(--panel-strong)] px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-normal">{profile.name}</p>
                <p className="mt-0.5 text-sm text-[var(--muted)]">{profile.role}</p>
              </div>
              {profile.githubUrl || profile.linkedinUrl ? (
                <div className="flex shrink-0 gap-1">
                  {profile.githubUrl ? (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="GitHub profile"
                      title="GitHub profile"
                      className="grid h-9 w-9 place-items-center rounded-md text-[var(--muted)] transition hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                    >
                      <GitHubIcon className="h-4 w-4" />
                    </a>
                  ) : null}
                  {profile.linkedinUrl ? (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="LinkedIn profile"
                      title="LinkedIn profile"
                      className="grid h-9 w-9 place-items-center rounded-md text-[#0A66C2] transition hover:bg-[#0A66C2]/10"
                    >
                      <LinkedInIcon className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </MotionPanel>
        </div>
      </section>

      <section className="bg-[color-mix(in_srgb,var(--panel),transparent_28%)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">Get in touch</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {profile.contactLocation ? (
                <div className="flex min-w-0 items-start gap-3">
                  <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-500" />
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--muted)]">Location</p>
                    <p className="mt-0.5 truncate text-sm font-medium">{profile.contactLocation}</p>
                  </div>
                </div>
              ) : null}
              {profile.contactEmail ? (
                <a href={`mailto:${profile.contactEmail}`} className="flex min-w-0 items-start gap-3 transition hover:text-cobalt-500">
                  <Mail aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-500" />
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--muted)]">Email</p>
                    <p className="mt-0.5 truncate text-sm font-medium">{profile.contactEmail}</p>
                  </div>
                </a>
              ) : null}
              {profile.contactPhone ? (
                <a
                  href={`tel:${profile.contactPhone.replace(/[^\d+]/g, "")}`}
                  className="flex min-w-0 items-start gap-3 transition hover:text-cobalt-500"
                >
                  <Phone aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-500" />
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--muted)]">Phone</p>
                    <p className="mt-0.5 truncate text-sm font-medium">{profile.contactPhone}</p>
                  </div>
                </a>
              ) : null}
            </div>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
              Recent Activity
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {recent.map((item) => (
                <Link
                  key={`${item.kind}-${item.slug}`}
                  href={`/${item.kind}/${item.slug}`}
                  className="rounded-md border border-transparent p-3 transition hover:border-[var(--line)] hover:bg-[color-mix(in_srgb,var(--accent-soft),transparent_84%)]"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{item.kind}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y hairline">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Selected Systems"
            title="Portfolio-safe abstractions of production AI engineering work."
            description="The examples focus on system patterns, tradeoffs, and engineering judgment while avoiding private architecture, client data, or proprietary implementation details."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {featured.map((item) => (
              <ContentCard key={item.slug} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <KnowledgeGraph skills={skills} />
      </section>
    </SiteShell>
  );
}

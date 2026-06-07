import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, Database, Mail, MapPin, Phone, SearchCheck, ShieldCheck } from "lucide-react";
import { ContentCard } from "@/components/card";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { MotionPanel } from "@/components/motion-panel";
import { SectionHeading } from "@/components/section-heading";
import { SiteShell } from "@/components/site-shell";
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
      <section id="overview" className="mx-auto grid max-w-7xl scroll-mt-24 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-20">
        <MotionPanel>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
            {profile.heroEyebrow}
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-normal text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            {profile.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[color-mix(in_srgb,var(--foreground),transparent_26%)]">
            {profile.heroSummary}
          </p>
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
        <MotionPanel delay={0.08} className="surface overflow-hidden rounded-lg p-0">
          <div className="relative min-h-[26rem] border-b hairline bg-[color-mix(in_srgb,var(--panel-strong),var(--accent-soft)_10%)] sm:min-h-[30rem] lg:min-h-[34rem]">
            <Image
              src={profile.profileImageUrl || "/media/rahul-profile.jpeg"}
              alt={`${profile.name} portrait`}
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover object-[50%_18%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/12 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
              <p className="max-w-sm text-2xl font-semibold tracking-normal sm:text-3xl">{profile.name}</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/82">{profile.role}</p>
              <div className="mt-4 grid gap-2 text-xs text-white/88">
                {profile.contactLocation ? (
                  <span className="inline-flex min-w-0 items-center gap-2 rounded-md bg-white/12 px-3 py-2 backdrop-blur">
                    <MapPin aria-hidden className="h-4 w-4 shrink-0" />
                    <span className="truncate">{profile.contactLocation}</span>
                  </span>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  {profile.contactEmail ? (
                    <a href={`mailto:${profile.contactEmail}`} className="inline-flex min-w-0 items-center gap-2 rounded-md bg-white/12 px-3 py-2 backdrop-blur transition hover:bg-white/18">
                      <Mail aria-hidden className="h-4 w-4 shrink-0" />
                      <span className="truncate">{profile.contactEmail}</span>
                    </a>
                  ) : null}
                  {profile.contactPhone ? (
                    <a href={`tel:${profile.contactPhone.replace(/[^\d+]/g, "")}`} className="inline-flex min-w-0 items-center gap-2 rounded-md bg-white/12 px-3 py-2 backdrop-blur transition hover:bg-white/18">
                      <Phone aria-hidden className="h-4 w-4 shrink-0" />
                      <span className="truncate">{profile.contactPhone}</span>
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <div className="p-5">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              { icon: Database, label: profile.focusLabel, value: profile.focusValue },
              { icon: ShieldCheck, label: profile.styleLabel, value: profile.styleValue },
              { icon: BarChart3, label: profile.modelLabel, value: profile.modelValue }
            ].map((item) => (
              <div key={item.label} className="rounded-md border hairline bg-[var(--panel-strong)] p-4">
                <item.icon aria-hidden className="h-5 w-5 text-cobalt-500" />
                <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{item.label}</p>
                <p className="mt-2 text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md border hairline bg-[var(--panel-strong)] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
              Recent Activity
            </p>
            <div className="mt-4 space-y-4">
              {recent.map((item) => (
                <Link
                  key={`${item.kind}-${item.slug}`}
                  href={`/${item.kind}/${item.slug}`}
                  className="block rounded-md p-2 transition hover:bg-[color-mix(in_srgb,var(--accent-soft),transparent_84%)]"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{item.kind}</p>
                </Link>
              ))}
            </div>
          </div>
          </div>
        </MotionPanel>
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

import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { ContentCard } from "@/components/card";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { MotionPanel } from "@/components/motion-panel";
import { SectionHeading } from "@/components/section-heading";
import { SiteShell } from "@/components/site-shell";
import { GitHubIcon, LinkedInIcon } from "@/components/social-icons";
import { EditableHero } from "@/components/editable-hero";
import { EditableAchievements } from "@/components/editable-achievements";
import { getAchievements, getExplorerItems, getProjects, getSiteProfile, getSkills } from "@/lib/content";

export default async function HomePage() {
  // Fetch sequentially to avoid exhausting Neon's connection pool.
  // React `cache()` deduplicates, so getProjects() inside getExplorerItems is free.
  const profile = await getSiteProfile();
  const projects = await getProjects();
  const items = await getExplorerItems();
  const skills = await getSkills();
  const achievements = await getAchievements();
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
      <section id="overview" className="relative overflow-hidden border-b hairline">
        <div className="relative mx-auto grid max-w-7xl scroll-mt-24 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-8 lg:py-20 xl:gap-20">
          <MotionPanel><EditableHero profile={profile} /></MotionPanel>

          <MotionPanel delay={0.08} className="lg:pt-8">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[15rem] overflow-hidden rounded-xl bg-[var(--panel-strong)] lg:mx-0 lg:ml-auto">
              {profile.profileImageUrl ? (
                <Image
                  src={profile.profileImageUrl}
                  alt={`${profile.name} portrait`}
                  fill
                  priority
                  sizes="15rem"
                  className="object-cover grayscale-[18%]"
                />
              ) : (
                <div className="grid h-full place-items-center text-5xl font-semibold text-[var(--accent)]">{profile.initials}</div>
              )}
            </div>
            <div className="mt-5 border-t hairline pt-4">
              <p className="font-semibold">{profile.name}</p>
              <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{profile.contactLocation}</p>
              {profile.githubUrl || profile.linkedinUrl ? (
                <div className="mt-3 flex gap-1">
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
              <a href={`mailto:${profile.contactEmail}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
                <Mail aria-hidden className="h-4 w-4" /> Start a conversation
              </a>
            </div>
          </MotionPanel>
        </div>
      </section>

      <section className="border-b hairline bg-[var(--panel)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[0.34fr_1fr] lg:px-8">
          <p className="eyebrow">Latest evidence</p>
          <div>
            <div className="grid gap-px overflow-hidden rounded-lg border hairline bg-[var(--line)] sm:grid-cols-2">
              {recent.map((item) => (
                <Link
                  key={`${item.kind}-${item.slug}`}
                  href={`/${item.kind}/${item.slug}`}
                  className="bg-[var(--panel-strong)] p-4 transition hover:bg-[color-mix(in_srgb,var(--accent),transparent_92%)]"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{item.kind}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="awards-achievements" className="border-b hairline">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <EditableAchievements items={achievements} profile={profile} />
        </div>
      </section>

      <section className="border-b hairline">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Selected Systems"
            title="Systems with inspectable architecture, outcomes, and operating constraints."
            description="Systems Explorer prioritizes credible proof: the problem, the implementation boundary, measurable signals, and the decisions that make each system reviewable."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {featured.map((item) => (
              <ContentCard key={item.slug} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <KnowledgeGraph skills={skills} />
      </section>
    </SiteShell>
  );
}

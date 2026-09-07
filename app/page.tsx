import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mail } from "lucide-react";
import { ContentCard } from "@/components/card";
import { SectionHeading } from "@/components/section-heading";
import { SiteShell } from "@/components/site-shell";
import { GitHubIcon, LinkedInIcon } from "@/components/social-icons";
import { InlineProfileText } from "@/components/inline-profile-text";
import { EditableHero } from "@/components/editable-hero";
import { EditableAchievements } from "@/components/editable-achievements";
import { RecruiterBrief } from "@/components/recruiter-brief";
import { getAchievements, getProjects, getSiteProfile } from "@/lib/content";
import { isRenderableProfileImage } from "@/lib/media";

function recruiterCopy(value: string, fallback: string) {
  return /\b(editable|edit mode|cms)\b/i.test(value) ? fallback : value;
}

export default async function HomePage() {
  // Fetch sequentially to avoid exhausting Neon's connection pool.
  // React `cache()` deduplicates, so getProjects() inside getExplorerItems is free.
  const profile = await getSiteProfile();
  const projects = await getProjects();
  const achievements = await getAchievements();
  const featuredProjects = projects.filter((project) => project.featured);
  const featured = [...featuredProjects, ...projects.filter((project) => !project.featured)].slice(0, 3);
  const profileImage = isRenderableProfileImage(profile.profileImageUrl) ? profile.profileImageUrl : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    image: profileImage,
    email: profile.contactEmail,
    telephone: profile.contactPhone,
    address: profile.contactLocation,
    knowsAbout: ["Retrieval-Augmented Generation", "MLOps", "Vector Search", "NLP", "Analytics"]
  };

  return (
    <SiteShell profile={profile}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section id="overview" className="relative overflow-hidden border-b hairline">
        <div className="relative mx-auto grid max-w-7xl scroll-mt-24 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-8 lg:py-14 xl:gap-20">
          <div><EditableHero profile={profile} /></div>

          <div className="lg:pt-8">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[15rem] overflow-hidden rounded-xl bg-[var(--panel-strong)] lg:mx-0 lg:ml-auto">
              {profileImage ? (
                <Image
                  src={profileImage}
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
                <Mail aria-hidden className="h-4 w-4" /> {profile.contactCtaLabel || "Start a conversation"}
              </a>
            </div>
          </div>
        </div>
      </section>

      <RecruiterBrief profile={profile} />

      <section id="selected-systems" className="border-b hairline">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-4 lg:grid-cols-[0.34fr_1fr]">
            <p className="eyebrow"><InlineProfileText profile={profile} field="homeSystemsEyebrow" label="Selected systems eyebrow" value={profile.homeSystemsEyebrow} /></p>
            <div>
              <h2 className="editorial-title text-balance text-4xl leading-[1.02] sm:text-5xl"><InlineProfileText profile={profile} field="homeSystemsTitle" label="Selected systems title" value={profile.homeSystemsTitle} /></h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]"><InlineProfileText profile={profile} field="homeSystemsDescription" label="Selected systems description" value={profile.homeSystemsDescription} multiline /></p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {featured.map((item) => (
              <ContentCard key={item.slug} item={item} />
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t hairline pt-6">
            <p className="text-sm text-[var(--muted)]">More experiments, writing, dashboards, and technical notes are available in the full explorer.</p>
            <Link href="/explorer" className="inline-flex h-10 items-center gap-2 rounded-md border hairline px-4 text-sm font-semibold transition hover:border-[var(--accent)]">Browse all evidence <ArrowRight aria-hidden className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section id="awards-achievements" className="border-b hairline">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow={profile.awardsEyebrow}
            title={recruiterCopy(profile.awardsTitle, "Evidence supporting the AI engineering story.")}
            description={recruiterCopy(profile.awardsDescription, "Awards, credentials, leadership signals, and milestone proof relevant to the work.")}
            profile={profile}
            editable={{
              eyebrow: "awardsEyebrow",
              title: "awardsTitle",
              description: "awardsDescription"
            }}
          />
          <div className="mt-9">
            <EditableAchievements items={achievements} />
          </div>
        </div>
      </section>

    </SiteShell>
  );
}

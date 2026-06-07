import type { Metadata } from "next";
import { ExplorerClient } from "@/components/explorer-client";
import { SectionHeading } from "@/components/section-heading";
import { SiteShell } from "@/components/site-shell";
import { getExplorerItems, getSiteProfile } from "@/lib/content";

export const metadata: Metadata = {
  title: "Unified Explorer",
  description: "Search and filter projects, case studies, experiments, blogs, dashboards, and AI engineering notes."
};

export default async function ExplorerPage() {
  const [items, profile] = await Promise.all([getExplorerItems(), getSiteProfile()]);
  return (
    <SiteShell profile={profile}>
      <section id="explorer" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={profile.explorerEyebrow}
          title={profile.explorerTitle}
          description={profile.explorerDescription}
        />
        <div className="mt-8">
          <ExplorerClient items={items} />
        </div>
      </section>
    </SiteShell>
  );
}

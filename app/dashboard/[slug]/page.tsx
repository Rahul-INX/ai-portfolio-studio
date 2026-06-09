import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { RelatedItems } from "@/components/related-items";
import { ScrollAnalytics } from "@/components/scroll-analytics";
import { SiteShell } from "@/components/site-shell";
import { getDashboards, getExplorerItems } from "@/lib/content";
import { resolvePortfolioMedia } from "@/lib/media";

export async function generateStaticParams() {
  return (await getDashboards()).map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = (await getDashboards()).find((dashboard) => dashboard.slug === slug);
  return item ? { title: item.title, description: item.summary } : {};
}

export default async function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [dashboards, items] = await Promise.all([getDashboards(), getExplorerItems()]);
  const item = dashboards.find((dashboard) => dashboard.slug === slug);
  if (!item) notFound();
  const related = items
    .filter((candidate) => candidate.slug !== item.slug && candidate.tags.some((tag) => item.tags.includes(tag)))
    .slice(0, 4);
  return (
    <SiteShell>
      <ScrollAnalytics contentType="DASHBOARD" slug={item.slug} />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">Dashboard</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal">{item.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[color-mix(in_srgb,var(--foreground),transparent_26%)]">{item.summary}</p>
        <div id="preview" className="surface quiet-grid mt-10 grid min-h-[420px] scroll-mt-24 place-items-center rounded-lg p-8">
          {item.embedUrl ? (
            <iframe title={item.title} src={item.embedUrl} className="h-[520px] w-full rounded-md border hairline" />
          ) : item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvePortfolioMedia(item.imageUrl)}
              alt={`${item.title} dashboard preview`}
              className="max-h-[560px] w-full rounded-lg border hairline bg-[var(--panel-strong)] object-contain p-2 shadow-xl shadow-ink-950/10"
            />
          ) : (
            <div className="max-w-md text-center">
              <BarChart3 aria-hidden className="mx-auto h-10 w-10 text-cobalt-500" />
              <h2 className="mt-5 text-xl font-semibold">Interactive embed ready</h2>
              <p className="mt-3 leading-7 text-[var(--muted)]">
                This slot is configured for Power BI screenshots, Streamlit apps, or database-hosted analytics media.
              </p>
            </div>
          )}
        </div>
        <RelatedItems items={related} />
      </section>
    </SiteShell>
  );
}

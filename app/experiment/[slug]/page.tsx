import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReadingProgress } from "@/components/reading-progress";
import { RelatedItems } from "@/components/related-items";
import { ScrollAnalytics } from "@/components/scroll-analytics";
import { SiteShell } from "@/components/site-shell";
import { getExperiments, getExplorerItems } from "@/lib/content";
import { slugifySection } from "@/lib/citations";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { resolvePortfolioMedia } from "@/lib/media";

export async function generateStaticParams() {
  return (await getExperiments()).map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = (await getExperiments()).find((experiment) => experiment.slug === slug);
  return item ? { title: item.title, description: item.summary } : {};
}

export default async function ExperimentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [experiments, items] = await Promise.all([getExperiments(), getExplorerItems()]);
  const item = experiments.find((experiment) => experiment.slug === slug);
  if (!item) notFound();
  const related = items
    .filter((candidate) => candidate.slug !== item.slug && candidate.tags.some((tag) => item.tags.includes(tag)))
    .slice(0, 4);
  const sections = [
    ["Hypothesis", item.hypothesis],
    ["Method", item.method],
    ["Findings", item.findings],
    ["Next Step", item.nextStep]
  ];
  const renderedSections = await Promise.all(
    sections.map(async ([title, body]) => [title, await renderMarkdownToHtml(body as string)] as const)
  );
  return (
    <SiteShell>
      <ReadingProgress />
      <ScrollAnalytics contentType="EXPERIMENT" slug={item.slug} />
      <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">{item.status}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal">{item.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[color-mix(in_srgb,var(--foreground),transparent_26%)]">{item.summary}</p>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvePortfolioMedia(item.imageUrl)}
            alt={`${item.title} experiment visual`}
            className="mt-8 max-h-[560px] w-full rounded-md border hairline object-cover"
          />
        ) : null}
        <div id="metrics" className="mt-8 grid scroll-mt-24 gap-4 sm:grid-cols-2">
          {item.metrics.map((metric) => (
            <div key={metric.label} className="surface rounded-lg p-5">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{metric.label}</p>
              <p className="mt-3 text-2xl font-semibold text-cobalt-500">{metric.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-5">
          {renderedSections.map(([title, body]) => (
            <section key={title} id={slugifySection(title)} className="surface rounded-lg p-6 scroll-mt-24">
              <h2 className="text-xl font-semibold">{title}</h2>
              <div className="mt-4 prose-premium" dangerouslySetInnerHTML={{ __html: body }} />
            </section>
          ))}
        </div>
        <RelatedItems items={related} />
      </article>
    </SiteShell>
  );
}

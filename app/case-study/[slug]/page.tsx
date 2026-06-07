import type { Metadata } from "next";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { notFound } from "next/navigation";
import { ReadingProgress } from "@/components/reading-progress";
import { RelatedItems } from "@/components/related-items";
import { ScrollAnalytics } from "@/components/scroll-analytics";
import { SiteShell } from "@/components/site-shell";
import { getCaseStudies, getExplorerItems } from "@/lib/content";
import { slugifySection } from "@/lib/citations";
import { resolvePortfolioMedia } from "@/lib/media";

export async function generateStaticParams() {
  return (await getCaseStudies()).map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = (await getCaseStudies()).find((caseStudy) => caseStudy.slug === slug);
  return item ? { title: item.title, description: item.summary } : {};
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [caseStudies, items] = await Promise.all([getCaseStudies(), getExplorerItems()]);
  const item = caseStudies.find((caseStudy) => caseStudy.slug === slug);
  if (!item) notFound();
  const related = items
    .filter((candidate) => candidate.slug !== item.slug && candidate.tags.some((tag) => item.tags.includes(tag)))
    .slice(0, 4);
  const sections = [
    ["Problem", item.problem],
    ["Context", item.context],
    ["Approach", item.approach],
    ["Business Value", item.businessValue]
  ];

  const renderedSections = await Promise.all(
    sections.map(async ([title, body]) => [title, await renderMarkdownToHtml(body as string)] as const)
  );

  return (
    <SiteShell>
      <ReadingProgress />
      <ScrollAnalytics contentType="CASE_STUDY" slug={item.slug} />
      <article className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[250px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-2 text-sm text-[var(--muted)]" aria-label="Case study sections">
            {sections.map(([title]) => (
              <a key={title} href={`#${slugifySection(title)}`} className="block rounded-md px-3 py-2 hover:bg-[var(--panel)]">
                {title}
              </a>
            ))}
          </nav>
        </aside>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">Case Study</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal">{item.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[color-mix(in_srgb,var(--foreground),transparent_26%)]">{item.summary}</p>
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvePortfolioMedia(item.imageUrl)}
              alt={`${item.title} case study visual`}
              className="mt-8 max-h-[560px] w-full rounded-md border hairline object-cover"
            />
          ) : null}
          <div className="mt-10 space-y-5">
            {renderedSections.map(([title, body]) => (
              <section key={title} id={slugifySection(title)} className="surface rounded-lg p-6 scroll-mt-24">
                <h2 className="text-xl font-semibold">{title}</h2>
                <div className="mt-4 prose-premium" dangerouslySetInnerHTML={{ __html: body }} />
              </section>
            ))}
          </div>
          <RelatedItems items={related} />
        </div>
      </article>
    </SiteShell>
  );
}

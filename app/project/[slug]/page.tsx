import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReadingProgress } from "@/components/reading-progress";
import { RelatedItems } from "@/components/related-items";
import { ScrollAnalytics } from "@/components/scroll-analytics";
import { SiteShell } from "@/components/site-shell";
import { getExplorerItems, getProjects } from "@/lib/content";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { resolvePortfolioMedia } from "@/lib/media";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = (await getProjects()).find((item) => item.slug === slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [projects, items] = await Promise.all([getProjects(), getExplorerItems()]);
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();
  const related = items
    .filter((item) => item.slug !== project.slug && item.tags.some((tag) => project.tags.includes(tag)))
    .slice(0, 4);

  const [descriptionHtml, impactHtml] = await Promise.all([
    renderMarkdownToHtml(project.description),
    renderMarkdownToHtml(project.businessImpact),
  ]);
  const dateRange = [project.startDate, project.endDate]
    .map((value) => (value ? new Date(value).toLocaleDateString("en", { month: "short", year: "numeric" }) : "Present"))
    .join(" - ");

  return (
    <SiteShell>
      <ReadingProgress />
      <ScrollAnalytics contentType="PROJECT" slug={project.slug} />
      <article className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[250px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-2 text-sm text-[var(--muted)]" aria-label="Project sections">
            {["Overview", "Impact", "Metrics", "Architecture", "Related"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="block rounded-md px-3 py-2 hover:bg-[var(--panel)]">
                {item}
              </a>
            ))}
          </nav>
        </aside>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
            {project.status}
          </p>
          <h1 className="editorial-title mt-4 text-4xl sm:text-5xl">{project.title}</h1>
          {(project.startDate || project.endDate) ? (
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{dateRange}</p>
          ) : null}
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[color-mix(in_srgb,var(--foreground),transparent_26%)]">
            {project.subtitle}
          </p>
          {project.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvePortfolioMedia(project.imageUrl)}
              alt={`${project.title} preview`}
              className="mt-8 max-h-[560px] w-full rounded-md border hairline object-cover"
            />
          ) : null}
          <section id="overview" className="mt-10 surface rounded-lg p-6 scroll-mt-24">
            <h2 className="text-xl font-semibold">Overview</h2>
            <div className="mt-4 prose-premium" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
          </section>
          <section id="impact" className="mt-6 surface rounded-lg p-6 scroll-mt-24">
            <h2 className="text-xl font-semibold">Impact</h2>
            <div className="mt-4 prose-premium" dangerouslySetInnerHTML={{ __html: impactHtml }} />
          </section>
          <section id="metrics" className="mt-6 grid scroll-mt-24 gap-4 sm:grid-cols-3">
            {project.metrics.map((metric) => (
              <div key={metric.label} className="surface rounded-lg p-5">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{metric.label}</p>
                <p className={metric.accent ? "mt-3 text-2xl font-semibold text-cobalt-500" : "mt-3 text-2xl font-semibold"}>
                  {metric.value}
                </p>
              </div>
            ))}
          </section>
          <section id="architecture" className="mt-6 surface rounded-lg p-6 scroll-mt-24">
            <h2 className="text-xl font-semibold">Architecture Canvas</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {Object.entries(project.architectureCanvas).map(([key, values]) => (
                <div key={key} className="rounded-md border hairline p-4">
                  <h3 className="capitalize">{key.replace(/([A-Z])/g, " $1")}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                    {values.map((value) => (
                      <li key={value}>{value}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
          <section id="related">
            <RelatedItems items={related} />
          </section>
        </div>
      </article>
    </SiteShell>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReadingProgress } from "@/components/reading-progress";
import { RelatedItems } from "@/components/related-items";
import { ScrollAnalytics } from "@/components/scroll-analytics";
import { SiteShell } from "@/components/site-shell";
import { getBlogs, getExplorerItems } from "@/lib/content";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { resolvePortfolioMedia } from "@/lib/media";

export async function generateStaticParams() {
  return (await getBlogs()).map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = (await getBlogs()).find((blog) => blog.slug === slug);
  return item
    ? {
        title: item.seoTitle,
        description: item.seoSummary,
        openGraph: { title: item.seoTitle, description: item.seoSummary },
        twitter: { title: item.seoTitle, description: item.seoSummary }
      }
    : {};
}

export default async function BlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [blogs, items] = await Promise.all([getBlogs(), getExplorerItems()]);
  const item = blogs.find((blog) => blog.slug === slug);
  if (!item) notFound();
  const related = items
    .filter((candidate) => candidate.slug !== item.slug && candidate.tags.some((tag) => item.tags.includes(tag)))
    .slice(0, 4);
  const html = await renderMarkdownToHtml(item.content.replace(/^#\s+.*(?:\r?\n|$)/, ""));
  return (
    <SiteShell>
      <ReadingProgress />
      <ScrollAnalytics contentType="BLOG" slug={item.slug} />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
          {item.readTime} min read
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal">{item.title}</h1>
        <p className="mt-5 text-lg leading-8 text-[color-mix(in_srgb,var(--foreground),transparent_26%)]">{item.excerpt}</p>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvePortfolioMedia(item.imageUrl)}
            alt={`${item.title} cover`}
            className="mt-8 max-h-[560px] w-full rounded-md border hairline object-cover"
          />
        ) : null}
        <div id="article" className="prose-premium mt-10 scroll-mt-24" dangerouslySetInnerHTML={{ __html: html }} />
        <RelatedItems items={related} />
      </article>
    </SiteShell>
  );
}

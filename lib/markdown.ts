import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { slugifySection } from "@/lib/citations";
import { resolvePortfolioMedia } from "@/lib/media";

/** Compact Markdown into safe, readable copy for cards and search results. */
export function markdownToPlainText(source: string) {
  return source
    .replace(/!\[([^\]]*)\]\([^\s)]+(?:\s+"[^"]*")?\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^\s)]+(?:\s+"[^"]*")?\)/g, "$1")
    .replace(/[`*_~>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function replaceVolatileImageSources() {
  return (tree: { type?: string; tagName?: string; properties?: { src?: unknown }; children?: unknown[] }) => {
    const visit = (node: typeof tree) => {
      if (node.type === "element" && node.tagName === "img" && typeof node.properties?.src === "string") {
        node.properties.src = resolvePortfolioMedia(node.properties.src);
      }
      if (Array.isArray(node.children)) node.children.forEach((child) => visit(child as typeof tree));
    };
    visit(tree);
  };
}

export function addHeadingIds(html: string) {
  return html.replace(/<h([2-4])>(.*?)<\/h\1>/g, (match, level: string, content: string) => {
    const text = content.replace(/<[^>]+>/g, "").trim();
    if (!text) return match;
    return `<h${level} id="${slugifySection(text)}">${content}</h${level}>`;
  });
}

/**
 * Render a markdown string to sanitized HTML.
 * Used server-side by detail pages and server components.
 */
export async function renderMarkdownToHtml(source: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(replaceVolatileImageSources)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(source);
  return addHeadingIds(String(result));
}

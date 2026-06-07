import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { slugifySection } from "@/lib/citations";

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
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(source);
  return addHeadingIds(String(result));
}

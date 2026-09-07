import { isVolatileExternalMedia } from "@/lib/media";
import type { ExplorerItem } from "@/lib/types";

export type ContentHealthIssue = {
  kind: ExplorerItem["kind"];
  slug: string;
  title: string;
  message: string;
};

const markdownLink = /!?(?:\[[^\]]*\])\(https?:\/\//i;

export function scanContentHealth(items: ExplorerItem[]) {
  const issues: ContentHealthIssue[] = [];

  for (const item of items) {
    const summary = "summary" in item ? item.summary : item.excerpt;
    if (markdownLink.test(summary)) {
      issues.push({ kind: item.kind, slug: item.slug, title: item.title, message: "Card copy contains Markdown; public cards show plain text." });
    }
    if (isVolatileExternalMedia(item.imageUrl)) {
      issues.push({ kind: item.kind, slug: item.slug, title: item.title, message: "LinkedIn-hosted media can expire; upload a copy to the CMS." });
    }
  }

  return issues;
}

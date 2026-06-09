import { buildSiteContextItems } from "@/lib/site-context";
import { getSiteProfile } from "@/lib/content";

export async function GET() {
  const [items, profile] = await Promise.all([buildSiteContextItems(), getSiteProfile()]);

  const lines = [
    `# ${profile.name}`,
    "",
    "Full AI-readable portfolio bundle. Every section includes a canonical section URL for citation and direct navigation.",
    "",
    ...items.flatMap((item) => [
      `## ${item.title}${item.section ? ` - ${item.section}` : ""}`,
      `URL: ${item.url}`,
      `Canonical citation: [${item.title}${item.section ? ` - ${item.section}` : ""}](${item.url})`,
      `Type: ${item.kind}`,
      `Tags: ${item.tags.join(", ")}`,
      item.imageUrl ? `Image: ${item.imageUrl}` : "",
      "",
      item.summary,
      "",
      item.body,
      ""
    ].filter(Boolean))
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

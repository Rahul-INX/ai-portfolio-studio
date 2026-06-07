import { buildSiteContextItems } from "@/lib/site-context";

export async function GET() {
  const items = await buildSiteContextItems();

  const lines = [
    "# Rahul Harivansh Fatyal",
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

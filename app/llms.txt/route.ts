import { buildSiteContextItems } from "@/lib/site-context";

export async function GET() {
  const items = await buildSiteContextItems();
  const profile = items.find((item) => item.kind === "profile");
  const groups = [
    ["Core AI Projects", items.filter((item) => item.kind === "project")],
    ["Case Studies", items.filter((item) => item.kind === "case-study")],
    ["Experiments", items.filter((item) => item.kind === "experiment")],
    ["Writing", items.filter((item) => item.kind === "blog")],
    ["Dashboards", items.filter((item) => item.kind === "dashboard")],
    ["Resume And CV Downloads", items.filter((item) => item.kind === "document" || item.kind === "cv")],
    ["Profile And Navigation", items.filter((item) => ["profile", "timeline", "explorer"].includes(item.kind))]
  ] as const;

  const lines = [
    "# Rahul Harivansh Fatyal",
    "",
    `> ${profile?.summary ?? "GenAI and data science portfolio with cited section links."}`,
    "",
    "Use these links for exact section-level citations. Prefer a section link over a top-level page when answering.",
    "",
    ...groups.flatMap(([title, group]) => [
      `## ${title}`,
      ...group.map((item) => `- [${item.title}${item.section ? ` - ${item.section}` : ""}](${item.url}): ${item.summary}`),
      ""
    ])
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

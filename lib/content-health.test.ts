import assert from "node:assert/strict";
import test from "node:test";
import { scanContentHealth } from "./content-health";
import type { ExplorerItem } from "./types";

const item: ExplorerItem = {
  kind: "project",
  slug: "proof",
  title: "Proof",
  subtitle: "",
  summary: "Read [the proof](https://example.com).",
  description: "",
  status: "COMPLETED",
  techStack: [],
  tags: [],
  imageUrl: "https://media.licdn.com/dms/image/example",
  metrics: [],
  businessImpact: "",
  architectureCanvas: { layers: [], principles: [], riskControls: [] }
};

test("flags Markdown card copy and volatile LinkedIn media", () => {
  const messages = scanContentHealth([item]).map((issue) => issue.message);
  assert.ok(messages.some((message) => message.includes("Markdown")));
  assert.ok(messages.some((message) => message.includes("LinkedIn")));
});

test("flags recruiter trust defects outside card summaries", () => {
  const issues = scanContentHealth([item], {
    profile: { heroSummary: "Artifificial Intelligence" },
    certifications: [{ id: "cert-1", title: "Cloud certificate", issuer: "Issuer", url: null }],
    timeline: [{ id: "timeline-1", title: "AI work", description: "Architectured an Applictions system at https://rahul-portfolio-old-rahul-inxs-projects.vercel.app" }]
  });
  assert.ok(issues.some((issue) => issue.kind === "site-profile"));
  assert.ok(issues.some((issue) => issue.kind === "certification"));
  assert.ok(issues.some((issue) => issue.kind === "timeline"));
  assert.ok(issues.some((issue) => issue.message.includes("public repo or demo")));
});

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
  assert.equal(scanContentHealth([item]).length, 2);
});

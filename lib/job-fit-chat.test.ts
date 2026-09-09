import assert from "node:assert/strict";
import test from "node:test";
import { jobFitChatSystem } from "@/lib/job-fit-chat";
import { buildJobFitIntelligenceResult } from "@/lib/job-fit-intelligence";
import type { ContextEvidence } from "@/lib/site-context";

test("limits Job Fit chat instructions to the saved inquiry evidence", () => {
  const evidence: ContextEvidence = { id: "project:rag", citationId: "S1", kind: "project", slug: "rag", title: "RAG project", section: "Overview", url: "/project/rag#overview", summary: "RAG", body: "Built retrieval-augmented generation with Python.", snippet: "Built RAG with Python.", tags: ["RAG", "Python"], reason: "test" };
  const result = buildJobFitIntelligenceResult("We require RAG and Python for an AI Engineer role.", [evidence]);
  const prompt = jobFitChatSystem(result);
  assert.match(prompt, /\/project\/rag#overview/);
  assert.match(prompt, /Never invent skills/);
});

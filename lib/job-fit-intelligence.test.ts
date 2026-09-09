import assert from "node:assert/strict";
import test from "node:test";
import {
  buildJobFitIntelligenceResult,
  buildRequirementEvidenceLedger,
  extractJobFitMetadata,
  withFinalJobFitAudit,
} from "@/lib/job-fit-intelligence";
import type { ContextEvidence } from "@/lib/site-context";

function evidence(index: number): ContextEvidence {
  return {
    id: `project:${index}`,
    citationId: `S${index}`,
    kind: "project",
    slug: `project-${index}`,
    title: `Retrieval project ${index}`,
    section: "Architecture",
    url: `/project/project-${index}#architecture`,
    summary: "A retrieval-augmented generation system.",
    body: "Built and evaluated a production RAG system with embeddings, retrieval and citations.",
    snippet: "Built and evaluated a production RAG system.",
    tags: ["RAG", "Retrieval", "Embeddings"],
    reason: "test",
  };
}

test("keeps all relevant evidence in a requirement ledger instead of imposing a global cap", () => {
  const jd = "We require retrieval-augmented generation, embeddings, and production delivery experience.";
  const ledger = buildRequirementEvidenceLedger(jd, Array.from({ length: 16 }, (_, index) => evidence(index + 1)));

  assert.equal(ledger.length >= 1, true);
  assert.equal(ledger[0].evidence.length, 16);
});

test("does not treat a negated technology as a role requirement", () => {
  const metadata = extractJobFitMetadata("Company: Acme. Senior engineer role. Python is not required; applicants may use any language.");

  assert.equal(metadata.requirements.some((requirement) => requirement.name === "Python"), false);
});

test("extracts an unlabelled role before an at-company phrase", () => {
  const metadata = extractJobFitMetadata("Platform Engineer at Example Labs in Bengaluru. Build secure TypeScript services.");

  assert.equal(metadata.role, "Platform Engineer");
  assert.equal(metadata.company, "Example Labs");
  assert.equal(metadata.location, "Bengaluru");
});

test("separates auditable fit from evidence-backed advocacy", () => {
  const result = buildJobFitIntelligenceResult(
    "Acme is hiring a Senior AI Engineer in Bengaluru. Build RAG systems with Python and production ownership.",
    [evidence(1), evidence(2)],
  );

  assert.equal("percentile" in result.scoring, false);
  assert.equal(result.advocacy.claims.every((claim) => claim.citations.length > 0), true);
  assert.match(result.summary, /public portfolio evidence/i);
});

test("persists the final specialist audit shown to the recruiter", () => {
  const intelligence = buildJobFitIntelligenceResult(
    "Acme is hiring a Senior AI Engineer in Bengaluru. Build RAG systems with Python and production ownership.",
    [evidence(1)],
  );
  const specialist = { ...intelligence.audit, mode: "specialist-agent" as const, overallScore: 84, verdict: "Strong cited alignment for the role." };
  const result = withFinalJobFitAudit(intelligence, specialist);

  assert.equal(result.audit.mode, "specialist-agent");
  assert.equal(result.scoring.fitScore, 84);
  assert.equal(result.summary, specialist.verdict);
});

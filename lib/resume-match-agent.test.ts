import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRequirementAlignment,
  deterministicJobFit,
  jobFitDimensionNames,
  selectRelevantJobEvidence,
  verifiedEvidenceSignals
} from "@/lib/job-fit";
import { validateResumeMatchAgentOutput } from "@/lib/resume-match-agent";
import { gatherAllPortfolioEvidence, type ContextEvidence } from "@/lib/site-context";

const evidence: ContextEvidence[] = [
  {
    id: "project-1",
    citationId: "project-1",
    kind: "project",
    title: "Resume Matcher",
    section: "Architecture",
    url: "/project/resume-matcher",
    summary: "A structured AI matching system.",
    snippet: "Uses retrieval and typed scoring.",
    body: "Python FastAPI retrieval evidence scoring.",
    tags: ["Python", "FastAPI"],
    reason: "Matches backend and retrieval requirements."
  }
];

const fallback = deterministicJobFit(
  "Python FastAPI retrieval evidence scoring role with production responsibilities",
  evidence
);

function validAgentResult() {
  return {
    ...fallback,
    mode: "specialist-agent" as const,
    dimensions: fallback.dimensions.map((dimension, index) => ({
      ...dimension,
      name: jobFitDimensionNames[index]
    }))
  };
}

test("accepts a schema-valid agent result grounded in allowed evidence URLs", () => {
  const result = validateResumeMatchAgentOutput(
    validAgentResult(),
    evidence,
    "Python FastAPI retrieval evidence scoring role"
  );

  assert.equal(result?.mode, "specialist-agent");
  assert.equal(result?.topEvidence[0].title, "Resume Matcher - Architecture");
  assert.equal(result?.sources[0].title, "Resume Matcher - Architecture");
  assert.deepEqual(result?.topEvidence[0].matchedSignals, ["evidence", "fastapi", "python", "retrieval", "scoring"]);
  assert.match(result?.topEvidence[0].matchReason ?? "", /verified JD signals/i);
});

test("rejects an agent result containing an invented citation URL", () => {
  const candidate = validAgentResult();
  candidate.sources = [{ ...candidate.sources[0], url: "/invented-source" }];

  const result = validateResumeMatchAgentOutput(
    candidate,
    evidence,
    "Python FastAPI retrieval evidence scoring role"
  );

  assert.equal(result, null);
});

test("rejects an allowed citation that has no verified overlap with the JD", () => {
  const result = validateResumeMatchAgentOutput(
    validAgentResult(),
    evidence,
    "Kubernetes Terraform infrastructure platform"
  );

  assert.equal(result, null);
});

test("does not match short technology names inside unrelated words", () => {
  assert.deepEqual(
    verifiedEvidenceSignals("API platform", {
      ...evidence[0],
      summary: "Business capabilities and communication.",
      snippet: "",
      body: "",
      tags: []
    }),
    []
  );
});

test("returns no evidence instead of an unrelated baseline citation", () => {
  const selected = selectRelevantJobEvidence("Kubernetes Terraform infrastructure platform", evidence);
  const result = deterministicJobFit("Kubernetes Terraform infrastructure platform", selected);

  assert.deepEqual(selected, []);
  assert.deepEqual(result.topEvidence, []);
  assert.deepEqual(result.sources, []);
  assert.equal(result.fitLabel, "Low Evidence");
});

test("site-wide evidence indexing includes every supported resource type", async () => {
  const allEvidence = await gatherAllPortfolioEvidence("Python RAG AWS leadership certification");
  const kinds = new Set(allEvidence.map((item) => item.kind));

  for (const kind of [
    "profile",
    "explorer",
    "timeline",
    "cv",
    "document",
    "skill",
    "certification",
    "project",
    "case-study",
    "experiment",
    "blog",
    "dashboard"
  ]) {
    assert.ok(kinds.has(kind as ContextEvidence["kind"]), `Expected ${kind} resources to be indexed`);
  }
});

test("selected job-fit evidence preserves section-level citation URLs and labels", async () => {
  const jdText = [
    "GenAI engineer role requiring Python, FastAPI, RAG, retrieval, vector search, FAISS, NLP, document processing, dashboards, and evaluation.",
    "The recruiter needs only public portfolio evidence with section-level citations."
  ].join(" ");
  const allEvidence = await gatherAllPortfolioEvidence(jdText);
  const selected = selectRelevantJobEvidence(jdText, allEvidence);
  const selectedByUrl = new Map(selected.map((item) => [item.url, item]));
  const result = deterministicJobFit(jdText, selected, allEvidence);

  assert.ok(selected.length > 0, "Expected current portfolio context to select relevant evidence.");

  for (const item of selected) {
    if (item.section) {
      assert.match(item.url, /#[-a-z0-9]+$/);
    }
  }

  for (const item of [...result.topEvidence, ...result.sources]) {
    const source = selectedByUrl.get(item.url);
    assert.ok(source, `Expected ${item.url} to come from selected relevant evidence.`);
    if (source.section) {
      assert.match(item.url, /#[-a-z0-9]+$/);
      assert.equal(item.title, `${source.title} - ${source.section}`);
    }
  }
});

test("relevance selection excludes resources without verified JD overlap", () => {
  const unrelated: ContextEvidence = {
    ...evidence[0],
    id: "unrelated",
    citationId: "unrelated",
    title: "Unrelated visual design note",
    url: "/blog/unrelated",
    summary: "Typography and color systems.",
    snippet: "Typography and color systems.",
    body: "Typography and color systems.",
    tags: ["Design"]
  };

  const selected = selectRelevantJobEvidence(
    "Python FastAPI retrieval evidence scoring role",
    [...evidence, unrelated]
  );

  assert.deepEqual(selected.map((item) => item.id), ["project-1"]);
});

test("one ambiguous narrative keyword is not enough to show evidence", () => {
  const imagePreservationEvidence: ContextEvidence = {
    ...evidence[0],
    id: "image-preservation",
    citationId: "image-preservation",
    title: "DOCX RAG Image Preservation",
    url: "/experiment/docx-rag-image-preservation#findings",
    summary: "Preserves document images during RAG ingestion.",
    snippet: "Image preservation keeps document context intact.",
    body: "The pipeline preserves extracted images and markdown placeholders.",
    tags: ["RAG", "Documents"]
  };

  const selected = selectRelevantJobEvidence(
    "Marine researcher responsible for specimen preservation and coral reef sampling",
    [imagePreservationEvidence]
  );

  assert.deepEqual(selected, []);
});

test("one exact atomic skill remains valid evidence", () => {
  const skillEvidence: ContextEvidence = {
    ...evidence[0],
    id: "skill-aws",
    citationId: "skill-aws",
    kind: "skill",
    title: "AWS",
    section: "Skill AWS",
    url: "/timeline#skill-aws",
    summary: "AWS is listed as a cloud skill.",
    snippet: "AWS",
    body: "Skill: AWS.",
    tags: ["Skill", "AWS"]
  };

  const selected = selectRelevantJobEvidence(
    "Cloud role requiring AWS",
    [skillEvidence]
  );

  assert.deepEqual(selected.map((item) => item.id), ["skill-aws"]);
});

test("requirement notes distinguish direct alignment from missing public evidence", () => {
  const notes = buildRequirementAlignment(
    "Python FastAPI role requiring Kubernetes and cloud deployment",
    evidence
  );

  assert.equal(notes.find((item) => item.requirement === "Python")?.status, "Aligned");
  assert.equal(notes.find((item) => item.requirement === "Containers / orchestration")?.status, "Not evidenced");
  assert.equal(notes.find((item) => item.requirement === "Cloud platforms")?.status, "Not evidenced");
});

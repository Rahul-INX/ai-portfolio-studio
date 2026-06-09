import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRequirementAlignment,
  buildJobRubric,
  deterministicJobFit,
  jobFitResultSchema,
  selectRelevantJobEvidence,
  verifiedEvidenceSignals
} from "@/lib/job-fit";
import {
  agentInstructions,
  createResumeMatchRequestBody,
  resumeMatchOutputJsonSchema,
  runResumeMatchAgent,
  validateResumeMatchAgentOutput
} from "@/lib/resume-match-agent";
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
    mode: "specialist-agent" as const
  };
}

test("derives a weighted rubric from the uploaded JD instead of fixed portfolio domains", () => {
  const rubric = buildJobRubric([
    "The candidate must build Java Spring services and own production reliability.",
    "Kubernetes experience is required.",
    "Retail payments knowledge is preferred."
  ].join("\n"));

  assert.ok(rubric.some((item) => /kubernetes|containers/i.test(item.name)));
  assert.ok(rubric.some((item) => item.priority === "Must have" && item.weight === 5));
  assert.ok(rubric.some((item) => item.priority === "Preferred"));
  assert.ok(rubric.every((item) => item.evidenceStandard.length > 8));
  assert.ok(rubric.every((item) => !/GenAI \/ RAG alignment/i.test(item.name)));
});

test("normalizes prose responsibilities into concise capability labels", () => {
  const rubric = buildJobRubric(
    "You will design, build, test, and maintain software that directly impacts users and business outcomes."
  );

  assert.ok(rubric.some((item) => item.name === "Software delivery and business impact"));
  assert.ok(rubric.every((item) => !/^you will/i.test(item.name)));
  assert.ok(rubric.every((item) => item.name.length <= 60));
});

test("builds a strict native structured-output request from the Zod contract", () => {
  const request = createResumeMatchRequestBody(
    "Rahul",
    "You will design, build, test, and maintain software that directly impacts users and business outcomes.",
    "Allowed evidence"
  );
  const responseFormat = request.response_format;
  const serializedSchema = JSON.stringify(responseFormat.json_schema.schema);

  assert.equal(responseFormat.type, "json_schema");
  assert.equal(responseFormat.json_schema.strict, true);
  assert.equal(responseFormat.json_schema.name, "resume_match_result");
  assert.match(serializedSchema, /overallScore/);
  assert.match(serializedSchema, /dimensions/);
  assert.doesNotMatch(serializedSchema, /"\$schema"|"default"|"minLength"|"maxLength"/);
});

test("structured-output prompt requires concise noun-phrase labels", () => {
  const instructions = agentInstructions(
    "Rahul",
    "You will design, build, test, and maintain software that directly impacts users and business outcomes."
  );

  assert.match(instructions, /never copy a full JD sentence into a name/i);
  assert.match(instructions, /clean noun phrases/i);
  assert.match(instructions, /Software delivery and business impact/);
});

test("generated provider schema still validates the complete result contract", () => {
  const schema = resumeMatchOutputJsonSchema();
  assert.equal(schema.type, "object");
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(
    (schema.required as string[]).sort(),
    Object.keys(jobFitResultSchema.shape).sort()
  );
});

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

test("handles a native structured-output refusal without parsing it as JSON", async () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalFetch = global.fetch;
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async () => new Response(JSON.stringify({
    choices: [{ finish_reason: "stop", message: { refusal: "Cannot evaluate this request." } }]
  }), { status: 200, headers: { "Content-Type": "application/json" } });

  try {
    const result = await runResumeMatchAgent({
      ownerName: "Rahul",
      jdText: "Python FastAPI retrieval evidence scoring role with production responsibilities",
      evidence,
      evidenceText: "Python FastAPI retrieval evidence scoring.",
      timeoutMs: 1_000
    });
    assert.deepEqual(result, { ok: false, reason: "refusal", detail: "Cannot evaluate this request." });
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
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

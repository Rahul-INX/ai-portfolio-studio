import assert from "node:assert/strict";
import test from "node:test";
import { renderJobFitRecruiterBrief } from "@/lib/job-fit-brief";
import { buildJobFitIntelligenceResult } from "@/lib/job-fit-intelligence";
import type { ContextEvidence } from "@/lib/site-context";

const source: ContextEvidence = {
  id: "project:retrieval", citationId: "S1", kind: "project", slug: "retrieval", title: "Retrieval platform", section: "Architecture", url: "/projects/retrieval#architecture",
  summary: "A cited retrieval platform.", body: "Built a production RAG system with Python and evaluation.", snippet: "Production RAG with evaluation.", tags: ["Python", "RAG"], reason: "test",
};

test("renders a portable cited brief without retaining the raw job description", () => {
  const result = buildJobFitIntelligenceResult("Company: Acme\nRole: AI Engineer\nLocation: Remote\nRequire Python and RAG.", [source]);
  const brief = renderJobFitRecruiterBrief(result);

  assert.match(brief, /Job Fit Recruiter Brief/);
  assert.match(brief, /Fit score:/);
  assert.match(brief, /\/projects\/retrieval#architecture/);
  assert.doesNotMatch(brief, /Company: Acme/);
});

test("includes final research citations in the saved recruiter brief", () => {
  const result = buildJobFitIntelligenceResult("Role: AI Engineer\nRequire Python and RAG.", [source]);
  result.research = {
    status: "complete",
    note: "Cited role research completed.",
    insights: [{
      heading: "Role signal",
      analysis: "The official role emphasizes retrieval systems, which aligns with the cited portfolio implementation.",
      implication: "Validate production ownership and operating depth during the interview.",
      citations: ["https://example.com/careers/ai-engineer"],
    }],
    citations: [{
      title: "Official role research",
      url: "https://example.com/careers/ai-engineer",
      excerpt: "Role requirements.",
      sourceTier: "official",
      categories: ["role"],
      retrievedAt: "2026-09-08T00:00:00.000Z",
    }],
  };

  assert.match(renderJobFitRecruiterBrief(result), /https:\/\/example\.com\/careers\/ai-engineer/);
  assert.match(renderJobFitRecruiterBrief(result), /Validate production ownership/);
});

import assert from "node:assert/strict";
import test from "node:test";
import { collectJobFitResearch, groundResearchInsights } from "@/lib/job-fit-research";

test("collects categorized citations across research lanes and blocks non-public scrape targets", async () => {
  const calls: string[] = [];
  const result = await collectJobFitResearch({ company: "Acme", role: "AI Engineer", location: "Bengaluru" }, {
    tavilyKey: "test-key",
    scrapeDoKey: "test-key",
    fetcher: async (url) => {
      calls.push(String(url));
      if (String(url).includes("tavily")) return new Response(JSON.stringify({ results: [
        { title: "Acme careers", url: "https://careers.acme.example/ai-engineer", content: "AI Engineer role and RAG systems." },
        { title: "Unsafe", url: "http://127.0.0.1/internal", content: "never fetch" },
      ] }), { status: 200 });
      return new Response("Official Acme career requirements for RAG and Python.", { status: 200 });
    },
  });

  assert.equal(result.status, "complete");
  assert.equal(result.citations.length, 1);
  assert.equal(result.citations[0].sourceTier, "official");
  assert.deepEqual(result.citations[0].categories, ["company", "role", "adjacent-openings", "market"]);
  assert.equal(calls.filter((url) => url.includes("tavily")).length, 4);
  assert.equal(calls.some((url) => url.includes("127.0.0.1")), false);
});

test("retains every relevant public result returned across bounded research lanes", async () => {
  const result = await collectJobFitResearch({ company: "Acme", role: "AI Engineer", location: "Remote" }, {
    tavilyKey: "test-key",
    fetcher: async () => new Response(JSON.stringify({ results: Array.from({ length: 16 }, (_, index) => ({
      title: `Acme source ${index + 1}`, url: `https://careers.acme.example/source-${index + 1}`, content: "Current public role evidence.",
    })) }), { status: 200 }),
  });

  assert.equal(result.status, "complete");
  assert.equal(result.citations.length, 16);
});

test("keeps only recruiter insights grounded in collected research URLs", () => {
  const insight = { heading: "Hiring signal", analysis: "A current role source emphasizes retrieval evaluation as a core expectation.", implication: "Rahul should lead with measured retrieval work and validate production ownership.", citations: ["https://acme.example/role", "https://invented.example"] };
  assert.deepEqual(groundResearchInsights([insight], [{ url: "https://acme.example/role" }]), [{ ...insight, citations: ["https://acme.example/role"] }]);
});

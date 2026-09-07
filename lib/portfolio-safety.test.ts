import assert from "node:assert/strict";
import test from "node:test";
import { redactPortfolioSource, reviewPortfolioSource } from "./portfolio-safety";

test("redacts direct identifiers and owner-marked organization terms before an AI review", () => {
  const result = redactPortfolioSource(
    "At Acme Labs, email jane@example.com about ticket INC-12345 or call +91 98765 43210. https://internal.example.com",
    ["Acme Labs"],
  );
  assert.doesNotMatch(result.text, /Acme Labs|jane@example\.com|INC-12345|98765|internal\.example/i);
  assert.match(result.text, /redacted organization detail|redacted email|redacted identifier/i);
});

test("keeps a generated draft editable but strips an owner-marked company name from the result", async () => {
  const review = await reviewPortfolioSource(
    { source: "I improved an Acme Labs support workflow using retrieval.", kind: "project", restrictedTerms: ["Acme Labs"] },
    async () => ({
      provider: "GEMINI" as const,
      model: "test-model",
      value: {
        title: "Acme Labs retrieval workflow",
        summary: "Built a retrieval workflow for Acme Labs support teams that surfaces prior resolutions.",
        tags: ["RAG", "Acme Labs"],
        reviewNotes: ["Confirm the summary contains no client-specific details."],
      },
      text: "",
    }),
  );
  assert.doesNotMatch(`${review.draft.title} ${review.draft.summary} ${review.draft.tags.join(" ")}`, /Acme Labs/i);
  assert.equal(review.requiresOwnerReview, true);
});

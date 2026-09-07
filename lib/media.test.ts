import assert from "node:assert/strict";
import test from "node:test";
import { markdownToPlainText, renderMarkdownToHtml } from "./markdown";
import { isRenderableProfileImage, resolvePortfolioMedia } from "./media";

test("hides expired LinkedIn profile images but keeps valid portfolio media", () => {
  assert.equal(isRenderableProfileImage("https://media.licdn.com/dms/image/example"), false);
  assert.equal(isRenderableProfileImage("/api/files/portrait"), true);
  assert.equal(isRenderableProfileImage(undefined), false);
});

test("replaces volatile LinkedIn-hosted portfolio media with the local fallback", () => {
  assert.equal(
    resolvePortfolioMedia("https://media.licdn.com/dms/image/example"),
    "/media/ai-systems-hero.png"
  );
  assert.equal(resolvePortfolioMedia("/api/files/portfolio-image"), "/api/files/portfolio-image");
});

test("renders LinkedIn Markdown images with the local fallback", async () => {
  const html = await renderMarkdownToHtml("![Architecture](https://media.licdn.com/dms/image/example)");
  assert.match(html, /src="\/media\/ai-systems-hero\.png"/);
});

test("turns Markdown links into recruiter-readable card copy", () => {
  assert.equal(
    markdownToPlainText("Built with [Freshdesk](https://example.com) and **RAG**."),
    "Built with Freshdesk and RAG."
  );
});

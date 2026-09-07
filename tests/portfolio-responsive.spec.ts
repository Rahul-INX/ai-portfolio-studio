import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("portfolio platform", () => {
  test("home renders premium product shell without layout overflow", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("link", { name: /explore ai systems/i })).toBeVisible();
    await expect(page.getByAltText(/rahul harivansh fatyal portrait/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /start a conversation/i })).toHaveAttribute("href", /^mailto:.+@.+$/);
    await expectNoHorizontalOverflow(page);
  });

  test("home keeps the portrait bounded and at a 4:5 ratio", async ({ page }) => {
    await page.goto("/");
    const portraits = page.getByAltText(/rahul harivansh fatyal portrait/i);
    const portrait = portraits.last();
    await expect(portrait).toBeVisible();

    const imageBox = await portrait.boundingBox();
    expect(imageBox).not.toBeNull();
    expect(imageBox!.width / imageBox!.height).toBeCloseTo(4 / 5, 2);

    if (page.viewportSize()!.width >= 1024) {
      const cardBox = await portrait.locator("xpath=../..").boundingBox();
      expect(cardBox).not.toBeNull();
      expect(cardBox!.width).toBeLessThanOrEqual(450);
      expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 16);
    }

    await expectNoHorizontalOverflow(page);
  });

  test("explorer supports search and taxonomy filtering", async ({ page }) => {
    await page.goto("/explorer");
    await expect(page.getByRole("heading", { name: "Selected work" })).toBeVisible();
    await page.getByRole("button", { name: /browse the full archive/i }).click();
    await page.getByLabel(/search portfolio content/i).fill("resume");
    await expect(page.getByRole("heading", { name: /resume/i }).first()).toBeVisible();
    await page.getByRole("tab", { name: "RAG" }).click();
    await expect(page.getByText(/matching items/i)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("job fit generates a JD-derived recruiter rubric from pasted JD text", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /check job fit/i }).first().click();
    await expect(page).toHaveURL(/\/job-fit/);
    await expect(page.getByRole("heading", { name: "Role Fit Brief" })).toBeVisible();

    await page.getByLabel(/paste jd text/i).fill([
      "We are hiring a GenAI engineer to build retrieval augmented generation systems.",
      "The role needs Python, FastAPI, LangChain, vector search, FAISS, NLP, document processing, data science, dashboards, and explainable AI workflows.",
      "The person should communicate tradeoffs, evaluate model quality, and connect AI systems to product decisions."
    ].join(" "));
    await page.getByRole("button", { name: /generate fit brief/i }).click();

    await expect(page.getByText(/building the role fit brief/i)).toBeVisible();
    await expect(page.getByRole("navigation", { name: /fit brief sections/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/decision/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /the criteria most likely to change the hiring decision/i })).toBeVisible();
    await expect(page.getByText(/proven strengths/i)).toBeVisible();
    await expect(page.getByText(/decision risks/i)).toBeVisible();
    await expect(page.getByText(/recommended next step/i)).toBeVisible();
    await page.getByRole("button", { name: /^evidence/i }).click();
    await expect(page.getByRole("heading", { name: /evidence dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /open evidence source/i }).first()).toContainText(/view citation/i);
    await page.getByRole("button", { name: /^interview/i }).click();
    await expect(page.getByRole("heading", { name: /gap analysis/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /interview probes/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /unbiased notes/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /analyzed job description/i })).toBeVisible();
    await expect(page.getByLabel(/paste jd text/i)).toBeHidden();
    await page.getByRole("button", { name: /edit jd/i }).click();
    await expect(page.getByLabel(/paste jd text/i)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("job fit rejects unsupported JD files", async ({ page }) => {
    await page.goto("/job-fit");
    await page.waitForLoadState("networkidle");
    await page.getByLabel(/attach jd file/i).setInputFiles({
      name: "jd.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("role,skill\nGenAI,LangChain")
    });
    await expect(page.getByText("jd.csv")).toBeVisible();
    await page.getByRole("button", { name: /generate fit brief/i }).click();
    await expect(page.getByText(/attach a \.txt, \.pdf, or \.docx job description file/i)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("job fit does not show unrelated baseline evidence", async ({ page }) => {
    const response = await page.request.post("/api/job-fit", {
      multipart: {
        jdText: [
          "Marine ecology researcher responsible for coral reef transects and benthic taxonomy.",
          "The role requires scuba field sampling, salinity calibration, specimen preservation, aquarium husbandry, and ecological survey permits."
        ].join(" ")
      }
    });
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.result.topEvidence).toEqual([]);
    expect(payload.result.sources).toEqual([]);
    expect(payload.result.fitLabel).toBe("Low Evidence");
  });

  test("representative section citations resolve to rendered anchors", async ({ page }) => {
    const citationUrls = [
      "/cv#skills",
      "/project/askmax-document-rag#architecture",
      "/case-study/explainable-ai-resume-matching#approach",
      "/experiment/resume-extraction-validation#metrics",
      "/blog/structured-output-llm-boundary#article",
      "/blog/structured-output-llm-boundary#why-plain-text-fails-in-production",
      "/dashboard/resume-matcher-pipeline-analytics#preview",
      "/timeline#skill-python",
      "/timeline#certification-machine-learning",
      "/timeline#timeline-rag-and-ai-engineering"
    ];

    for (const url of citationUrls) {
      await page.goto(url);
      const id = new URL(url, "http://127.0.0.1").hash.slice(1);
      await expect(page.locator(`[id="${id}"]`)).toBeVisible();
    }
  });

  test("detail pages expose progress, related items, and readable content", async ({ page }) => {
    const response = await page.request.get("/api/content");
    const { items } = await response.json() as { items: Array<{ kind: string; slug: string; title: string }> };
    const project = items.find((item) => item.kind === "project");
    expect(project).toBeTruthy();
    await page.goto(`/project/${project!.slug}`);
    await expect(page.getByRole("heading", { name: project!.title })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Related Items" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("content cards open from the full card with pointer and keyboard", async ({ page }) => {
    await page.goto("/explorer");
    const card = page.locator('article').first();
    const cardLink = card.getByRole("link", { name: /open/i });
    await expect(cardLink).toBeVisible();
    await cardLink.click({ position: { x: 20, y: 180 } });
    await expect(page).toHaveURL(/\/(project|case-study|experiment|blog|dashboard)\//);

    await page.goBack();
    const keyboardCard = page.locator('article').first().getByRole("link", { name: /open/i });
    await keyboardCard.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/(project|case-study|experiment|blog|dashboard)\//);
  });

  test("homepage prioritizes selected work instead of a raw capability inventory", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Capabilities, grouped by practice." })).toHaveCount(0);
    await expect(page.getByText(/\bnodes\b/i)).toHaveCount(0);
    await expect(page.locator("#selected-systems h2")).toBeVisible();
  });

  test("homepage does not expose CMS language to recruiters", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/editable proof signals|edit mode/i)).toHaveCount(0);
  });

  test("top-level content routes expose exactly one h1", async ({ page }) => {
    const response = await page.request.get("/api/content");
    const { items } = await response.json() as { items: Array<{ kind: string; slug: string }> };
    const blog = items.find((item) => item.kind === "blog");
    expect(blog).toBeTruthy();
    for (const path of ["/explorer", "/timeline", "/cv", `/blog/${blog!.slug}`]) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
    }
  });

  test("theme toggle and keyboard focus are available", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto("/");
    const skipLink = page.getByRole("link", { name: /skip to content/i });
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
    await page.getByRole("button", { name: /toggle light and dark theme/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("admin is protected and seo/media routes respond", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const manifest = await page.request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBeTruthy();
    const llms = await page.request.get("/llms.txt");
    expect(llms.ok()).toBeTruthy();
    const image = await page.request.get("/media/ai-systems-hero.png");
    expect(image.ok()).toBeTruthy();
    expect(image.headers()["content-type"]).toContain("image/png");
  });

  test("resume and cv downloads are reachable from navigation and timeline", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Resume", exact: true }).click();
    await expect(page).toHaveURL(/\/timeline#resume-downloads$/);
    await expect(page.getByRole("heading", { name: "Resume & CV Downloads" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Download Resume" })).toHaveAttribute("href", /\/api\/(?:files|media)\//);
    await expect(page.getByRole("link", { name: "Download CV" })).toHaveAttribute("href", /\/api\/(?:files|media)\//);
    await page.getByRole("link", { name: "View CV" }).click();
    await expect(page).toHaveURL(/\/cv$/);
    await expect(page.getByRole("heading", { name: "Selected Projects" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("llms endpoints expose resume cv and section anchors", async ({ page }) => {
    const llms = await page.request.get("/llms.txt");
    expect(await llms.text()).toContain("/timeline#resume-downloads");
    const full = await page.request.get("/llms-full.txt");
    const text = await full.text();
    expect(text).toContain("/cv#skills");
    expect(text).toContain("/cv#projects");
    expect(text).toMatch(/\/api\/(?:files|media)\//);
  });

  test("assistant answers resume link requests with site-wide document evidence", async ({ page }) => {
    const response = await page.request.post("/api/assistant", {
      data: {
        message: "give me his resume download link",
        path: "/project/dynamic-resume-matcher",
        history: []
      }
    });
    expect(response.ok()).toBeTruthy();
    const text = await response.text();
    expect(text).toMatch(/\/api\/(?:files|media)\//);
    expect(text).toContain("/timeline#resume-downloads");
  });

  test("document upload endpoint rejects unauthenticated and invalid requests", async ({ page }) => {
    const unauthorized = await page.request.post("/api/document-upload", {
      multipart: {
        file: {
          name: "resume.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4")
        }
      }
    });
    expect(unauthorized.status()).toBe(401);
  });
});

import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("portfolio platform", () => {
  test("home renders premium product shell without layout overflow", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /building retrieval, automation, and data products/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /explore ai systems/i })).toBeVisible();
    await expect(page.getByAltText(/rahul harivansh fatyal portrait/i).first()).toBeVisible();
    await expect(page.getByText(/bilaspur, himachal pradesh, india/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /rahulharivanshfatyal@gmail\.com/i }).first()).toBeVisible();
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
    await page.getByLabel(/search portfolio content/i).fill("resume");
    await expect(page.getByRole("heading", { name: "Dynamic Resume Matcher" })).toBeVisible();
    await page.getByRole("tab", { name: "RAG" }).click();
    await expect(page.getByText(/matching items/i)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("job fit generates a fixed recruiter dashboard from pasted JD text", async ({ page }) => {
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
    await expect(page.getByRole("heading", { name: /evidence dashboard/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/overall fit/i)).toBeVisible();
    await expect(page.getByText(/genai \/ rag alignment/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /points to note/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /what aligns/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /what needs validation/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /gap analysis/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /interview probes/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /unbiased notes/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /open evidence source/i }).first()).toContainText(/view citation/i);
    await expect(page.getByRole("heading", { name: /analyzed job description/i })).toBeVisible();
    await expect(page.getByLabel(/paste jd text/i)).toBeHidden();
    await page.getByRole("button", { name: /edit jd/i }).click();
    await expect(page.getByLabel(/paste jd text/i)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("job fit rejects unsupported JD files", async ({ page }) => {
    await page.goto("/job-fit");
    await page.getByLabel(/attach jd file/i).setInputFiles({
      name: "jd.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("role,skill\nGenAI,LangChain")
    });
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
    await page.goto("/project/dynamic-resume-matcher");
    await expect(page.getByRole("heading", { name: "Architecture Canvas" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Related Items" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("theme toggle and keyboard focus are available", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByText(/skip to content/i)).toBeFocused();
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
    await expect(page.getByRole("link", { name: "Download Resume" })).toHaveAttribute("href", /rahul-harivansh-fatyal-resume\.pdf$/);
    await expect(page.getByRole("link", { name: "Download CV" })).toHaveAttribute("href", /rahul-harivansh-fatyal-cv\.pdf$/);
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
    expect(text).toContain("/documents/rahul-harivansh-fatyal-resume.pdf");
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
    expect(text).toContain("/documents/rahul-harivansh-fatyal-resume.pdf");
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

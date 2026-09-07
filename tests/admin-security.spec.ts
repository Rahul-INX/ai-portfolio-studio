import { expect, test, type BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { randomUUID } from "node:crypto";

const authSecret = "playwright-local-verification-secret";

function projectPayload(slug: string, title = "Temporary CMS verification project") {
  return {
    kind: "project",
    title,
    slug,
    tags: ["verification"],
    subtitle: "Temporary record used to verify the owner CMS workflow.",
    summary: "This temporary record verifies create, edit, conflict, and delete behavior.",
    description: "Temporary verification content. It is removed before this test finishes.",
    status: "ACTIVE",
    techStack: ["Playwright"],
    businessImpact: "Confirms database writes are reversible and duplicate slugs are protected.",
    githubUrl: "",
    demoUrl: "",
    featured: false,
    imageUrl: "",
    startDate: "",
    endDate: "",
    metrics: [],
    architectureCanvas: { layers: [], principles: [], riskControls: [] },
  };
}

async function authenticate(context: BrowserContext, role: string) {
  const token = await encode({
    secret: authSecret,
    maxAge: 60 * 60,
    token: {
      sub: "playwright-user",
      email: "portfolio-test@example.invalid",
      name: "Portfolio test user",
      role,
    },
  });
  await context.addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

test("an authenticated non-admin cannot open or mutate the CMS", async ({ context, page }) => {
  await authenticate(context, "MEMBER");

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);

  const response = await page.request.delete("/api/content", {
    data: { kind: "project", id: "record-that-must-not-be-read" },
  });
  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({ error: "Forbidden" });

  const deniedWrites = await Promise.all([
    page.request.post("/api/content", { data: {} }),
    page.request.post("/api/media", { multipart: {} }),
    page.request.delete("/api/files/record-that-must-not-be-deleted"),
    page.request.post("/api/document-upload", { multipart: {} }),
    page.request.post("/api/admin/job-fit-settings", { data: {} }),
    page.request.post("/api/admin/portfolio-safety", { multipart: { kind: "project", sourceText: "This source should never reach a provider without an authenticated administrator session because it contains private working notes." } }),
    page.request.post("/api/admin/ai-providers", {
      data: { action: "add-key", provider: "GEMINI", label: "Denied", key: "fake-denied-key" },
    }),
  ]);
  for (const denied of deniedWrites) {
    expect(denied.status()).toBe(403);
    expect(await denied.json()).toEqual({ error: "Forbidden" });
  }
});

test("an admin can create and manually apply a publish-safety draft without saving it", async ({ context, page }) => {
  await authenticate(context, "ADMIN");
  await page.route("**/api/admin/portfolio-safety", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        draft: {
          title: "Retrieval workflow for support operations",
          summary: "Built a retrieval-assisted workflow that turns incoming support context into structured, reviewable guidance. The design focused on grounded responses, clear handoff points, and reliable operator review.",
          tags: ["RAG", "Python", "Workflow design"],
          reviewNotes: ["Confirm the summary does not imply unverified production scale."],
        },
        provider: "GEMINI",
        model: "test-model",
        findings: [{ type: "redacted", label: "owner-marked term: Acme Labs" }],
        requiresOwnerReview: true,
      }),
    });
  });

  await page.goto("/admin/new-project?kind=project&record=new");
  await page.getByLabel("Editable area").selectOption("project");
  await expect(page.getByRole("heading", { name: "Turn private working notes into a public portfolio draft" })).toBeVisible();
  await page.getByLabel("Paste working notes").fill("At Acme Labs, I built a retrieval workflow for internal support requests. It used company knowledge and ticket history to prepare grounded suggestions for operators, with a human review step before anything was sent.");
  await page.getByLabel("Organization/client/product terms to remove").fill("Acme Labs");
  await page.getByRole("checkbox", { name: /I have removed material/ }).check();
  await page.getByRole("button", { name: "Create safe draft" }).click();
  await expect(page.getByText("Draft ready. Review it before applying or saving.")).toBeVisible();
  await page.getByRole("button", { name: "Use this draft in the editor" }).click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Retrieval workflow for support operations");
  await expect(page.getByLabel("Tags, comma separated")).toHaveValue("RAG, Python, Workflow design");
  await expect(page.getByText("Safety-reviewed draft applied.")).toBeVisible();
});

test("an admin can upload, preview, and remove an unused image", async ({ context, page }) => {
  await authenticate(context, "ADMIN");
  const uploaded = await page.request.post("/api/media", {
    multipart: {
      file: {
        name: "temporary-verification.png",
        mimeType: "image/png",
        buffer: Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360f8cfd00f0004010200fe0e5ac00000000049454e44ae426082", "hex"),
      },
    },
  });
  expect(uploaded.status()).toBe(201);
  const { url } = await uploaded.json() as { url: string };
  const preview = await page.request.get(url);
  expect(preview.status()).toBe(200);
  expect(preview.headers()["content-type"]).toBe("image/png");

  const deleted = await page.request.delete(url);
  expect(deleted.status()).toBe(200);
  expect((await page.request.get(url)).status()).toBe(404);
});

test("provider key administration never returns plaintext", async ({ context, page }) => {
  await authenticate(context, "ADMIN");
  const label = `Temporary key ${randomUUID()}`;
  const plaintext = `fake-provider-secret-${randomUUID()}`;
  let id: string | undefined;

  try {
    const added = await page.request.post("/api/admin/ai-providers", {
      data: { action: "add-key", provider: "GEMINI", label, key: plaintext },
    });
    expect(added.status()).toBe(201);
    const addedText = await added.text();
    expect(addedText).not.toContain(plaintext);
    const addedPayload = JSON.parse(addedText);
    const key = addedPayload.providers
      .flatMap((provider: { keys: Array<{ id: string; label: string }> }) => provider.keys)
      .find((item: { label: string }) => item.label === label);
    expect(key).toBeTruthy();
    id = key.id;

    const updated = await page.request.post("/api/admin/ai-providers", {
      data: { action: "update-key", id, enabled: false, priority: 7, label },
    });
    expect(updated.ok()).toBe(true);

    const state = await page.request.get("/api/admin/ai-providers");
    const stateText = await state.text();
    expect(stateText).not.toContain(plaintext);
    expect(stateText).not.toContain("encryptedValue");
    expect(stateText).not.toContain("authTag");
    const statePayload = JSON.parse(stateText);
    const stored = statePayload.providers
      .flatMap((provider: { keys: Array<{ id: string; label: string; enabled: boolean; priority: number }> }) => provider.keys)
      .find((item: { id: string }) => item.id === id);
    expect(stored).toMatchObject({ label, enabled: false, priority: 7 });
  } finally {
    if (id) {
      const revoked = await page.request.delete("/api/admin/ai-providers", { data: { id } });
      expect(revoked.ok()).toBe(true);
    }
  }
});

test("owner can manage provider keys and discover Gemini models in the admin UI", async ({ context, page }) => {
  await authenticate(context, "ADMIN");
  const label = `UI key ${randomUUID()}`;
  const plaintext = `fake-ui-provider-secret-${randomUUID()}`;

  await page.route("**/api/admin/ai-providers", async (route) => {
    const request = route.request();
    if (request.method() === "POST" && ["discover-models", "test-key"].includes(request.postDataJSON()?.action)) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ models: [{ id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" }], providers: [] }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Choose how your AI features should run" })).toBeVisible();
  const gemini = page.locator("article").filter({ hasText: "Gemini" }).first();
  await gemini.getByText("Model and usage controls").click();
  await gemini.getByRole("button", { name: "Refresh available models" }).click();
  await expect(page.getByLabel("Model for Gemini").locator('option[value="gemini-3.5-flash-lite"]')).toHaveCount(1);

  await gemini.getByRole("button", { name: "Add key" }).click();
  await page.getByLabel("Name this key").fill(label);
  await page.getByLabel("Paste API key").fill(plaintext);
  await page.getByRole("button", { name: "Save key" }).click();
  const keyRow = page.getByRole("group", { name: label });
  await expect(keyRow).toContainText(`••••${plaintext.slice(-4)}`);
  await keyRow.locator("details").evaluate((element) => { (element as HTMLDetailsElement).open = true; });
  await keyRow.getByRole("checkbox", { name: "Use this key" }).uncheck();
  await keyRow.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Key settings saved.")).toBeVisible();
  await keyRow.getByRole("button", { name: "Test key" }).click();
  await expect(page.getByText(`${label} works.`)).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await keyRow.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByRole("group", { name: label })).toHaveCount(0);
});

test("an admin session can open the CMS", async ({ context, page }) => {
  await authenticate(context, "ADMIN");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What do you need to do?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Edit homepage" })).toBeVisible();
  await expect(page.getByText("Open a specific content area")).toBeVisible();
});

test("Drive storage presents an actionable setup or connected state", async ({ context, page }, testInfo) => {
  await authenticate(context, "ADMIN");
  await page.goto("/admin");
  const panel = page.getByRole("region", { name: "Your portfolio media library" });
  await expect(panel.getByText(/Open Google setup|Connect Google Drive|Verify connection/, { exact: true })).toBeVisible();
  await expect(panel).not.toContainText("Internal Server Error");
  await page.screenshot({ path: testInfo.outputPath("google-drive-setup.png"), fullPage: true });
});

test("CMS failures do not expose database exception details", async ({ context, page }) => {
  await authenticate(context, "ADMIN");

  const response = await page.request.delete("/api/content", {
    data: { kind: "project", id: "record-that-does-not-exist" },
  });
  expect(response.status()).toBe(500);
  const payload = await response.json();
  expect(payload.message).toBe("The server could not delete the content.");
  expect(payload.requestId).toMatch(/^[0-9a-f-]{36}$/);
});

test("CMS create cannot overwrite an existing slug and supports edit and delete", async ({ context, page }) => {
  await authenticate(context, "ADMIN");
  const slug = `cms-verification-${randomUUID()}`;
  const createPayload = projectPayload(slug);
  let id: string | undefined;

  try {
    const created = await page.request.post("/api/content", { data: createPayload });
    expect(created.status()).toBe(201);
    id = (await created.json()).item.id;

    const duplicate = await page.request.post("/api/content", {
      data: { ...createPayload, title: "This must not replace the first record" },
    });
    expect(duplicate.status()).toBe(409);

    const edited = await page.request.post("/api/content", {
      data: { ...createPayload, id, title: "Temporary CMS verification project edited" },
    });
    expect(edited.status()).toBe(201);

    const items = (await (await page.request.get("/api/content")).json()).items as Array<{
      slug: string;
      title: string;
    }>;
    expect(items.find((item) => item.slug === slug)?.title).toBe(
      "Temporary CMS verification project edited",
    );
  } finally {
    if (id) {
      const deleted = await page.request.delete("/api/content", {
        data: { kind: "project", id },
      });
      expect(deleted.status()).toBe(201);
    }
  }

  const remaining = (await (await page.request.get("/api/content")).json()).items as Array<{
    slug: string;
  }>;
  expect(remaining.some((item) => item.slug === slug)).toBe(false);
});

test("draft content stays private and remains editable in the CMS", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The stateful CMS workflow is viewport-independent.");
  await authenticate(context, "ADMIN");
  const slug = `cms-draft-${randomUUID()}`;
  const title = "Temporary private CMS draft";
  let id: string | undefined;

  try {
    const created = await page.request.post("/api/content", {
      data: { ...projectPayload(slug, title), visibility: "DRAFT" },
    });
    expect(created.status()).toBe(201);
    id = (await created.json()).item.id;

    const publicItems = (await (await page.request.get("/api/content")).json()).items as Array<{
      slug: string;
    }>;
    expect(publicItems.some((item) => item.slug === slug)).toBe(false);

    await page.goto(`/admin/new-project?kind=project&record=${id}`);
    await expect(page.getByLabel("Record").locator(`option[value="${id}"]`)).toHaveCount(1);
    await expect(page.getByLabel("Visibility")).toHaveValue("DRAFT");
    await page.getByLabel("Title", { exact: true }).fill("Unsaved title that must be discarded");
    await page.getByRole("button", { name: "Discard changes" }).click();
    await expect(page.getByLabel("Title", { exact: true })).toHaveValue(title);

    await page.getByLabel("Visibility").selectOption("PUBLISHED");
    await page.getByRole("button", { name: "Save editable content" }).click();
    await expect(page.getByText("Saved and published.", { exact: false })).toBeVisible();
    const publishedItems = (await (await page.request.get("/api/content")).json()).items as Array<{
      slug: string;
    }>;
    expect(publishedItems.some((item) => item.slug === slug)).toBe(true);
  } finally {
    if (id) {
      await page.request.delete("/api/content", { data: { kind: "project", id } });
    }
  }
});

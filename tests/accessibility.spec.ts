import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  "/",
  "/cv",
  "/explorer",
  "/job-fit",
  "/timeline",
  "/project/dynamic-resume-matcher",
  "/case-study/rag-systems-from-demo-to-operations",
  "/experiment/docx-rag-image-preservation",
  "/blog/what-i-measure-before-shipping-rag",
  "/dashboard/retrieval-drift-monitor",
  "/admin/login"
];

test.describe("accessibility", () => {
  for (const path of pages) {
    test(`${path} has no detectable WCAG serious violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(350);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const serious = results.violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact ?? "")
      );
      expect(serious).toEqual([]);
    });
  }
});

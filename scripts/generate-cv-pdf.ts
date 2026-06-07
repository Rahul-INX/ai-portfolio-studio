import { mkdir } from "fs/promises";
import path from "path";
import { chromium } from "playwright";

async function main() {
  const baseUrl = process.env.CV_BASE_URL ?? "http://127.0.0.1:3000";
  const outputPath = path.join(process.cwd(), "public", "documents", "rahul-harivansh-fatyal-cv.pdf");
  await mkdir(path.dirname(outputPath), { recursive: true });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1800 } });
    await page.goto(`${baseUrl}/cv`, { waitUntil: "networkidle" });
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "14mm",
        right: "12mm",
        bottom: "14mm",
        left: "12mm"
      }
    });
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { chromium } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import { spawn } from "node:child_process";
import lighthouse from "lighthouse";

const port = 3200;
const baseUrl = `http://127.0.0.1:${port}`;
const routes = ["/", "/explorer", "/timeline", "/blog/what-i-measure-before-shipping-rag"];
const thresholds = {
  performance: 0.95,
  accessibility: 0.95,
  "best-practices": 0.95,
  seo: 0.95
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // keep waiting
    }
    await wait(1000);
  }
  throw new Error(`Server did not start at ${baseUrl}`);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const startCommand = `${npmCommand} run start -- --hostname 127.0.0.1 --port ${port}`;
const server = spawn(process.platform === "win32" ? "cmd.exe" : "sh", process.platform === "win32" ? ["/d", "/s", "/c", startCommand] : ["-c", startCommand], {
  env: {
    ...process.env,
    NEXTAUTH_URL: baseUrl,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "lighthouse-local-verification-secret"
  },
  stdio: "pipe",
  shell: false
});

server.stdout.on("data", (chunk) => process.stdout.write(`[next] ${chunk}`));
server.stderr.on("data", (chunk) => process.stderr.write(`[next] ${chunk}`));

try {
  await waitForServer();
  const chromePath = chromium.executablePath();
  const chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"]
  });
  const failures = [];

  try {
    for (const route of routes) {
      const result = await lighthouse(`${baseUrl}${route}`, {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: Object.keys(thresholds),
        formFactor: "desktop",
        screenEmulation: {
          mobile: false,
          width: 1440,
          height: 1000,
          deviceScaleFactor: 1,
          disabled: false
        },
        throttlingMethod: "provided"
      });

      if (!result?.lhr) {
        throw new Error(`Lighthouse did not return a report for ${route}`);
      }

      const scores = Object.fromEntries(
        Object.keys(thresholds).map((category) => [category, result.lhr.categories[category]?.score ?? 0])
      );
      console.log(`${route} ${JSON.stringify(scores)}`);

      for (const [category, threshold] of Object.entries(thresholds)) {
        if ((scores[category] ?? 0) < threshold) {
          failures.push(`${route} ${category}=${scores[category]} below ${threshold}`);
        }
      }
    }

    if (failures.length) {
      throw new Error(`Lighthouse threshold failures:\n${failures.join("\n")}`);
    }
  } finally {
    await chrome.kill();
  }
} finally {
  if (process.platform === "win32" && server.pid) {
    spawn("taskkill.exe", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    server.kill();
  }
}

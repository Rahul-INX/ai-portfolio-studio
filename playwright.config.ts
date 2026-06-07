import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 8_000
  },
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm.cmd run start -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      NEXTAUTH_URL: "http://127.0.0.1:3100",
      NEXTAUTH_SECRET: "playwright-local-verification-secret",
      OPENAI_API_KEY: ""
    }
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] }
    },
    {
      name: "desktop",
      use: { viewport: { width: 1440, height: 1000 } }
    },
    {
      name: "ultrawide",
      use: { viewport: { width: 1920, height: 1080 } }
    }
  ]
});

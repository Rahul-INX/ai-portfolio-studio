import { spawnSync } from "node:child_process";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Environment variables may already be provided by the shell or CI.
}

const url = process.env.LOCAL_DATABASE_URL;
let parsed;
try {
  parsed = new URL(url);
} catch {
  console.error("LOCAL_DATABASE_URL must be a valid local PostgreSQL URL.");
  process.exit(1);
}

if (!new Set(["localhost", "127.0.0.1", "::1"]).has(parsed.hostname)) {
  console.error("Refusing to push: LOCAL_DATABASE_URL must point to a loopback host.");
  process.exit(1);
}

const prisma = process.platform === "win32" ? "node_modules/.bin/prisma.cmd" : "node_modules/.bin/prisma";
const result = spawnSync(prisma, ["db", "push"], { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
process.exit(result.status ?? 1);

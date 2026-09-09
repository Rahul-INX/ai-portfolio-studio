import { spawn } from "node:child_process";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Environment variables may already be provided by the shell or test runner.
}

let url;
try {
  url = new URL(process.env.LOCAL_DATABASE_URL);
} catch {
  console.error("LOCAL_DATABASE_URL must be a valid local PostgreSQL URL.");
  process.exit(1);
}

if (!new Set(["localhost", "127.0.0.1", "::1"]).has(url.hostname)) {
  console.error("Refusing to start: LOCAL_DATABASE_URL must point to a loopback host.");
  process.exit(1);
}

const next = process.platform === "win32" ? "node_modules/.bin/next.cmd" : "node_modules/.bin/next";
const args = process.argv.slice(2);
const portIndex = args.findIndex((value) => value === "--port" || value === "-p");
const port = portIndex >= 0 ? args[portIndex + 1] : "3001";
if (!/^\d+$/.test(port ?? "")) {
  console.error("The local development port must be a number.");
  process.exit(1);
}
const child = spawn(next, ["dev", ...(portIndex >= 0 ? args : ["--port", port, ...args])], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url.toString(), NEXTAUTH_URL: `http://localhost:${port}` },
});
child.on("exit", (code) => process.exit(code ?? 1));

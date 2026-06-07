import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Build a connection URL with pool-safety parameters for Neon serverless Postgres.
 * - connection_limit: keep well below Neon's per-endpoint cap (default 9 on free tier)
 * - pool_timeout: seconds to wait for a free connection before throwing
 * - connect_timeout: seconds to wait for the TCP handshake / TLS setup
 */
function buildDatasourceUrl(): string | undefined {
  const base = process.env.DATABASE_URL;
  if (!base) return undefined;

  const url = new URL(base);
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "4");
  }
  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", "30");
  }
  if (!url.searchParams.has("connect_timeout")) {
    url.searchParams.set("connect_timeout", "15");
  }
  const sslMode = url.searchParams.get("sslmode");
  if (!sslMode || ["prefer", "require", "verify-ca"].includes(sslMode)) {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

function createPrismaClient(): PrismaClient {
  const datasourceUrl = buildDatasourceUrl();
  const adapter = datasourceUrl ? new PrismaPg(datasourceUrl) : undefined;

  return new PrismaClient({
    log: ["warn"],
    ...(adapter && { adapter }),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const globalForDatabase = globalThis as unknown as {
  databaseUnavailableUntil?: number;
  databaseUnavailableLogged?: boolean;
};

const DATABASE_RETRY_COOLDOWN_MS = 15_000;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function canReadDatabase() {
  if (!hasDatabaseUrl()) return false;
  if (!globalForDatabase.databaseUnavailableUntil) return true;
  if (Date.now() < globalForDatabase.databaseUnavailableUntil) return false;

  globalForDatabase.databaseUnavailableUntil = undefined;
  globalForDatabase.databaseUnavailableLogged = false;
  return true;
}

export function markDatabaseUnavailable(error: unknown) {
  globalForDatabase.databaseUnavailableUntil = Date.now() + DATABASE_RETRY_COOLDOWN_MS;

  if (globalForDatabase.databaseUnavailableLogged) return;

  globalForDatabase.databaseUnavailableLogged = true;
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[database] Database is unavailable. Using safe fallback content. ${message}`);
}

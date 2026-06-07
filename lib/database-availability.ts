const globalForDatabase = globalThis as unknown as {
  databaseUnavailable?: boolean;
  databaseUnavailableLogged?: boolean;
};

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function canReadDatabase() {
  return hasDatabaseUrl() && !globalForDatabase.databaseUnavailable;
}

export function markDatabaseUnavailable(error: unknown) {
  globalForDatabase.databaseUnavailable = true;

  if (globalForDatabase.databaseUnavailableLogged) return;

  globalForDatabase.databaseUnavailableLogged = true;
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[database] Database is unavailable. Using safe fallback content. ${message}`);
}

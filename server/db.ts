import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { log } from "./vite";

const {
  DATABASE_URL,
  PGHOST,
  PGPORT,
  PGDATABASE,
  PGUSER,
  PGPASSWORD,
} = process.env;

const buildLocalConfig = () => ({
  host: PGHOST ?? "localhost",
  port: Number(PGPORT ?? "5432"),
  database: PGDATABASE ?? "homestagepro",
  user: PGUSER ?? "postgres",
  password: PGPASSWORD ?? "postgres",
  max: 1,
});

const sslConfig = { ssl: { rejectUnauthorized: false } };

let dbMode: "database_url" | "pg_env";
let logHost = "n/a";
let logDatabase = "n/a";

const client = (() => {
  if (DATABASE_URL) {
    dbMode = "database_url";
    try {
      const parsed = new URL(DATABASE_URL);
      logHost = parsed.hostname || "n/a";
      logDatabase = parsed.pathname.replace(/^\//, "") || "n/a";
    } catch {
      logHost = "unparsed";
      logDatabase = "unparsed";
    }

    return postgres(DATABASE_URL, {
      max: 1,
      ...sslConfig,
    });
  }

  dbMode = "pg_env";
  const config = buildLocalConfig();
  logHost = config.host;
  logDatabase = config.database;

  if (PGHOST && PGPORT && PGDATABASE && PGUSER && PGPASSWORD) {
    return postgres(
      {
        host: PGHOST,
        port: Number(PGPORT),
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        max: 1,
        ...sslConfig,
      },
    );
  }

  return postgres(config);
})();

export const db = drizzle(client);

const modeLabel = dbMode === "database_url" ? "DATABASE_URL" : "PG*";
log(`DB init mode=${modeLabel} host=${logHost} db=${logDatabase}`);

const logNamespace = "db";

export const pingDatabase = async (logResult = false): Promise<boolean> => {
  try {
    await client`SELECT 1`;
    if (logResult) {
      log("DB connectivity check succeeded", logNamespace);
    }
    return true;
  } catch (error) {
    const message = (error as Error).message || "Unknown error";
    log(`DB connectivity check failed: ${message}`, logNamespace);
    return false;
  }
};

void (async () => {
  await pingDatabase(true);
})();
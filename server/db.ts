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

const hasPgEnvConfig = Boolean(
  PGHOST && PGPORT && PGDATABASE && PGUSER && PGPASSWORD
);

type DbMode = "pg_env" | "database_url" | "local";

let dbMode: DbMode = "local";

const buildLocalConfig = () => ({
  host: PGHOST ?? "localhost",
  port: Number(PGPORT ?? "5432"),
  database: PGDATABASE ?? "homestagepro",
  user: PGUSER ?? "postgres",
  password: PGPASSWORD ?? "postgres",
  max: 1,
});

const sslConfig = { ssl: { rejectUnauthorized: false } };

const client =
  hasPgEnvConfig
    ? (() => {
        dbMode = "pg_env";
        return postgres({
          host: PGHOST!,
          port: Number(PGPORT),
          database: PGDATABASE!,
          user: PGUSER!,
          password: PGPASSWORD!,
          max: 1,
          ...sslConfig,
        });
      })()
    : DATABASE_URL
    ? (() => {
        dbMode = "database_url";
        return postgres(DATABASE_URL, {
          max: 1,
          ...sslConfig,
        });
      })()
    : (() => {
        dbMode = "local";
        return postgres(buildLocalConfig());
      })();

export const db = drizzle(client);

const logMessage =
  dbMode === "pg_env"
    ? "DB: using PG* env vars"
    : dbMode === "database_url"
    ? "DB: using DATABASE_URL"
    : "DB: using local config";

log(logMessage);

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
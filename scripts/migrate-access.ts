import { readFile } from "node:fs/promises";
import { client } from "../server/db";
try {
  await client.unsafe(
    await readFile(
      new URL("../migrations/0002_access_and_jobs.sql", import.meta.url),
      "utf8",
    ),
  );
  console.log(
    "Access and staging-job migration applied. Existing balances retained.",
  );
} finally {
  await client.end();
}

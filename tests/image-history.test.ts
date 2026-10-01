import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import express from "express";
import cookieParser from "cookie-parser";
import sharp from "sharp";
import { makeImageThumbnail } from "../server/utils/imageThumbnail";
const url = process.env.TEST_DATABASE_URL;
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
  throw Error("Use an isolated localhost database");
process.env.DATABASE_URL = url;
process.env.JWT_SECRET = "local-history-test";
process.env.OPENAI_API_KEY = "test";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test";
process.env.PUBLIC_APP_URL = "https://history-test.invalid";
process.env.NODE_ENV = "test";
const schema = "test_" + randomUUID().replaceAll("-", "");
const setup = postgres(url);
await setup.unsafe(`CREATE SCHEMA ${schema}`);
await setup.end();
process.env.PGOPTIONS = `-c search_path=${schema}`;
const { client } = await import("../server/db");
await client.unsafe(`SET search_path TO ${schema}`);
await client.unsafe(
  `CREATE TABLE usage_entitlements(token_id text UNIQUE,paid_granted integer,paid_used integer,updated_at timestamptz DEFAULT now())`,
);
for (const file of [
  "0002_access_and_jobs.sql",
  "0003_reliability.sql",
  "0004_image_history.sql",
])
  await client.unsafe(await readFile(`migrations/${file}`, "utf8"));
const { registerStagingJobs } = await import("../server/stagingJobs");
const { storagePrefix, jobBucket } = await import("../server/jobFiles");
const { generateToken } = await import("../server/tokenManager");
const { ownedResultPath } = await import("../server/imageHistory");
const owner = "history-owner",
  other = "different-pack";
const cookies = {
  [owner]: `access_token=${generateToken("quick-pack", owner).token}`,
  [other]: `access_token=${generateToken("quick-pack", other).token}`,
};
const removals: string[][] = [];
let signingCalls = 0,
  failRemoval = false;
const app = express();
app.use(express.json());
app.use(cookieParser());
registerStagingJobs(
  app,
  async () => {
    throw Error("No AI call expected");
  },
  async (_b, p) => `https://example.invalid/${p}`,
  undefined,
  {
    sign: async (paths) => {
      signingCalls++;
      return new Map(
        paths.map((p) => [p, "https://example.invalid/thumbnail.webp"]),
      );
    },
    remove: async (paths) => {
      removals.push(paths);
      if (failRemoval) throw Error("Temporary storage failure");
    },
  },
);
const server = app.listen(0, "127.0.0.1");
await new Promise<void>((r) => server.once("listening", r));
const base = `http://127.0.0.1:${(server.address() as any).port}`;
const request = (path: string, method = "GET", who = owner, body?: any) =>
  fetch(base + path, {
    method,
    headers: {
      Cookie: cookies[who as keyof typeof cookies],
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const seed = async (state = "completed", who = owner, resultOverride?: any) => {
  const id = randomUUID(),
    folder = `${storagePrefix()}/results/2026-09/${id}`;
  const result = resultOverride || {
    roomType: "Bedroom",
    mode: "furnish",
    storageBucket: jobBucket,
    originalStoragePath: folder + "/original.jpg",
    stagedStoragePath: folder + "/staged.png",
    thumbnailStoragePath: folder + "/thumbnail.webp",
  };
  await client`INSERT INTO staging_jobs(id,token_id,input_hash,state,result) VALUES(${id},${who},${"a".repeat(64)},${state},${JSON.stringify(result)}::jsonb)`;
  return { id, result };
};
test("saved image ownership, recoverable Trash and retryable permanent deletion", async (t) => {
  try {
    await client`INSERT INTO usage_entitlements(token_id,paid_granted,paid_used) VALUES(${owner},5,2)`;
    const a = await seed(),
      b = await seed("completed", other);
    await t.test(
      "history uses one preview batch and excludes another pack",
      async () => {
        const rows = await (await request("/api/staging-jobs")).json();
        assert.equal(rows.length, 1);
        assert.equal(rows[0].id, a.id);
        assert.equal(rows[0].room_type, "Bedroom");
        assert.equal(
          rows[0].thumbnailUrl,
          "https://example.invalid/thumbnail.webp",
        );
        assert.equal(signingCalls, 1);
        assert.equal("thumbnail_path" in rows[0], false);
        assert.equal(
          (await request(`/api/staging-jobs/${a.id}`, "GET", other)).status,
          404,
        );
        assert.equal(
          (await request(`/api/staging-jobs/${a.id}/trash`, "POST", other, {}))
            .status,
          409,
        );
        assert.equal(
          (
            await request(`/api/staging-jobs/${a.id}`, "DELETE", other, {
              confirm: true,
            })
          ).status,
          404,
        );
      },
    );
    await t.test(
      "Trash hides saved reads and restores without credit changes",
      async () => {
        assert.equal(
          (await request(`/api/staging-jobs/${a.id}/trash`, "POST", owner, {}))
            .status,
          200,
        );
        assert.equal((await request(`/api/staging-jobs/${a.id}`)).status, 404);
        assert.equal(
          (await (await request("/api/staging-jobs")).json()).length,
          0,
        );
        const trash = await (
          await request("/api/staging-jobs?view=trash")
        ).json();
        assert.equal(trash[0].id, a.id);
        assert.equal(trash[0].thumbnailUrl, null);
        assert.equal(
          (
            await request(
              `/api/staging-jobs/${a.id}/restore`,
              "POST",
              owner,
              {},
            )
          ).status,
          200,
        );
        assert.equal((await request(`/api/staging-jobs/${a.id}`)).status, 200);
        assert.equal(removals.length, 0);
      },
    );
    await t.test(
      "processing, unconfirmed and untrashed deletion cannot remove files",
      async () => {
        const processing = await seed("processing");
        assert.equal(
          (
            await request(
              `/api/staging-jobs/${processing.id}/trash`,
              "POST",
              owner,
              {},
            )
          ).status,
          409,
        );
        assert.equal(
          (await request(`/api/staging-jobs/${a.id}`, "DELETE", owner, {}))
            .status,
          400,
        );
        assert.equal(
          (
            await request(`/api/staging-jobs/${a.id}`, "DELETE", owner, {
              confirm: true,
            })
          ).status,
          409,
        );
        assert.equal(removals.length, 0);
      },
    );
    await t.test(
      "partial deletion blocks restore and retries only the owned files",
      async () => {
        await request(`/api/staging-jobs/${a.id}/trash`, "POST", owner, {});
        failRemoval = true;
        assert.equal(
          (
            await request(`/api/staging-jobs/${a.id}`, "DELETE", owner, {
              confirm: true,
            })
          ).status,
          503,
        );
        assert.equal(
          (
            await request(
              `/api/staging-jobs/${a.id}/restore`,
              "POST",
              owner,
              {},
            )
          ).status,
          409,
        );
        failRemoval = false;
        assert.equal(
          (
            await request(`/api/staging-jobs/${a.id}`, "DELETE", owner, {
              confirm: true,
            })
          ).status,
          200,
        );
        assert.deepEqual(removals[0], [
          a.result.originalStoragePath,
          a.result.stagedStoragePath,
          a.result.thumbnailStoragePath,
        ]);
        assert.deepEqual(removals[1], removals[0]);
        assert.equal(
          (
            await request(`/api/staging-jobs/${a.id}`, "DELETE", owner, {
              confirm: true,
            })
          ).status,
          200,
        );
        assert.equal(removals.length, 2);
        const [row] = await client`SELECT * FROM staging_jobs WHERE id=${a.id}`;
        assert.ok(row.purged_at);
        assert.equal(row.input_hash, "a".repeat(64));
        assert.equal(row.result.stagedStoragePath, undefined);
        const [balance] =
          await client`SELECT paid_granted,paid_used FROM usage_entitlements WHERE token_id=${owner}`;
        assert.deepEqual({ ...balance }, { paid_granted: 5, paid_used: 2 });
      },
    );
    await t.test(
      "foreign-environment paths and incomplete attempts remain recoverable",
      async () => {
        const unsafe = await seed("completed", owner, b.result);
        await request(
          `/api/staging-jobs/${unsafe.id}/trash`,
          "POST",
          owner,
          {},
        );
        assert.equal(
          (
            await request(`/api/staging-jobs/${unsafe.id}`, "DELETE", owner, {
              confirm: true,
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              `/api/staging-jobs/${unsafe.id}/restore`,
              "POST",
              owner,
              {},
            )
          ).status,
          200,
        );
        const failed = await seed("failed");
        await request(
          `/api/staging-jobs/${failed.id}/trash`,
          "POST",
          owner,
          {},
        );
        assert.equal(
          (
            await request(`/api/staging-jobs/${failed.id}`, "DELETE", owner, {
              confirm: true,
            })
          ).status,
          409,
        );
        assert.equal(
          ownedResultPath(
            a.result.stagedStoragePath.replace(
              storagePrefix(),
              "roomstager-v2/other",
            ),
            a.id,
          ),
          false,
        );
        assert.equal(removals.length, 2);
      },
    );
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    await client.unsafe(`DROP SCHEMA ${schema} CASCADE`);
    await client.end();
  }
});
test("private thumbnails are small WebP images without embedded metadata", async () => {
  const full = await sharp({
    create: { width: 1536, height: 1024, channels: 3, background: "#667788" },
  })
    .jpeg()
    .toBuffer();
  const thumbnail = await makeImageThumbnail(full);
  const meta = await sharp(thumbnail).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 384);
  assert.equal(meta.height, 256);
  assert.equal(meta.exif, undefined);
  assert.ok(thumbnail.length < full.length);
});

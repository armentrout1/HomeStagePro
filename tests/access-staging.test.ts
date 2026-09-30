import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createHmac, randomUUID } from "node:crypto";
import postgres from "postgres";
import express from "express";
import cookieParser from "cookie-parser";
import sharp from "sharp";
import { generateAutoMaskPng } from "../server/utils/autoMask";
import { preserveProtectedPixels } from "../server/utils/preservePixels";
// Dedicated disposable local cluster only. Never run tests against deployment credentials.
const url = process.env.TEST_DATABASE_URL;
if (!url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname))
  throw new Error("TEST_DATABASE_URL must point to an isolated local database");
process.env.DATABASE_URL = url;
process.env.JWT_SECRET = "roomstager-local-integration-test-only";
process.env.OPENAI_API_KEY = "test-not-a-key";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test";
process.env.NODE_ENV = "test";
delete process.env.RESEND_API_KEY;
const sql = postgres(url, { max: 10 });
const schemaName = `test_${randomUUID().replaceAll("-", "")}`;
await sql.unsafe(`CREATE SCHEMA ${schemaName}`);
await sql.end();
// Each test suite gets a fresh schema while all app connections share that schema.
process.env.PGOPTIONS = `-c search_path=${schemaName}`;
const { client } = await import("../server/db");
const {
  fulfillCheckout,
  registerAccessRoutes,
  activateGrant,
  deliverAccessEmails,
} = await import("../server/access");
const { registerStagingJobs, recoverStaleJobs } = await import(
  "../server/stagingJobs"
);
const { isPlanId } = await import("../server/plans");
assert.equal(isPlanId("__proto__"), false);
const { generateToken } = await import("../server/tokenManager");
await client.unsafe(`SET search_path TO ${schemaName}`);
await client.unsafe(
  `CREATE TABLE usage_entitlements(token_id text UNIQUE NOT NULL,free_granted integer NOT NULL DEFAULT 2,free_used integer NOT NULL DEFAULT 0,paid_granted integer NOT NULL DEFAULT 0,paid_used integer NOT NULL DEFAULT 0,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now()); CREATE TABLE stripe_purchases(checkout_session_id text,token_id text,plan_id text,customer_email text,stripe_session jsonb,created_at timestamptz default now());`,
);
await client.unsafe(
  await readFile("migrations/0002_access_and_jobs.sql", "utf8"),
);
const session = (id: string, extra: any = {}) =>
  ({
    id,
    mode: "payment",
    payment_status: "paid",
    currency: "usd",
    amount_total: 900,
    created: Math.floor(Date.now() / 1000),
    metadata: { planId: "quick-pack" },
    customer_details: { email: "test@example.invalid" },
    ...extra,
  }) as any;
const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(cookieParser());
registerAccessRoutes(app);
let calls = 0;
let fail = false;
let release: (() => void) | undefined;
registerStagingJobs(
  app,
  async (_req, res) => {
    calls++;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return fail
      ? res.status(500).json({ error: "simulated" })
      : res.json({
          success: true,
          requestId: randomUUID(),
          promptHash: "test",
          storageBucket: "test",
          originalStoragePath: "original",
          stagedStoragePath: "staged",
        });
  },
  async (_b, p) => `https://example.invalid/${p}`,
);
const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${(server.address() as any).port}`;
const post = (path: string, body: any, cookie?: string) =>
  fetch(base + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
const waitState = async (id: string, state: string) => {
  for (let i = 0; i < 30; i++) {
    const [r] = await client`SELECT state FROM staging_jobs WHERE id=${id}`;
    if (r?.state === state) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error("job did not settle");
};
test("atomic checkout, private reusable access, credits, saved jobs, and exact masks", async (t) => {
  try {
    let grant: any;
    await t.test(
      "20 concurrent fulfillment attempts grant credits exactly once",
      async () => {
        const rows = await Promise.all(
          Array.from({ length: 20 }, () =>
            fulfillCheckout(session("cs_atomic")),
          ),
        );
        grant = rows[0];
        assert.ok(rows.every((r) => r.token_id === grant.token_id));
        const [balance] =
          await client`SELECT * FROM usage_entitlements WHERE token_id=${grant.token_id}`;
        assert.equal(balance.paid_granted, 5);
        assert.equal(
          (await client`SELECT * FROM access_email_outbox`).length,
          1,
        );
      },
    );
    await t.test(
      "legacy grants are adopted without multiplying the old balance",
      async () => {
        await client`INSERT INTO stripe_purchases(checkout_session_id,token_id) VALUES ('cs_legacy','legacy-token')`;
        await client`INSERT INTO usage_entitlements(token_id,paid_granted,paid_used) VALUES ('legacy-token',20,7)`;
        const g = await fulfillCheckout(session("cs_legacy"));
        assert.equal(g.token_id, "legacy-token");
        const [b] =
          await client`SELECT * FROM usage_entitlements WHERE token_id='legacy-token'`;
        assert.equal(b.paid_granted, 20);
        assert.equal(b.paid_used, 7);
        await assert.rejects(() =>
          fulfillCheckout(session("cs_wrong", { amount_total: 1 })),
        );
      },
    );
    let cookie = "";
    await t.test(
      "same email link works on two devices without new credits or expiry",
      async () => {
        const token = createHmac("sha256", process.env.JWT_SECRET!)
          .update("roomstager-access-v1:cs_atomic")
          .digest("base64url");
        const a = await post("/api/access/exchange", { token });
        const b = await post("/api/access/exchange", { token });
        assert.equal(a.status, 200);
        assert.equal(b.status, 200);
        cookie = a.headers.get("set-cookie")!.split(";")[0];
        assert.match(a.headers.get("set-cookie")!, /HttpOnly/);
        assert.equal(
          (await post("/api/access/exchange", { token: "x".repeat(43) }))
            .status,
          401,
        );
        const expired = await fulfillCheckout(
          session("cs_expired", {
            created: Math.floor(Date.now() / 1000) - 400 * 86400,
          }),
        );
        assert.equal(activateGrant({} as any, expired), false);
        const [balance] =
          await client`SELECT * FROM usage_entitlements WHERE token_id=${grant.token_id}`;
        assert.equal(balance.paid_granted, 5);
      },
    );
    const photo = await sharp({
      create: { width: 128, height: 96, channels: 3, background: "#123456" },
    })
      .png()
      .toBuffer();
    const mask = await generateAutoMaskPng(128, 96);
    const payload = {
      image: photo.toString("base64"),
      mask: mask.toString("base64"),
      roomType: "Living Room",
      mode: "replace",
    };
    await t.test(
      "mask alpha and original protected pixels are exact",
      async () => {
        const alpha = await sharp(mask).extractChannel(3).raw().toBuffer();
        assert.equal(alpha[0], 255);
        assert.equal(alpha[70 * 128 + 64], 0);
        const generated = await sharp({
          create: {
            width: 128,
            height: 96,
            channels: 3,
            background: "#abcdef",
          },
        })
          .png()
          .toBuffer();
        const output = await preserveProtectedPixels(photo, generated, mask);
        const data = await sharp(output).raw().toBuffer();
        const original = await sharp(photo).raw().toBuffer();
        for (let p = 0; p < alpha.length; p++)
          if (alpha[p] === 255)
            assert.deepEqual(
              data.subarray(p * 3, p * 3 + 3),
              original.subarray(p * 3, p * 3 + 3),
            );
        assert.notDeepEqual(
          data.subarray((70 * 128 + 64) * 3, (70 * 128 + 64) * 3 + 3),
          original.subarray((70 * 128 + 64) * 3, (70 * 128 + 64) * 3 + 3),
        );
      },
    );
    await t.test(
      "duplicate jobs call the model once and reserve one credit",
      async () => {
        const id = randomUUID();
        const responses = await Promise.all([
          post(
            "/api/generate-staged-room",
            { ...payload, requestId: id },
            cookie,
          ),
          post(
            "/api/generate-staged-room",
            { ...payload, requestId: id },
            cookie,
          ),
        ]);
        assert.ok(responses.every((r) => r.status === 202));
        assert.equal(calls, 1);
        release!();
        await waitState(id, "completed");
        const [b] =
          await client`SELECT paid_used FROM usage_entitlements WHERE token_id=${grant.token_id}`;
        assert.equal(b.paid_used, 1);
        const result = await fetch(base + `/api/staging-jobs/${id}`, {
          headers: { Cookie: cookie },
        });
        assert.equal(result.status, 200);
        assert.equal((await result.json()).state, "completed");
        const other = generateToken("quick-pack", "different-owner").token;
        assert.equal(
          (
            await fetch(base + `/api/staging-jobs/${id}`, {
              headers: { Cookie: `access_token=${other}` },
            })
          ).status,
          404,
        );
      },
    );
    await t.test("failures and interrupted work refund only once", async () => {
      fail = true;
      const id = randomUUID();
      assert.equal(
        (
          await post(
            "/api/generate-staged-room",
            { ...payload, requestId: id },
            cookie,
          )
        ).status,
        202,
      );
      release!();
      await waitState(id, "failed");
      const [b] =
        await client`SELECT paid_used FROM usage_entitlements WHERE token_id=${grant.token_id}`;
      assert.equal(b.paid_used, 1);
      const stale = randomUUID();
      await client`INSERT INTO staging_jobs(id,token_id,input_hash,state,created_at) VALUES (${stale},${grant.token_id},'stale','processing',now()-interval '20 minutes')`;
      await client`UPDATE usage_entitlements SET paid_used=paid_used+1 WHERE token_id=${grant.token_id}`;
      await recoverStaleJobs();
      await recoverStaleJobs();
      const [after] =
        await client`SELECT paid_used FROM usage_entitlements WHERE token_id=${grant.token_id}`;
      assert.equal(after.paid_used, 1);
    });
    await t.test("last credit cannot be spent twice", async () => {
      await client`UPDATE usage_entitlements SET paid_used=4 WHERE token_id=${grant.token_id}`;
      const a = randomUUID(),
        b = randomUUID();
      const responses = await Promise.all([
        post("/api/generate-staged-room", { ...payload, requestId: a }, cookie),
        post("/api/generate-staged-room", { ...payload, requestId: b }, cookie),
      ]);
      assert.deepEqual(responses.map((r) => r.status).sort(), [202, 402]);
      release!();
      await waitState(responses[0].status === 202 ? a : b, "failed");
    });
    await t.test(
      "email recovery does not reveal account existence or multiply requests",
      async () => {
        const a = await post("/api/access/request", {
          email: "test@example.invalid",
        });
        const b = await post("/api/access/request", {
          email: "missing@example.invalid",
        });
        assert.equal(a.status, 200);
        assert.equal(b.status, 200);
        assert.deepEqual(await a.json(), await b.json());
        const [count] =
          await client`SELECT count(*)::int AS count FROM access_email_outbox WHERE session_id='cs_atomic'`;
        assert.equal(count.count, 1);
      },
    );
    await t.test(
      "unpaid and invalid-photo requests never reach AI",
      async () => {
        const before = calls;
        assert.equal(
          (
            await post("/api/generate-staged-room", {
              ...payload,
              requestId: randomUUID(),
            })
          ).status,
          402,
        );
        // A fresh owner avoids the intentional per-token generation rate limit.
        const invalidCookie = `access_token=${generateToken("quick-pack", "invalid-input-owner").token}`;
        assert.equal(
          (
            await post(
              "/api/generate-staged-room",
              {
                ...payload,
                requestId: randomUUID(),
                image: "this-is-not-an-image-but-it-is-long-enough",
              },
              invalidCookie,
            )
          ).status,
          400,
        );
        const opaque = await sharp({
          create: { width: 128, height: 96, channels: 4, background: "#000" },
        })
          .png()
          .toBuffer();
        assert.equal(
          (
            await post(
              "/api/generate-staged-room",
              {
                ...payload,
                requestId: randomUUID(),
                mask: opaque.toString("base64"),
              },
              invalidCookie,
            )
          ).status,
          400,
        );
        assert.equal(calls, before);
      },
    );

    await t.test(
      "signed Stripe webhook retries persist one purchase and one credit grant",
      async () => {
        await client.unsafe(`ALTER TABLE stripe_purchases
        ADD COLUMN id bigserial PRIMARY KEY,
        ADD COLUMN stripe_event_id text UNIQUE,
        ADD COLUMN payment_intent_id text,
        ADD COLUMN plan_label text,
        ADD COLUMN amount_total_cents integer,
        ADD COLUMN currency text,
        ADD COLUMN payment_status text,
        ADD COLUMN livemode boolean,
        ADD COLUMN environment text,
        ADD COLUMN card_brand text,
        ADD COLUMN card_last4 text,
        ADD COLUMN receipt_url text,
        ADD COLUMN stripe_event jsonb`);
        process.env.STRIPE_SECRET_KEY = "sk_test_local_fake_no_network";
        process.env.STRIPE_WEBHOOK_SECRET = "whsec_local_test_only";
        const { default: Stripe } = await import("stripe");
        const { registerRoutes } = await import("../server/routes");
        const webhookApp = express();
        webhookApp.use(
          express.json({
            verify: (req, _res, buf) => {
              (req as any).rawBody = buf;
            },
          }),
        );
        const webhookServer = await registerRoutes(webhookApp);
        await new Promise<void>((resolve) =>
          webhookServer.listen(0, "127.0.0.1", resolve),
        );
        const target = `http://127.0.0.1:${(webhookServer.address() as any).port}/api/webhook`;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const event = {
          id: "evt_local_retry",
          type: "checkout.session.completed",
          livemode: false,
          data: { object: session("cs_webhook_retry") },
        };
        const payload = JSON.stringify(event);
        const header = stripe.webhooks.generateTestHeaderString({
          payload,
          secret: process.env.STRIPE_WEBHOOK_SECRET,
        });
        try {
          const send = (signature: string) =>
            fetch(target, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "stripe-signature": signature,
              },
              body: payload,
            });
          assert.equal((await send("invalid")).status, 400);
          // Exercise return-page-first as well as repeated signed webhook delivery.
          const grant = await fulfillCheckout(event.data.object);
          assert.equal((await send(header)).status, 200);
          assert.equal((await send(header)).status, 200);
          const [purchase] =
            await client`SELECT count(*)::int AS count, max(token_id) AS token FROM stripe_purchases WHERE checkout_session_id='cs_webhook_retry'`;
          assert.equal(purchase.count, 1);
          assert.equal(purchase.token, grant.token_id);
          const [credits] =
            await client`SELECT paid_granted FROM usage_entitlements WHERE token_id=${grant.token_id}`;
          assert.equal(credits.paid_granted, 5);
        } finally {
          await new Promise<void>((resolve) =>
            webhookServer.close(() => resolve()),
          );
        }
      },
    );
    await t.test(
      "revocation blocks an already-issued cookie and its reusable link",
      async () => {
        await client`UPDATE access_grants SET revoked_at=now() WHERE session_id='cs_atomic'`;
        assert.equal(
          (
            await fetch(base + "/api/staging-jobs", {
              headers: { Cookie: cookie },
            })
          ).status,
          401,
        );
        const token = createHmac("sha256", process.env.JWT_SECRET!)
          .update("roomstager-access-v1:cs_atomic")
          .digest("base64url");
        assert.equal(
          (await post("/api/access/exchange", { token })).status,
          401,
        );
      },
    );
    await t.test(
      "email failures retain the outbox item and retry with the same provider key",
      async () => {
        await client`UPDATE access_email_outbox SET sent_at=now()`;
        await fulfillCheckout(session("cs_email_retry"));
        const realFetch = globalThis.fetch;
        const keys: string[] = [];
        let attempts = 0;
        process.env.RESEND_API_KEY = "test-provider-only";
        process.env.ACCESS_EMAIL_FROM = "RoomStagerPro <test@example.invalid>";
        globalThis.fetch = async (url, init) => {
          assert.equal(url, "https://api.resend.com/emails");
          keys.push(
            (init!.headers as Record<string, string>)["Idempotency-Key"],
          );
          const body = JSON.parse(init!.body as string);
          assert.equal(body.reply_to, "aaron@aprkc.com");
          assert.match(body.text, /https:\/\/roomstagerpro.com\/access#token=/);
          return new Response("{}", { status: ++attempts === 1 ? 503 : 200 });
        };
        try {
          await deliverAccessEmails();
          const [pending] =
            await client`SELECT * FROM access_email_outbox WHERE session_id='cs_email_retry'`;
          assert.equal(pending.sent_at, null);
          await client`UPDATE access_email_outbox SET available_at=now() WHERE id=${pending.id}`;
          await Promise.all([deliverAccessEmails(), deliverAccessEmails()]);
          const [done] =
            await client`SELECT * FROM access_email_outbox WHERE id=${pending.id}`;
          assert.ok(done.sent_at);
          assert.equal(done.attempts, 2);
          assert.equal(keys.length, 2);
          assert.equal(keys[0], keys[1]);
        } finally {
          globalThis.fetch = realFetch;
          delete process.env.RESEND_API_KEY;
          delete process.env.ACCESS_EMAIL_FROM;
        }
      },
    );
    await t.test("quota deferral preserves attempts and delivers after reset", async () => {
      await client`UPDATE access_email_outbox SET sent_at=now()`;
      await fulfillCheckout(session("cs_email_quota"));
      const realFetch = globalThis.fetch;
      process.env.RESEND_API_KEY = "test-provider-only";
      process.env.ACCESS_EMAIL_FROM = "RoomStagerPro <test@example.invalid>";
      const keys: string[] = [];
      globalThis.fetch = async (_url, init) => {
        keys.push((init!.headers as Record<string, string>)["Idempotency-Key"]);
        return keys.length === 1
          ? Response.json({ name: "daily_quota_exceeded" }, { status: 429 })
          : Response.json({ id: "test-email" });
      };
      try {
        await deliverAccessEmails();
        const [pending] = await client`SELECT * FROM access_email_outbox WHERE session_id='cs_email_quota'`;
        assert.equal(pending.sent_at, null);
        assert.equal(pending.attempts, 0);
        assert.ok(new Date(pending.available_at).getTime() > Date.now());
        await deliverAccessEmails();
        assert.equal(keys.length, 1);
        await client`UPDATE access_email_outbox SET available_at=now() WHERE id=${pending.id}`;
        await deliverAccessEmails();
        const [done] = await client`SELECT * FROM access_email_outbox WHERE id=${pending.id}`;
        assert.ok(done.sent_at);
        assert.equal(done.attempts, 1);
        assert.equal(keys[0], keys[1]);
      } finally {
        globalThis.fetch = realFetch;
        delete process.env.RESEND_API_KEY;
        delete process.env.ACCESS_EMAIL_FROM;
      }
    });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await client.end();
  }
});

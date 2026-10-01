import { createHash, createHmac, randomUUID } from "node:crypto";
import type { Express } from "express";
import type Stripe from "stripe";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { client } from "./db";
import { resendRetryAt } from "./emailRetry";
import { getPlanConfig } from "./plans";
import { generateToken, setAccessTokenCookie } from "./tokenManager";
import { reconcileBilling } from "./billingAdjustments";
import { syncEmailDelivery } from "./emailDelivery";

export const appOrigin = () =>
  new URL(process.env.PUBLIC_APP_URL || "https://roomstagerpro.com").origin;
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
// Domain-separated HMAC permits retries without storing a reusable bearer secret.
const linkSecret = (id: string) =>
  createHmac("sha256", process.env.JWT_SECRET!)
    .update(`roomstager-access-v1:${id}`)
    .digest("base64url");
const accessUrl = (id: string) =>
  `${appOrigin()}/access#token=${linkSecret(id)}`;

export async function fulfillCheckout(session: Stripe.Checkout.Session) {
  const plan = getPlanConfig(session.metadata?.planId);
  if (
    session.payment_status !== "paid" ||
    !plan ||
    session.mode !== "payment" ||
    session.currency !== "usd" ||
    session.amount_total !== plan.price * 100
  ) {
    throw new Error("Checkout does not match an eligible paid pack");
  }
  return client.begin(async (tx) => {
    // Serializes the webhook and return-page race, including legacy purchases.
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${session.id}, 0))`;
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null;
    if (paymentIntentId) await tx`SELECT pg_advisory_xact_lock(hashtextextended(${paymentIntentId},3))`;
    const [existing] =
      await tx`SELECT * FROM access_grants WHERE session_id=${session.id}`;
    if (existing) {
      if (paymentIntentId) {
        await tx`UPDATE access_grants SET payment_intent_id=${paymentIntentId} WHERE session_id=${session.id} AND payment_intent_id IS NULL`;
        await reconcileBilling(tx,paymentIntentId);
      }
      return (await tx`SELECT * FROM access_grants WHERE session_id=${session.id}`)[0];
    }
    const [legacy] =
      await tx`SELECT token_id FROM stripe_purchases WHERE checkout_session_id=${session.id} AND token_id IS NOT NULL LIMIT 1`;
    const tokenId = legacy?.token_id || randomUUID();
    const expiresAt = new Date(
      (session.created + plan.durationDays * 86400) * 1000,
    );
    const email =
      (session.customer_details?.email || session.customer_email || "")
        .trim()
        .toLowerCase() || null;
    // A token already attached by the old checkout flow has already received credits.
    if (!legacy?.token_id) {
      await tx`INSERT INTO usage_entitlements(token_id, paid_granted, paid_used)
        VALUES (${tokenId},${plan.uses},0)
        ON CONFLICT (token_id) DO UPDATE SET paid_granted=usage_entitlements.paid_granted+EXCLUDED.paid_granted, updated_at=now()`;
    }
    const [grant] =
      await tx`INSERT INTO access_grants(session_id, token_id, plan_id, email, link_hash, expires_at,payment_intent_id)
      VALUES (${session.id},${tokenId},${plan.id},${email},${digest(linkSecret(session.id))},${expiresAt.toISOString()},${paymentIntentId}) RETURNING *`;
    if (paymentIntentId) await reconcileBilling(tx,paymentIntentId);
    await tx`UPDATE stripe_purchases SET token_id=${tokenId} WHERE checkout_session_id=${session.id}`;
    if (email && expiresAt.getTime() > Date.now()) {
      await tx`INSERT INTO access_email_outbox(id, session_id) VALUES (${randomUUID()},${session.id})`;
    }
    return (await tx`SELECT * FROM access_grants WHERE session_id=${session.id}`)[0];
  });
}

export function activateGrant(res: any, grant: any) {
  const expiry = Math.floor(new Date(grant.expires_at).getTime() / 1000);
  if (grant.revoked_at || grant.billing_blocked || expiry <= Date.now() / 1000) return false;
  setAccessTokenCookie(
    res,
    generateToken(grant.plan_id, grant.token_id, expiry),
  );
  return true;
}

export function registerAccessRoutes(app: Express) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });
  app.post("/api/access/exchange", limiter, async (req, res) => {
    res.set("Cache-Control", "no-store");
    const parsed = z
      .object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })
      .safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "This access link is invalid." });
    try {
      const [grant] =
        await client`SELECT * FROM access_grants WHERE link_hash=${digest(parsed.data.token)}`;
      if (!grant || !activateGrant(res, grant))
        return res.status(401).json({
          error:
            "This pack has expired or is no longer active. Request your current access links below.",
        });
      return res.json({ success: true });
    } catch {
      return res
        .status(503)
        .json({ error: "Access is temporarily unavailable. Please retry." });
    }
  });
  app.post("/api/access/request", limiter, async (req, res) => {
    const parsed = z
      .object({ email: z.string().email().max(254) })
      .safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Enter a valid email address." });
    try {
      // Per-recipient cooldown prevents abuse distributed across IP addresses.
      await client.begin(async (tx) => {
        const email = parsed.data.email.trim().toLowerCase();
        await tx`SELECT pg_advisory_xact_lock(hashtextextended(${email}, 1))`;
        const legacy =
          await tx`SELECT DISTINCT ON (checkout_session_id) checkout_session_id,token_id,plan_id,stripe_session,created_at
          FROM stripe_purchases WHERE lower(customer_email)=${email} AND token_id IS NOT NULL
          ORDER BY checkout_session_id,created_at DESC`;
        for (const old of legacy) {
          const plan = getPlanConfig(old.plan_id);
          if (!plan) continue;
          const purchased = old.stripe_session?.created
            ? old.stripe_session.created * 1000
            : new Date(old.created_at).getTime();
          const expiry = new Date(purchased + plan.durationDays * 86400000);
          if (
            !Number.isFinite(expiry.getTime()) ||
            expiry.getTime() <= Date.now()
          )
            continue;
          await tx`INSERT INTO access_grants(session_id,token_id,plan_id,email,link_hash,expires_at)
            VALUES (${old.checkout_session_id},${old.token_id},${plan.id},${email},${digest(linkSecret(old.checkout_session_id))},${expiry.toISOString()})
            ON CONFLICT (session_id) DO NOTHING`;
        }
        const grants =
          await tx`SELECT g.session_id FROM access_grants g WHERE g.email=${email}
          AND g.expires_at>now() AND g.revoked_at IS NULL AND NOT g.billing_blocked
          AND NOT EXISTS (SELECT 1 FROM access_email_outbox o WHERE o.session_id=g.session_id AND o.created_at>now()-interval '15 minutes')`;
        for (const g of grants)
          await tx`INSERT INTO access_email_outbox(id,session_id) VALUES (${randomUUID()},${g.session_id})`;
      });
      return res.json({
        message:
          "If this email has an active pack, we’ll send its access link. Check your inbox and spam folder.",
      });
    } catch {
      return res.status(503).json({
        error: "We couldn’t request your link. Please retry shortly.",
      });
    }
  });
}

let sending = false;
export async function deliverAccessEmails() {
  if (sending || !process.env.RESEND_API_KEY || !process.env.ACCESS_EMAIL_FROM)
    return;
  sending = true;
  try {
    await client`INSERT INTO access_email_delivery(outbox_id,status,last_error)
      SELECT id,'failed','retry_budget_exhausted' FROM access_email_outbox WHERE sent_at IS NULL AND attempts>=20
      ON CONFLICT(outbox_id) DO UPDATE SET status='failed',last_error='retry_budget_exhausted',updated_at=now()`;
    // A lease and provider idempotency key protect against concurrent workers/restarts.
    const rows =
      await client`UPDATE access_email_outbox SET available_at=now()+interval '5 minutes', attempts=attempts+1
      WHERE id IN (SELECT id FROM access_email_outbox WHERE sent_at IS NULL AND available_at<=now() AND attempts<20
      ORDER BY created_at LIMIT 5 FOR UPDATE SKIP LOCKED) RETURNING *`;
    for (const row of rows) {
      await client`INSERT INTO access_email_delivery(outbox_id) VALUES (${row.id}) ON CONFLICT DO NOTHING`;
      const [g] =
        await client`SELECT * FROM access_grants WHERE session_id=${row.session_id}`;
      if (
        !g?.email ||
        g.revoked_at ||
        g.billing_blocked ||
        new Date(g.expires_at).getTime() <= Date.now()
      ) {
        await client`UPDATE access_email_outbox SET sent_at=now() WHERE id=${row.id}`;
        await client`UPDATE access_email_delivery SET status='skipped',updated_at=now() WHERE outbox_id=${row.id}`;
        continue;
      }
      try {
        const reply = await fetch("https://api.resend.com/emails", {
          method: "POST",
          signal: AbortSignal.timeout(15000),
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `access/${row.id}`,
          },
          body: JSON.stringify({
            from: process.env.ACCESS_EMAIL_FROM,
            reply_to: process.env.ACCESS_EMAIL_REPLY_TO || "aaron@aprkc.com",
            to: [g.email],
            subject: "Your RoomStagerPro access link",
            text: `Open your RoomStagerPro pack on any device:\n\n${accessUrl(g.session_id)}\n\nKeep this link private: anyone with it can use your pack. It remains valid until ${new Date(g.expires_at).toISOString().slice(0, 10)}. Your remaining credits are shared across devices. This link does not create a new purchase.\n\nReview each staged image before publishing and label it as virtually staged.`,
          }),
        });
        if (reply.status === 429) {
          const retryAt = await resendRetryAt(reply);
          // Quota/rate-limit refusals are not failed deliveries. Keep the message
          // queued without exhausting its retry budget before the quota resets.
          await client`UPDATE access_email_outbox SET available_at=${retryAt.toISOString()}, attempts=GREATEST(attempts-1,0) WHERE id=${row.id}`;
          await client`UPDATE access_email_delivery SET status='deferred',last_error='provider_limit',updated_at=now() WHERE outbox_id=${row.id}`;
          console.error("Access email deferred: provider sending limit reached");
          continue;
        }
        if (!reply.ok) throw new Error(`email_provider_${reply.status}`);
        const accepted = z.object({id:z.string().min(1).max(128)}).parse(await reply.json());
        await client.begin(async(tx)=>{
          await tx`UPDATE access_email_outbox SET sent_at=now() WHERE id=${row.id}`;
          await tx`UPDATE access_email_delivery SET provider_id=${accepted.id},status='accepted',last_error=NULL,updated_at=now() WHERE outbox_id=${row.id}`;
        });
        await syncEmailDelivery(accepted.id);
      } catch {
        await client`UPDATE access_email_delivery SET status=${row.attempts>=20?'failed':'retrying'},last_error='provider_send_failed',updated_at=now() WHERE outbox_id=${row.id} AND provider_id IS NULL`;
        console.error("Access email delivery failed; queued for retry");
      }
    }
  } finally {
    sending = false;
  }
}

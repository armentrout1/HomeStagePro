import { client } from "./db";
import { getPlanConfig } from "./plans";

export async function reconcileBilling(tx: any, paymentIntentId: string) {
  const [adjustment] = await tx`SELECT * FROM payment_adjustments WHERE payment_intent_id=${paymentIntentId}`;
  if (!adjustment) return;
  const grants = await tx`SELECT * FROM access_grants WHERE payment_intent_id=${paymentIntentId} FOR UPDATE`;
  for (const grant of grants) {
    const plan = getPlanConfig(grant.plan_id);
    if (!plan) throw new Error("Billing adjustment requires plan review");
    const remaining = Math.floor(plan.uses * Math.max(0, plan.price * 100 - adjustment.refunded_cents) / (plan.price * 100));
    const reduction = adjustment.disputed ? plan.uses : plan.uses - remaining;
    const delta = reduction - grant.billing_credit_reduction;
    if (delta) {
      const updated = await tx`UPDATE usage_entitlements SET paid_granted=paid_granted-${delta},updated_at=now()
        WHERE token_id=${grant.token_id} AND paid_granted>=${Math.max(delta,0)} RETURNING token_id`;
      if (!updated.length) throw new Error("Billing balance requires manual reconciliation");
    }
    await tx`UPDATE access_grants SET billing_credit_reduction=${reduction},billing_blocked=${Boolean(adjustment.disputed || remaining === 0)} WHERE session_id=${grant.session_id}`;
  }
}

export async function recordBillingAdjustment(input: {
  eventId: string; paymentIntentId: string; kind: string; eventCreated: number;
  refundedCents?: number; disputed?: boolean;
  refund?: {id:string;amount:number;status:string};
}) {
  if (input.refundedCents !== undefined && (!Number.isSafeInteger(input.refundedCents) || input.refundedCents < 0)) throw new Error("Invalid refund amount");
  await client.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${input.paymentIntentId},3))`;
    const inserted = await tx`INSERT INTO billing_events(event_id,payment_intent_id,kind) VALUES (${input.eventId},${input.paymentIntentId},${input.kind}) ON CONFLICT DO NOTHING RETURNING event_id`;
    if (!inserted.length) return;
    await tx`INSERT INTO payment_adjustments(payment_intent_id) VALUES (${input.paymentIntentId}) ON CONFLICT DO NOTHING`;
    if(input.refund) {
      const refund=input.refund;
      if(!Number.isSafeInteger(refund.amount)||refund.amount<0) throw new Error("Invalid refund amount");
      await tx`INSERT INTO billing_refunds(refund_id,payment_intent_id,amount_cents,status,event_created)
        VALUES (${refund.id},${input.paymentIntentId},${refund.amount},${refund.status},${input.eventCreated})
        ON CONFLICT(refund_id) DO UPDATE SET status=EXCLUDED.status,event_created=EXCLUDED.event_created
        WHERE billing_refunds.event_created<=EXCLUDED.event_created AND billing_refunds.status NOT IN ('failed','canceled')`;
      await tx`UPDATE payment_adjustments SET refunded_cents=(SELECT COALESCE(sum(amount_cents),0) FROM billing_refunds WHERE payment_intent_id=${input.paymentIntentId} AND status NOT IN ('failed','canceled')),updated_at=now() WHERE payment_intent_id=${input.paymentIntentId}`;
    }
    if (input.refundedCents !== undefined) await tx`UPDATE payment_adjustments SET refunded_cents=GREATEST(refunded_cents,${input.refundedCents}),updated_at=now() WHERE payment_intent_id=${input.paymentIntentId}`;
    if (input.disputed !== undefined) await tx`UPDATE payment_adjustments SET disputed=${input.disputed},dispute_event_at=${input.eventCreated},updated_at=now()
      WHERE payment_intent_id=${input.paymentIntentId} AND dispute_event_at<=${input.eventCreated}`;
    await reconcileBilling(tx,input.paymentIntentId);
  });
}

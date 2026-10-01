import { Webhook } from "svix";
import type { Express } from "express";
import { z } from "zod";
import { client } from "./db";

const eventSchema = z.object({ type: z.string(), created_at: z.string().datetime({offset:true}), data: z.object({email_id:z.string().min(1).max(128)}) });
const statuses: Record<string,string> = {"email.sent":"accepted","email.delivered":"delivered","email.delivery_delayed":"delayed","email.bounced":"bounced","email.complained":"complained","email.failed":"failed","email.suppressed":"suppressed"};
export async function syncEmailDelivery(providerId: string) {
  const [event] = await client`SELECT event_type FROM access_email_events WHERE provider_id=${providerId}
    ORDER BY CASE WHEN event_type IN ('email.bounced','email.complained','email.failed','email.suppressed') THEN 1 ELSE 0 END DESC,occurred_at DESC,event_id DESC LIMIT 1`;
  if (event) await client`UPDATE access_email_delivery SET status=${statuses[event.event_type]},updated_at=now() WHERE provider_id=${providerId}`;
}
export function registerEmailWebhook(app: Express) {
  app.post("/api/email-webhook", async (req,res) => {
    const secret=process.env.RESEND_WEBHOOK_SECRET;
    if(!secret) return res.status(503).json({error:"Email delivery webhook is not configured"});
    let payload: z.infer<typeof eventSchema>;
    const eventId=req.get("svix-id");
    try {
      if(!eventId || !Buffer.isBuffer((req as any).rawBody)) throw new Error("Missing signature body");
      const raw=(req as any).rawBody.toString("utf8");
      new Webhook(secret).verify(raw, {"svix-id":eventId,"svix-timestamp":req.get("svix-timestamp")||"","svix-signature":req.get("svix-signature")||""});
      payload=eventSchema.parse(JSON.parse(raw));
    } catch { return res.status(400).json({error:"Invalid email webhook signature or payload"}); }
    if(!statuses[payload.type]) return res.json({received:true});
    try {
      await client`INSERT INTO access_email_events(event_id,provider_id,event_type,occurred_at) VALUES (${eventId!},${payload.data.email_id},${payload.type},${payload.created_at}) ON CONFLICT DO NOTHING`;
      await syncEmailDelivery(payload.data.email_id);
      return res.json({received:true});
    } catch { return res.status(503).json({error:"Delivery event could not be recorded"}); }
  });
}

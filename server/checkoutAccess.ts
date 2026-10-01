import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";

const lifetimeMs = 2 * 60 * 60 * 1000;
const name = (sessionId: string) => `checkout_${createHmac("sha256", process.env.JWT_SECRET!).update(sessionId).digest("hex").slice(0, 20)}`;
const hash = (value: string) => createHmac("sha256", process.env.JWT_SECRET!).update(`checkout-browser:${value}`).digest("hex");

export function newCheckoutBinding() {
  const secret = randomBytes(32).toString("base64url");
  return { secret, hash: hash(secret) };
}

export function setCheckoutBinding(res: Response, sessionId: string, secret: string) {
  res.cookie(name(sessionId), secret, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/api/checkout-status", maxAge: lifetimeMs,
  });
}

export function canActivateCheckout(req: Request, session: { id: string; created: number; metadata: Record<string, string> | null }) {
  const secret = req.cookies?.[name(session.id)];
  const expected = session.metadata?.browserBinding;
  if (typeof secret !== "string" || !expected || !/^[a-f0-9]{64}$/.test(expected)) return false;
  if (Date.now() > session.created * 1000 + lifetimeMs) return false;
  return timingSafeEqual(Buffer.from(hash(secret), "hex"), Buffer.from(expected, "hex"));
}

export function analyticsOrderId(sessionId: string) {
  return `order_${createHmac("sha256", process.env.JWT_SECRET!).update(`analytics-order:${sessionId}`).digest("hex").slice(0, 32)}`;
}

export type SecurityEvent =
  | { type: "STAGING_RATE_LIMITED"; keyType: "token" | "ip"; key: string; path: string }
  | { type: "USAGE_LIMITER_UNAVAILABLE"; path: string; message?: string }
  | { type: "STRIPE_WEBHOOK_ERROR"; status: number; message: string };

export function logSecurityEvent(evt: SecurityEvent) {
  console.log(
    `SECURITY_EVENT ${JSON.stringify({
      ts: new Date().toISOString(),
      ...evt,
    })}`,
  );
}

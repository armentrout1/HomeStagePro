// Resend resets its daily sending quota at midnight UTC. Monthly resets depend
// on the account's billing cycle, so recheck daily instead of guessing a date.
export async function resendRetryAt(reply: Response, now = Date.now()) {
  const error = await reply.json().catch(() => ({})) as { name?: string } | null;
  let delay = 5 * 60_000;
  if (error?.name === "daily_quota_exceeded") {
    const nextDay = new Date(now);
    nextDay.setUTCHours(24, 1, 0, 0);
    delay = nextDay.getTime() - now;
  } else if (error?.name === "monthly_quota_exceeded") {
    delay = 24 * 60 * 60_000;
  }
  const header = reply.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    const retryTime = Number.isFinite(seconds) ? now + seconds * 1000 : Date.parse(header);
    if (Number.isFinite(retryTime)) delay = Math.max(delay, retryTime - now);
  }
  return new Date(now + delay);
}

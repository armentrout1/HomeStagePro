import assert from "node:assert/strict";
import { test } from "node:test";
import { resendRetryAt } from "../server/emailRetry";

test("daily quota waits for midnight UTC, including month rollover", async () => {
  const now = Date.parse("2026-09-30T22:00:00Z");
  const response = Response.json({ name: "daily_quota_exceeded" }, { status: 429 });
  assert.equal((await resendRetryAt(response, now)).toISOString(), "2026-10-01T00:01:00.000Z");
});
test("monthly quota rechecks in a day without assuming the billing date", async () => {
  const now = Date.parse("2026-09-30T22:00:00Z");
  assert.equal((await resendRetryAt(Response.json({ name: "monthly_quota_exceeded" }), now)).getTime(), now + 86400000);
});
test("rate limits respect Retry-After seconds and dates, with a safe fallback", async () => {
  const now = Date.parse("2026-09-30T22:00:00Z");
  for (const header of ["3600", "Wed, 30 Sep 2026 23:00:00 GMT"]) {
    const response = new Response("not json", { headers: { "Retry-After": header } });
    assert.equal((await resendRetryAt(response, now)).getTime(), now + 3600000);
  }
  assert.equal((await resendRetryAt(new Response("null"), now)).getTime(), now + 300000);
});

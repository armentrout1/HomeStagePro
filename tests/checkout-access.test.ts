import { test } from "node:test";
import assert from "node:assert/strict";
process.env.JWT_SECRET = "checkout-tests-only";
const { newCheckoutBinding, setCheckoutBinding, canActivateCheckout, analyticsOrderId } = await import("../server/checkoutAccess");
test("checkout return needs its browser secret and expires independently of the email pack", () => {
  const binding = newCheckoutBinding();
  const cookies: Record<string, string> = {};
  const session = { id: "cs_test_order", created: Math.floor(Date.now() / 1000), metadata: { browserBinding: binding.hash } };
  setCheckoutBinding({ cookie(name: string, value: string, options: any) { cookies[name] = value; assert.ok(options.httpOnly); } } as any, session.id, binding.secret);
  assert.equal(canActivateCheckout({ cookies } as any, session), true);
  assert.equal(canActivateCheckout({ cookies: {} } as any, session), false);
  assert.equal(canActivateCheckout({ cookies } as any, { ...session, metadata: null }), false);
  assert.equal(canActivateCheckout({ cookies } as any, { ...session, created: session.created - 7201 }), false);
  assert.equal(canActivateCheckout({ cookies } as any, { ...session, id: "cs_other" }), false);
  assert.ok(!analyticsOrderId(session.id).includes(session.id));
  assert.equal(analyticsOrderId(session.id), analyticsOrderId(session.id));
});

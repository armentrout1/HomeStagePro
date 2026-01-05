# Stripe Sandbox Testing

## Required Environment Variables
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_PUBLIC_KEY`
- `JWT_SECRET` (if applicable)

## Stripe CLI Setup
Install the Stripe CLI using the appropriate `brew`, `choco`, `scoop`, or `npm` command for your system.

## Commands
1. `stripe login`
2. `stripe listen --forward-to localhost:<PORT>/api/webhook`
3. Copy the `whsec_...` value shown in the listen output into `STRIPE_WEBHOOK_SECRET`

## Smoke Test
1. Start the app.
2. Open the Upgrade page.
3. Complete a test checkout using a Stripe test card.
4. Confirm the webhook returns 2xx (Stripe CLI shows the event as delivered).
5. Confirm `/api/checkout-status` still produces entitlements/token.

## Common Failures
- `400 signature missing/misconfigured` — `STRIPE_WEBHOOK_SECRET` is not set.
- `signature verification failed` — wrong `whsec` value for this environment.
- `404 on /api/webhook` — incorrect `--forward-to` path or port.
- `mode: live` on `GET /api/stripe/status` — you are using `sk_live_...` on the server.  
  Fix: replace `STRIPE_SECRET_KEY` with `sk_test_...` (sandbox/test), update `VITE_STRIPE_PUBLIC_KEY` to `pk_test_...`, then restart server + Vite.

## Verify Current Environment
- Call `GET /api/stripe/status` and confirm:
  - `stripeConfigured` true
  - `webhookConfigured` true (after setting `STRIPE_WEBHOOK_SECRET`)
  - `mode` is `test` in sandbox
- If `stripeConfigured` is false:
  - `STRIPE_SECRET_KEY` is missing or wrong environment
- If `webhookConfigured` is false:
  - `STRIPE_WEBHOOK_SECRET` is missing or server was not restarted

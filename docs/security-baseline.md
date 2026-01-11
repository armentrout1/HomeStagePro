# HomeStagePro Security Baseline (Production)

Last verified: 2026-01-10  
Scope: HomeStagePro / RoomStager production hardening, payments, usage limits, and entitlement expiration.

---

## 1) Executive Summary

HomeStagePro currently has a strong production security baseline for a paid, internet-facing app:

- Secrets are required (no unsafe fallbacks).
- Auth is cookie-based with secure flags.
- Stripe webhooks are verified and purchases are idempotent.
- Usage limits cannot be bypassed on failure in production.
- Sensitive server debug logs are gated off in production.
- Security headers are active.
- Paid access and credits are time-bounded (expires) and enforced on every staging request.
- The build compiles cleanly with the hardening in place.

---

## 2) What We Have Implemented and Verified

### A) Secrets / Environment Safety

**Controls**
- `JWT_SECRET` is required at startup (no fallback secret).
- Supabase server-only secrets are required (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- OpenAI key is used from env only (not embedded in client).

**Why it matters**
- Removes "works in prod but insecure" configurations.
- Prevents accidental deployment with default secrets.

**Triggers to revisit**
- Adding more third-party integrations (new secrets).
- Adding multiple environments (preview/staging/prod) with different secret policies.

---

### B) Authentication & Session Handling

**Controls**
- Access token stored in cookies with strong flags:
  - `httpOnly: true` (not readable by JS)
  - `secure: true` (HTTPS only)
  - `sameSite: "lax"` (helps mitigate CSRF in typical flows)
- Token expiration and uses-based rules enforced server-side.

**Why it matters**
- Reduces XSS/CSRF risk.
- Ensures stale/expired paid tokens don't silently keep working.

**Triggers to revisit**
- If you move frontend/backend to different domains/subdomains.
- If you add "embedded" use-cases (iframes) or external integrations.
- If you add multi-device sessions or refresh-token flows.

---

### C) Entitlements, Credits, and Expiration (Paid Plans)

**Controls**
- Plans define duration (`durationDays`) centrally.
- Tokens include `expiresAt` and are validated on every protected action.
- Core staging endpoint enforces:
  1) `checkAccessToken` (validates token + expiration)
  2) entitlement attachment
  3) IP limiter logic
  4) DB usage updates on success
- `hasValidAccess()` now checks BOTH `usesLeft` and `expiresAt`.

**Why it matters**
- Prevents users from retaining paid access after plan expiration.
- Reduces risk of future regression if helper functions are reused incorrectly.

**Triggers to revisit**
- If you introduce account-based plans (user accounts) rather than token-based.
- If you add upgrades/downgrades, renewals, prorations.
- If customers demand "restore purchases on new device" flows.

---

### D) Usage Limiting / Abuse Protection

**Controls**
- Free usage is persisted to Postgres (`ip_free_usage`) with hashed IP storage.
- "Fail-fast" guard prevents disabling usage limits in production.
- **Fail-closed behavior in production**: if limiter storage fails, requests are denied with 503 (no bypass).
- Checkout session endpoint is rate-limited to reduce spam.

**Why it matters**
- Prevents quota bypass during DB outages.
- Reduces Stripe session spam / operational abuse.

**Triggers to revisit**
- If you see real users blocked (tune rate limit).
- If you add more sensitive endpoints (login, password reset, signup).
- If you add an API intended for programmatic access.

---

### E) Stripe Payment Security

**Controls**
- Webhook signature verification using Stripe's construct/verify flow.
- Raw request body preserved for accurate webhook verification.
- Idempotency via unique event/purchase checks (prevents double-crediting).
- Payment status checked (paid) before granting credits.
- Webhook endpoint is **not** rate-limited (avoid breaking Stripe deliveries).

**Why it matters**
- Prevents forged webhook events.
- Prevents duplicate entitlements from repeated Stripe retries.

**Triggers to revisit**
- If you add multiple Stripe products/prices.
- If you add refunds/chargebacks and need automatic entitlement revocation.
- If you add subscription management and cancellation states.

---

### F) Logging / Debug Controls

**Controls**
- Production-aware `debugLog` helper gates sensitive logs to non-production only.
- Only an expected logging utility remains, and the debug helper internally uses `console.log` but is production-gated.

**Why it matters**
- Prevents leaking event IDs, token fragments, and internal operational state.

**Triggers to revisit**
- If you add structured logging (recommended).
- If you need audit trails for compliance or support.

---

### G) Security Headers

**Controls**
- `helmet()` applied globally early in Express bootstrap.

**Why it matters**
- Sets baseline secure headers (XSS-related headers, framing controls, etc.).

**Triggers to revisit**
- If you embed the app in an iframe, or if you add third-party embed scripts.
- If you add a strict Content Security Policy (CSP) later.

---

### H) Debug / Admin Routes Locked Down

**Controls**
- Debug endpoints are restricted/disabled in production (return 404).
- Status/check endpoints don't expose sensitive internals to public users.

**Why it matters**
- Prevents reconnaissance and accidental leakage.

**Triggers to revisit**
- If you add new diagnostic endpoints for support—always gate them.

---

## 3) Current Security Posture: What This Baseline Does and Doesn't Cover

### Covered well
- Standard web-app production hardening
- Payment webhook integrity
- Quota enforcement and fail-closed behavior
- Cookie-based auth safety basics
- Leakage reduction (logs, debug endpoints)

### Not fully addressed yet (normal for early production)
- Full account-level access controls and admin/user separation (if/when you add accounts)
- Advanced fraud prevention and anti-bot strategies
- Mature monitoring/alerting and incident response workflows
- Formal dependency vulnerability management (SBOM, etc.)

---

## 4) Recommended Next Improvements (Later, As You Grow)

These are intentionally grouped by "what triggers them" so you know when to act.

### A) Add rate limiting to other high-risk endpoints
**What to add**
- Rate limit:
  - auth/session endpoints (if you add them)
  - password reset (if you add it)
  - any endpoint that calls OpenAI (cost exposure)

**Trigger**
- You see spam traffic, bot activity, or unexpected cost spikes.
- You add login/password flows.

---

### B) Add structured logging + basic production monitoring
**What to add**
- Use a logger (pino/winston) with:
  - log levels
  - request IDs
  - redaction rules for tokens/secrets
- Add monitoring/alerts for:
  - spikes in 429 (rate limit)
  - spikes in 503 (limiter DB issues)
  - webhook failures

**Trigger**
- Paying customers increase.
- You need reliable debugging without exposing sensitive logs.

---

### C) Add refund/chargeback entitlement handling
**What to add**
- On relevant Stripe events (refund/chargeback/cancellation), revoke or adjust credits/entitlements.

**Trigger**
- You begin handling refunds regularly or see disputes.

---

### D) Consider moving expiration into the database (optional evolution)
Right now, expiration lives in the JWT (`expiresAt`). That's acceptable, but DB-based expiration enables:
- manual revocation
- support-driven changes
- better auditability

**Trigger**
- You need support tools ("extend customer by 30 days").
- You want revocation without waiting for token expiry.

---

### E) Consider CSP tightening (Helmet config)
Default Helmet is fine for now. CSP tightening can reduce XSS risk, but it can break third-party scripts if done too aggressively.

**Trigger**
- You embed more third-party scripts (analytics, ads, widgets).
- You want stronger XSS mitigation once the front-end stabilizes.

---

### F) Dependency and supply-chain hygiene
**What to add**
- Routine dependency audits (npm audit, GitHub Dependabot).
- Pin critical dependencies and watch advisories.

**Trigger**
- Larger user base / more revenue exposure.
- You start shipping frequently.

---

### G) Session/account model evolution
If you later move from "token-based paid access" to "account-based subscriptions":
- tie entitlements to userId
- store subscription state and expiration in DB
- use refresh tokens and session rotation

**Trigger**
- Users demand login, multi-device restore, or seat-based billing.

---

### H) Input Validation & Sanitization
**What to add**
- Validate all user inputs at API boundaries
- Sanitize file uploads (size limits, type checking, virus scanning)
- Implement request size limits for file uploads
- Add SQL injection protection (already provided by Drizzle ORM)

**Trigger**
- Adding user-generated content features
- File upload capabilities
- Custom form inputs beyond current payment flow

---

### I) Backup & Disaster Recovery
**What to add**
- Automated database backups with retention policy
- Documented recovery procedures
- Cross-region backup replication for critical data
- Test restore procedures regularly

**Trigger**
- Production data volume increases
- Customer data becomes business-critical
- Regulatory requirements for data retention

---

### J) API Authentication for External Access
**What to add**
- API key management for programmatic access
- Rate limiting per API key
- Usage analytics and billing integration
- API documentation and versioning

**Trigger**
- Third-party integrations request API access
- Mobile app development
- B2B partnerships requiring API access

---

### K) Compliance & Privacy
**What to add**
- GDPR/CCPA compliance checklist
- Data retention policies
- Privacy policy updates
- Cookie consent management
- Right to deletion implementation

**Trigger**
- International user expansion
- Data processing scale increases
- Legal/compliance requirements

---

### L) Infrastructure Security
**What to add**
- VPC/network segmentation
- Database access controls (IP whitelisting)
- SSL/TLS certificate management
- Container security scanning
- Infrastructure as code (IaC) security reviews

**Trigger**
- Scaling to multiple environments
- Adding microservices architecture
- Team expansion with devops needs

---

## 5) Operational Checklist (Ongoing)

Run these checks on every meaningful deployment:

- Confirm `NODE_ENV=production` in Railway.
- Confirm required env vars are present (JWT secret, Supabase keys, Stripe keys).
- Confirm webhook signing secret is correct.
- Confirm `/api/create-checkout-session` is rate-limited.
- Confirm `/api/webhook` is not rate-limited.
- Confirm debug routes return 404 in production.
- Confirm build passes (`npm run build`).
- Spot-check staging: expired token → no paid access, falls back to free limits.
- Verify SSL certificates are valid and not expiring soon.
- Check database connection pool limits and timeouts.
- Confirm error monitoring/alerting is configured.
- Validate CORS settings are appropriate for production domains.
- Test backup/restore procedures if implemented.
- Review recent dependency audit reports for critical vulnerabilities.

---

## 6) "If This Happens, Do That" Reference

- If users report "paid access ended early":
  - verify `expiresAt` in token payload and durationDays config
  - verify server time and timezone
  - verify cookie persistence

- If users report "I paid but I didn't get credits":
  - verify webhook deliveries in Stripe
  - verify checkout-status grant logic runs and purchase is updated with tokenId
  - check idempotency logic didn't block incorrectly

- If you see spikes in 503 usage limiter unavailable:
  - DB connectivity issue or pool exhaustion
  - treat as production incident (because staging is blocked in fail-closed mode)

- If Stripe session spam occurs:
  - lower max rate or add per-user/per-fingerprint throttles
  - consider CAPTCHA on upgrade flow (if abuse persists)

- If database connection errors increase:
  - check connection pool configuration
  - verify database instance sizing
  - review slow query logs for optimization opportunities

- If SSL certificate warnings appear:
  - check certificate expiration dates
  - verify certificate chain is complete
  - confirm proper TLS configuration on load balancer

- If CORS errors occur in production:
  - review allowed origins in CORS configuration
  - verify frontend domain matches production settings
  - check for mixed content (HTTP vs HTTPS) issues

- If dependency vulnerabilities are detected:
  - assess severity and exploitability
  - plan immediate patching for critical issues
  - test patches in staging before production deployment

- If webhook processing fails:
  - verify Stripe webhook endpoint is accessible
  - check webhook signature verification
  - review webhook retry logs in Stripe dashboard

- If performance degrades:
  - monitor database query performance
  - check OpenAI API rate limits and response times
  - review application memory and CPU usage

---

## 7) Security Metrics & Monitoring

### Key Security Metrics to Track
- **Authentication failures**: Rate of invalid/expired token attempts
- **Rate limit triggers**: 429 responses by endpoint and IP
- **Webhook failures**: Signature verification failures and processing errors
- **Database errors**: Connection failures and timeout rates
- **Payment anomalies**: Failed checkout sessions and refund patterns
- **IP abuse patterns**: Unusual usage patterns from single IPs

### Alerting Thresholds (Recommended)
- > 10 authentication failures per minute from same IP
- > 50 rate limit violations per hour globally
- > 5 consecutive webhook processing failures
- Database error rate > 1% of total requests
- Checkout failure rate > 5% over 1-hour window

### Monitoring Tools Integration
- **Application logs**: Structured logging with correlation IDs
- **Infrastructure metrics**: CPU, memory, disk usage alerts
- **Database monitoring**: Query performance, connection pool health
- **External API monitoring**: OpenAI and Stripe API response times
- **SSL certificate monitoring**: Expiration date alerts (30 days prior)

### Security Incident Response
1. **Detection**: Automated alerts trigger on threshold breaches
2. **Assessment**: Security team evaluates impact and scope
3. **Containment**: Apply temporary mitigations (rate limits, IP blocks)
4. **Resolution**: Address root cause and implement permanent fixes
5. **Post-mortem**: Document lessons learned and update procedures

---

## 8) Current Status

Security hardening and expiration enforcement have been implemented, verified by audit, and compiled successfully. This is an appropriate baseline for production with paying customers, with a clear roadmap of what to add when growth or new features introduce new risk.

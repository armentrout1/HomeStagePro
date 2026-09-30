# RoomStagerPro access, image editing, and SEO release

Status: implementation committed in draft PR #1; local checks and GitHub CI passed. Production has not been deployed. Email delivery and image-quality acceptance remain release gates.

## Behavior

Customers receive a private reusable pack link after a paid Stripe checkout. Opening it sets an HTTP-only cookie on that device; all devices share the database credit balance. Reopening never adds credits or extends the original expiry. Quick/Value packs remain valid for 365 days and Pro Pack for 30 days. These are one-time purchases, with existing prices unchanged. Legacy purchase records can be adopted without granting credits again.

Images use the Images Edit API (`gpt-image-2.5-sunburst`, override `STAGING_IMAGE_MODEL`) with furnish, replace, and remove modes. The brush determines editable pixels. Fully protected pixels are restored from the resized input photograph, then `gpt-6-luna` reviews the result for obvious failures. Pixels inside the selection can still change incorrectly; customers must review every image. Client uploads are normalized to JPEG with a maximum dimension of 1536 pixels.

Generation reserves a credit atomically and runs as a persisted job. Duplicate request IDs do not invoke the model twice. Success stores private object paths, and image URLs are renewed on demand. Failure restores the credit once. Process interruptions become failed/refunded jobs after 15 minutes; jobs are not automatically replayed at additional model cost. My access shows the latest 30 jobs for the currently open pack.

Nineteen public pages are prerendered with route-specific initial metadata. Private pages are noindex. Unknown routes return 404. The initial page no longer relies on Google executing JavaScript to find its main content. Purchase/staging analytics are added with sensitive URL fragments and queries excluded from page-location events.

## Configuration required before launch

- Keep the existing OPENAI_API_KEY, JWT_SECRET, Stripe keys, DATABASE_URL and Supabase settings. Do not rotate JWT_SECRET as part of this rollout: it signs legacy cookies and derives reusable links.
- PUBLIC_APP_URL must be the environment's correct public HTTPS origin; production is https://roomstagerpro.com. It controls both checkout return URLs and emailed links.
- Add RESEND_API_KEY and ACCESS_EMAIL_FROM for a verified sending domain, or adapt the small delivery adapter to the owner's existing provider. No provider is currently configured and no real access email has been sent. Do not paste keys into a PR or chat.
- Optional explicit model settings: STAGING_IMAGE_MODEL=gpt-image-2.5-sunburst and STAGING_REVIEW_MODEL=gpt-6-luna. Both were tested using the existing OpenAI key.
- Railway pre-deploy command: `node dist/migrate-access.js`.
- Railway healthcheck path: `/api/health`. It returns 503 when required tables are absent or the DB is unreachable.
- Runtime Docker image now uses Node 24. A Docker daemon was not available locally; the production container build must be checked in staging.

## Migration and rollout order

1. Review the complete PR against main. It includes nine earlier phase1-staging-stability commits already in the staging branch, plus this release. Their relevant masking work is retained; paid generation no longer honors the old free/IP bypass.
2. Confirm staging has a separate database, private storage/test prefixes, Stripe test keys and a test-recipient email setup before sending test traffic. Do not infer isolation from an environment name.
3. Back up the target database. Apply the additive `migrations/0002_access_and_jobs.sql` through the compiled migration command before starting new app instances. It adds access_grants, access_email_outbox and staging_jobs without resetting customer balances. It was tested twice against an isolated local database.
4. Deploy the reviewed branch to staging. Verify the container build and healthcheck; perform Stripe test checkout, webhook retry, real inbox delivery, cross-device link opening, generation, reload recovery, and saved download. Verify sender SPF/DKIM and inspect delivery/bounce status in the email provider.
5. Obtain deployment confirmation, then promote the same tested commit to production with the same pre-deploy migration and correct production settings. Do not merge first if main auto-deploys before the migration/settings are ready.
6. Recheck public HTML, payment activation, generation, email recovery, privacy headers and browser errors on the production domain. Confirm analytics events in the real analytics account. Submit the existing sitemap and request indexing for the updated priority pages in Search Console after deployment.

Railway's accept_deploy tool explicitly requires the user's confirmation to deploy. No Railway deployment or production database migration was performed during implementation.

## Validation completed

- `npm run check`: passed. GitHub Actions verify job also passed on commit 2cb4eba (run 36759597833).
- `npm test` with an isolated loopback Postgres database: 13 passing tests (12 scenarios and parent test). Covers 20 repeated checkout fulfillments, legacy adoption, two-device link exchange, exact protected RGB pixels, duplicate requests, failed/stale refunds, last-credit concurrency, enumeration-safe recovery, input rejection, signed Stripe webhook retries, revocation and email provider retries/idempotency.
- `npm run build`: passed; 19 public pages prerendered.
- Built migration applied twice to the isolated local database: passed.
- HTTP checks: all 19 public routes plus three private routes and an unknown route; unique initial title/description/robots/canonical, public H1 content, private noindex, 404, DB health, cross-site POST rejection and no-store API responses passed.
- Chrome desktop and 390px responsive checks: home/pricing/access pages, upload reaching edit controls, recovery form, navigation, no horizontal overflow on sampled pages. No observed browser console errors. Physical iPhone/Android testing is still outstanding; HEIC requires JPEG export.
- Real furnish pipeline: 41.2 seconds; real removal pipeline: 34.5 seconds. The replacement path also completed in 37.6 seconds. These initially included model editing, protected-pixel restoration, automated review, private storage and signed download. The reviewer rejected an earlier clipped-furniture sample. Visual inspection identified a blurred floor in the furnish/replacement sample despite the initial automated approval. Editing instructions and the reviewer were tightened; the updated reviewer correctly rejects that known defective sample as surface_changed. Treat the successful initial API paths as plumbing tests, not quality approvals. Two additional Sunburst furnish attempts and a gpt-image-1.5 comparison were rejected by the stricter quality gate. A diagnostic Sunburst attempt confirmed surface_changed. This is a release blocker, not an acceptable success rate. This is a small living-room sample, not a broad quality benchmark.
- `npm audit --omit=dev`: zero reported vulnerabilities. Full dependency audit still reports development/build-tool advisories; those major-version upgrades were not bundled into this release.
- No real checkout was charged and no customer email was sent during these tests. Stripe route tests used signed synthetic events and a disposable database; email tests used a mocked provider.

## Operational limits and follow-up

Email delivery has a database outbox, 5-minute leases, retries with an idempotency key and a 20-attempt ceiling. Monitor exhausted and pending rows plus the provider's delivered/bounced status; API acceptance is not proof of inbox delivery. Jobs and originals from rejected generations can accumulate in private storage; add a reviewed retention/cleanup policy later, without deleting customer images during rollout. Download access currently follows the pack expiry; customers should save completed images before expiry.

The reusable URL is a bearer credential: anyone it is forwarded to can use the pack until expiry or revocation. It is hashed at rest, placed in the URL fragment, removed immediately by the access page, and exchanged for an HTTP-only cookie. Rate limits are per process; shared limits would be needed for a multi-instance rollout. Stronger review reduces obvious defects but cannot certify MLS compliance or guarantee architectural accuracy inside the editable mask.

Keep current prices initially; compare indexed pages, non-branded impressions, landing-page clicks, checkout starts, paid conversions and repeat usage after launch. Publish real customer examples and improve existing relevant pages before scaling acquisition spend. No ranking or customer-volume improvement has yet been measured.


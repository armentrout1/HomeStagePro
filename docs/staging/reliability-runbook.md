# September 30 reliability rollout

Apply the additive `0003_reliability.sql` migration through `dist/migrate-access.js` before starting this release. Existing rows, credits and saved photos are retained. Roll out to staging first.

## Configuration

- `STAGING_DURABLE_QUEUE=true` enables persisted inputs and the worker. Default off retains the legacy in-process path. Do not disable the flag while queued work remains.
- `STAGING_CONCURRENCY` defaults to 2 and is clamped to 1–4. PostgreSQL serializes claims across replicas. Monitor memory, provider latency and queue age before increasing it.
- `PUBLIC_APP_URL` must be the exact environment origin. Its hash separates new private storage paths across environments. Do not change it while jobs are pending.
- `RESEND_WEBHOOK_SECRET` authenticates `/api/email-webhook`. Subscribe to sent, delivered, delivery_delayed, bounced, complained, failed and suppressed events. Keep the secret in service settings, never source control.
- Extend the existing signed Stripe endpoint to receive `refund.created`, `refund.updated`, `refund.failed`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.updated`, and `charge.dispute.closed`, preserving its checkout subscriptions.

## Recovery and retention

Accepted requests reserve a credit and persist the source photo and selection privately. A worker records a lease before taking the job. An expired lease before the paid provider boundary can be retried up to three claims. An expired lease after that boundary is ambiguous: fail the job and restore its credit once, without automatically repeating the paid call. Queued work older than 30 minutes fails with a credit restoration. Heartbeats run every 30 seconds with a two-minute lease.

Maintenance removes only the temporary inputs explicitly recorded for terminal jobs in this environment. Original and staged saved images remain private and retained. This is not a customer-photo deletion feature or a general orphan sweep. Upload failure between private storage and database commit can leave an orphan; an inventory/dry-run cleanup workflow remains to be implemented.

The current database pool and global HTTP parser are unchanged. Input persistence occurs during credit reservation; sustained concurrent upload load still needs a staging load test and a narrower performance follow-up.

## Billing rules

Refund/dispute events are verified, deduplicated and reconciled by payment intent. Partial refunds reduce a pack's granted credits proportionally, rounding remaining credits down. Already used credits remain used. Pending refunds reserve the corresponding credit reduction; failed/canceled refunds restore it. An open or lost dispute blocks the pack; a won/closed-warning dispute restores its undisputed entitlement, accounting for refunds. No cash refund is initiated by this code. Manual revocation remains independent.

Legacy balances that cannot accommodate a reduction return an error for manual reconciliation instead of silently changing unrelated credits. Monitor webhook failures and reconcile the specific payment before replaying them.

## Delivery and verification

Provider acceptance is distinct from delivery. Query `access_email_delivery` by outbox ID or provider ID; do not publish bearer access links or recipient information in logs. Signed events may arrive before the send response and are reconciled afterward. Permanent failures outrank delivery, and older sent events cannot regress a later delivery.

Before production: verify migration/health, same-link access on separate devices, real recovery-email delivery, queued generation and terminal input cleanup, credit accounting, fresh download URLs and mobile behavior. The local regression suite uses an isolated localhost database; never run it against a deployment database. The browser regression harness uses mock payment/job APIs and therefore does not prove a real checkout.

## Image benchmark limitation

The generator/reviewer now receive the approved orange selection guide. Living-room furnishing and removal fixtures passed with zero modified protected pixels. Two bedroom selection attempts were rejected for cut-off furniture. Keep the quality gate enabled. A broader representative benchmark and physical-device checks remain release evidence to collect.

## Saved-image management

Apply additive migration 0004_image_history before starting this release; health checks require it. New accepted results receive a metadata-free WebP preview no larger than 384×256. History signs previews in one batch with a five-minute expiry; older rows without previews remain usable with a placeholder. No bulk backfill is automatic.

Trash hides completed/failed attempts from normal history and prevents new image links. It does not erase objects or revoke previously issued links. Restore is available until permanent deletion starts. Explicit permanent deletion validates the active pack, job ownership, this environment's storage namespace and exact job filenames; it removes the completed attempt's original/result/preview and any known temporary inputs. Credit balances and the request-id ledger are retained. A storage failure leaves deletion pending and blocks restore; retrying removes the same paths. Older storage layouts and incomplete/ambiguous attempts require support review, rather than guessing which files to delete.

Read-only orphan inventory: with the target environment's existing DATABASE_URL, Supabase credentials and PUBLIC_APP_URL, run `node --import tsx scripts/storage-inventory.ts --origin=https://YOUR-EXACT-APP-ORIGIN --output=temp/storage-inventory.json`. The script never deletes or changes data, restricts traversal to the configured environment prefix, excludes recent files, and reports incomplete scans at 10,000 files/jobs or 500 folders. An inventory candidate is not authorization for removal. Inspect it before planning any cleanup; no general orphan purge is enabled.

Local coverage includes another pack's access, processing jobs, confirmed deletion, partial failure/retry, restore exclusion, unchanged credits, path validation, compact previews, and mobile confirmation/cancellation.

-- Additive Railway Postgres migration; customer images and balances are retained.
BEGIN;
CREATE TABLE IF NOT EXISTS staging_work (
  job_id uuid PRIMARY KEY REFERENCES staging_jobs(id), input_path text NOT NULL,
  phase text NOT NULL DEFAULT 'queued' CHECK (phase IN ('queued','running','done','failed')),
  lease uuid, lease_until timestamptz, provider_started_at timestamptz,
  attempts integer NOT NULL DEFAULT 0, room_type text NOT NULL, edit_mode text NOT NULL, has_mask boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), input_deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS staging_work_claim_idx ON staging_work(phase,created_at);
CREATE INDEX IF NOT EXISTS staging_jobs_history_idx ON staging_jobs(token_id,created_at DESC,id DESC);
CREATE TABLE IF NOT EXISTS access_email_delivery (
  outbox_id uuid PRIMARY KEY REFERENCES access_email_outbox(id), provider_id text UNIQUE,
  status text NOT NULL DEFAULT 'queued', last_error text, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS access_email_events (
  event_id text PRIMARY KEY, provider_id text NOT NULL, event_type text NOT NULL,
  occurred_at timestamptz NOT NULL, received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS access_email_events_provider_idx ON access_email_events(provider_id,occurred_at);
CREATE TABLE IF NOT EXISTS payment_adjustments (
  payment_intent_id text PRIMARY KEY, refunded_cents integer NOT NULL DEFAULT 0,
  disputed boolean NOT NULL DEFAULT false, dispute_event_at bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS billing_events (
  event_id text PRIMARY KEY, payment_intent_id text NOT NULL, kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS billing_refunds (
  refund_id text PRIMARY KEY, payment_intent_id text NOT NULL, amount_cents integer NOT NULL,
  status text NOT NULL, event_created bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS billing_refunds_payment_idx ON billing_refunds(payment_intent_id);
ALTER TABLE access_grants ADD COLUMN IF NOT EXISTS payment_intent_id text;
ALTER TABLE access_grants ADD COLUMN IF NOT EXISTS billing_blocked boolean NOT NULL DEFAULT false;
ALTER TABLE access_grants ADD COLUMN IF NOT EXISTS billing_credit_reduction integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS access_grants_payment_idx ON access_grants(payment_intent_id);
COMMIT;

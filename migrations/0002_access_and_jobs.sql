-- Additive migration. Existing entitlement balances and purchases are retained.
BEGIN;
CREATE TABLE IF NOT EXISTS access_grants (
  session_id text PRIMARY KEY, token_id text NOT NULL, plan_id text NOT NULL,
  email text, link_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL,
  revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS access_grants_email_idx ON access_grants(email);
CREATE TABLE IF NOT EXISTS access_email_outbox (
  id uuid PRIMARY KEY, session_id text NOT NULL REFERENCES access_grants(session_id),
  attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS access_email_pending_idx ON access_email_outbox(available_at) WHERE sent_at IS NULL;
CREATE TABLE IF NOT EXISTS staging_jobs (
  id uuid PRIMARY KEY, token_id text NOT NULL, input_hash text NOT NULL,
  state text NOT NULL CHECK(state IN ('processing','completed','failed')),
  result jsonb, error text, created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS staging_jobs_owner_idx ON staging_jobs(token_id,created_at DESC);
COMMIT;

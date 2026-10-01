-- Additive migration for Railway Postgres. No stored files are removed by migration.
BEGIN;
ALTER TABLE staging_jobs ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE staging_jobs ADD COLUMN IF NOT EXISTS purge_started_at timestamptz;
ALTER TABLE staging_jobs ADD COLUMN IF NOT EXISTS purged_at timestamptz;
CREATE INDEX IF NOT EXISTS staging_jobs_visible_history_idx ON staging_jobs(token_id,created_at DESC,id DESC) WHERE deleted_at IS NULL AND purged_at IS NULL;
CREATE INDEX IF NOT EXISTS staging_jobs_trash_history_idx ON staging_jobs(token_id,created_at DESC,id DESC) WHERE deleted_at IS NOT NULL AND purged_at IS NULL;
COMMIT;

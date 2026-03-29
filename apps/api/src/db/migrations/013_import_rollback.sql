-- 013: Import Rollback Support
-- Adds pre-import snapshot and rollback tracking fields to import_jobs table

ALTER TABLE import_jobs ADD COLUMN pre_import_snapshot JSONB;
ALTER TABLE import_jobs ADD COLUMN is_rolled_back BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE import_jobs ADD COLUMN rolled_back_at TIMESTAMPTZ;
ALTER TABLE import_jobs ADD COLUMN rolled_back_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL;

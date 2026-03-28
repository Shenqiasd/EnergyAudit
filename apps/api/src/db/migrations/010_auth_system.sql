-- 010_auth_system.sql
-- Add authentication columns to user_accounts table

ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS refresh_token text;
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

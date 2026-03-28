-- Migration 011: Report version management, enterprise profile snapshot support, data return enhancement

-- Add returnedBy and returnedAt columns to data_records
ALTER TABLE data_records ADD COLUMN returned_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL;
ALTER TABLE data_records ADD COLUMN returned_at TIMESTAMPTZ;

-- Add isActive column to report_versions for active version tracking
ALTER TABLE report_versions ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false;

-- Add report_version_id to report_sections for version-specific snapshots
ALTER TABLE report_sections ADD COLUMN report_version_id TEXT REFERENCES report_versions(id) ON DELETE CASCADE;

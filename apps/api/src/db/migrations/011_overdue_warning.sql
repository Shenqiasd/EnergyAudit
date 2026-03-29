-- 011: Overdue Warning System
-- Add isOverdue to audit_batches for deadline tracking

ALTER TABLE audit_batches ADD COLUMN is_overdue BOOLEAN NOT NULL DEFAULT FALSE;

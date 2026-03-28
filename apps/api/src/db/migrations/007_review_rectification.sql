-- Migration: 007_review_rectification
-- Creates tables for review tasks, scores, issues, rectification tasks, and progress

-- Review Tasks
CREATE TABLE IF NOT EXISTS review_tasks (
  id TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL REFERENCES audit_projects(id) ON DELETE CASCADE,
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending_assignment',
  conclusion TEXT,
  total_score NUMERIC,
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Review Scores
CREATE TABLE IF NOT EXISTS review_scores (
  id TEXT PRIMARY KEY,
  review_task_id TEXT NOT NULL REFERENCES review_tasks(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL,
  comment TEXT
);

-- Review Issues
CREATE TABLE IF NOT EXISTS review_issues (
  id TEXT PRIMARY KEY,
  review_task_id TEXT NOT NULL REFERENCES review_tasks(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  module_code TEXT,
  field_code TEXT,
  suggestion TEXT,
  requires_rectification BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rectification Tasks
CREATE TABLE IF NOT EXISTS rectification_tasks (
  id TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL REFERENCES audit_projects(id) ON DELETE CASCADE,
  review_task_id TEXT NOT NULL REFERENCES review_tasks(id) ON DELETE CASCADE,
  source_issue_id TEXT REFERENCES review_issues(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending_issue',
  deadline TIMESTAMPTZ,
  is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rectification Progress
CREATE TABLE IF NOT EXISTS rectification_progress (
  id TEXT PRIMARY KEY,
  rectification_task_id TEXT NOT NULL REFERENCES rectification_tasks(id) ON DELETE CASCADE,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL,
  attachment_ids TEXT,
  recorded_by TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_review_tasks_audit_project ON review_tasks(audit_project_id);
CREATE INDEX IF NOT EXISTS idx_review_tasks_reviewer ON review_tasks(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_scores_review_task ON review_scores(review_task_id);
CREATE INDEX IF NOT EXISTS idx_review_issues_review_task ON review_issues(review_task_id);
CREATE INDEX IF NOT EXISTS idx_rectification_tasks_audit_project ON rectification_tasks(audit_project_id);
CREATE INDEX IF NOT EXISTS idx_rectification_tasks_review_task ON rectification_tasks(review_task_id);
CREATE INDEX IF NOT EXISTS idx_rectification_tasks_source_issue ON rectification_tasks(source_issue_id);
CREATE INDEX IF NOT EXISTS idx_rectification_progress_task ON rectification_progress(rectification_task_id);

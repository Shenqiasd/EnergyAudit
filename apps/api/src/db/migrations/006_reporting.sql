-- 006_reporting.sql
-- New tables for reporting, chart configs, benchmarks, and version tracking.
-- Note: calculation_snapshots, chart_outputs, reports already exist from prior migrations.

-- Report versions - version tracking for reports
CREATE TABLE IF NOT EXISTS report_versions (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  version_type TEXT NOT NULL, -- system_draft / enterprise_revision / final
  version_number INTEGER NOT NULL,
  file_url TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_report_versions_report ON report_versions(report_id);

-- Report sections - report section content
CREATE TABLE IF NOT EXISTS report_sections (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  section_code TEXT NOT NULL,
  section_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  content TEXT,
  charts JSONB
);
CREATE INDEX IF NOT EXISTS idx_report_sections_report ON report_sections(report_id);

-- Chart configurations
CREATE TABLE IF NOT EXISTS chart_configs (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  chart_type TEXT NOT NULL, -- pie / bar / line / sankey / table
  module_code TEXT,
  metrics JSONB,
  dimensions JSONB
);

-- Benchmark values - industry benchmark data
CREATE TABLE IF NOT EXISTS benchmark_values (
  id TEXT PRIMARY KEY,
  industry_code TEXT NOT NULL,
  indicator_code TEXT NOT NULL,
  benchmark_value NUMERIC NOT NULL,
  year INTEGER,
  source TEXT
);
CREATE INDEX IF NOT EXISTS idx_benchmark_values_industry ON benchmark_values(industry_code);
CREATE INDEX IF NOT EXISTS idx_benchmark_values_indicator ON benchmark_values(indicator_code);

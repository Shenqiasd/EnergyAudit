-- Add business_type to audit_batches
ALTER TABLE audit_batches ADD COLUMN business_type TEXT NOT NULL DEFAULT 'energy_audit';
CREATE INDEX idx_audit_batches_business_type ON audit_batches(business_type);

-- Add business_type to audit_projects
ALTER TABLE audit_projects ADD COLUMN business_type TEXT NOT NULL DEFAULT 'energy_audit';
CREATE INDEX idx_audit_projects_business_type ON audit_projects(business_type);

-- Module visibility configuration per business type
CREATE TABLE module_visibility (
  id TEXT PRIMARY KEY,
  business_type TEXT NOT NULL,
  module_code TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_type, module_code)
);
CREATE INDEX idx_module_visibility_business_type ON module_visibility(business_type);

-- Template routing by business type
CREATE TABLE business_type_config (
  id TEXT PRIMARY KEY,
  business_type TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  default_template_id TEXT,
  report_template_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default business types
INSERT INTO business_type_config (id, business_type, label, description, is_active) VALUES
  ('bt_energy_audit', 'energy_audit', '能源审计', '全市重点用能企业能源审计', true),
  ('bt_energy_diagnosis', 'energy_diagnosis', '节能诊断', '节能诊断评估', true);

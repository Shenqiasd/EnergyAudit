-- Config Override Engine: Enterprise-level config overrides
CREATE TABLE config_overrides (
  id TEXT PRIMARY KEY,
  scope_type TEXT NOT NULL, -- 'platform' | 'batch_template' | 'enterprise_type' | 'enterprise'
  scope_id TEXT, -- null for platform, batchId for batch_template, industryCode for enterprise_type, enterpriseId for enterprise
  target_type TEXT NOT NULL, -- 'module' | 'field' | 'validation_rule'
  target_code TEXT NOT NULL, -- moduleCode or fieldCode or ruleCode
  config_json JSONB NOT NULL, -- the override values
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT REFERENCES user_accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(scope_type, scope_id, target_type, target_code)
);

-- Partial unique index for NULL scope_id (PostgreSQL treats NULLs as distinct in UNIQUE)
CREATE UNIQUE INDEX idx_config_overrides_unique_null_scope
  ON config_overrides(scope_type, target_type, target_code)
  WHERE scope_id IS NULL;

CREATE INDEX idx_config_overrides_scope ON config_overrides(scope_type, scope_id);
CREATE INDEX idx_config_overrides_target ON config_overrides(target_type, target_code);

-- Controlled Exception Mechanism: Validation exceptions
CREATE TABLE validation_exceptions (
  id TEXT PRIMARY KEY,
  data_record_id TEXT NOT NULL REFERENCES data_records(id) ON DELETE CASCADE,
  validation_result_id TEXT REFERENCES validation_results(id) ON DELETE SET NULL,
  rule_code TEXT, -- stable key to re-link after re-validation
  explanation TEXT NOT NULL,
  submitted_by TEXT NOT NULL REFERENCES user_accounts(id),
  approved_by TEXT REFERENCES user_accounts(id),
  approval_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_validation_exceptions_record ON validation_exceptions(data_record_id);
CREATE INDEX idx_validation_exceptions_status ON validation_exceptions(approval_status);

-- 005_data_collection.sql
-- Data Collection Framework: module config, field definitions, validation/calculation rules, collaborative locks

-- ==================== Module Configuration ====================
CREATE TABLE IF NOT EXISTS data_modules (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  field_schema JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_data_modules_category ON data_modules(category);
CREATE INDEX idx_data_modules_code ON data_modules(code);

-- ==================== Field Definitions ====================
CREATE TABLE IF NOT EXISTS data_fields (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES data_modules(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  constraints JSONB,
  display_rules JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module_id, code)
);

CREATE INDEX idx_data_fields_module ON data_fields(module_id);

-- ==================== Validation Rules ====================
CREATE TABLE IF NOT EXISTS validation_rules (
  id TEXT PRIMARY KEY,
  module_code TEXT NOT NULL,
  rule_code TEXT NOT NULL UNIQUE,
  layer INTEGER NOT NULL DEFAULT 1,
  severity TEXT NOT NULL DEFAULT 'error',
  expression TEXT NOT NULL,
  message TEXT NOT NULL,
  field_codes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_validation_rules_module ON validation_rules(module_code);
CREATE INDEX idx_validation_rules_layer ON validation_rules(layer);

-- ==================== Calculation Rules ====================
CREATE TABLE IF NOT EXISTS calculation_rules (
  id TEXT PRIMARY KEY,
  module_code TEXT NOT NULL,
  rule_code TEXT NOT NULL UNIQUE,
  expression TEXT NOT NULL,
  dependencies JSONB,
  output_field_code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calculation_rules_module ON calculation_rules(module_code);

-- ==================== Collaborative Locks ====================
CREATE TABLE IF NOT EXISTS data_locks (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(record_id)
);

CREATE INDEX idx_data_locks_record ON data_locks(record_id);
CREATE INDEX idx_data_locks_expires ON data_locks(expires_at);

-- ==================== Seed 24 Filing Modules ====================
INSERT INTO data_modules (id, code, name, category, sort_order, is_enabled) VALUES
  ('mod_01', 'enterprise-profile', '企业概况与目标', '基本信息', 1, true),
  ('mod_02', 'business-indicators', '经营与技术指标', '基本信息', 2, true),
  ('mod_03', 'equipment-management', '设备与计量管理', '基本信息', 3, true),
  ('mod_04', 'energy-efficiency', '能效与对标分析', '基本信息', 4, true),
  ('mod_05', 'energy-consumption', '能源消费总量', '能源数据', 5, true),
  ('mod_06', 'energy-balance', '能源平衡', '能源数据', 6, true),
  ('mod_07', 'product-energy', '产品单耗', '能源数据', 7, true),
  ('mod_08', 'carbon-emission', '碳排放核算', '能源数据', 8, true),
  ('mod_09', 'energy-saving-measures', '节能措施', '节能管理', 9, true),
  ('mod_10', 'energy-flow', '能源流程', '节能管理', 10, true),
  ('mod_11', 'water-consumption', '用水情况', '分项数据', 11, true),
  ('mod_12', 'steam-consumption', '蒸汽消耗', '分项数据', 12, true),
  ('mod_13', 'electricity-detail', '用电明细', '分项数据', 13, true),
  ('mod_14', 'fuel-detail', '燃料明细', '分项数据', 14, true),
  ('mod_15', 'heat-consumption', '热力消耗', '分项数据', 15, true),
  ('mod_16', 'renewable-energy', '可再生能源', '分项数据', 16, true),
  ('mod_17', 'energy-storage', '储能设施', '设备设施', 17, true),
  ('mod_18', 'cogeneration', '热电联产', '设备设施', 18, true),
  ('mod_19', 'major-equipment', '重点设备', '设备设施', 19, true),
  ('mod_20', 'metering-config', '计量器具配置', '设备设施', 20, true),
  ('mod_21', 'energy-management', '能源管理体系', '管理体系', 21, true),
  ('mod_22', 'energy-audit-history', '历史审计情况', '管理体系', 22, true),
  ('mod_23', 'rectification-plan', '整改计划', '管理体系', 23, true),
  ('mod_24', 'appendix-data', '附件资料', '管理体系', 24, true)
ON CONFLICT (code) DO NOTHING;

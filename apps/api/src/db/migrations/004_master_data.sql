-- Migration 004: Master Data & Configuration Center
-- Adds config_snapshots table and indexes for master data definition tables

-- ==================== Config Snapshots ====================
-- Binds configuration state to a project at creation time
CREATE TABLE IF NOT EXISTS config_snapshots (
    id TEXT PRIMARY KEY,
    audit_project_id TEXT NOT NULL REFERENCES audit_projects(id) ON DELETE CASCADE,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    energy_definitions_snapshot TEXT NOT NULL DEFAULT '[]',
    product_definitions_snapshot TEXT NOT NULL DEFAULT '[]',
    unit_definitions_snapshot TEXT NOT NULL DEFAULT '[]',
    carbon_factors_snapshot TEXT NOT NULL DEFAULT '[]',
    snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_config_snapshots_project ON config_snapshots(audit_project_id);
CREATE INDEX IF NOT EXISTS idx_config_snapshots_enterprise ON config_snapshots(enterprise_id);

-- ==================== Additional Indexes ====================
-- Indexes on enterprise_id for definition tables to speed up enterprise-scoped queries
CREATE INDEX IF NOT EXISTS idx_energy_definitions_enterprise ON energy_definitions(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_product_definitions_enterprise ON product_definitions(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_unit_definitions_enterprise ON unit_definitions(enterprise_id);

-- Index on carbon_emission_factors for year-based queries
CREATE INDEX IF NOT EXISTS idx_carbon_emission_factors_year ON carbon_emission_factors(applicable_year);
CREATE INDEX IF NOT EXISTS idx_carbon_emission_factors_energy_code ON carbon_emission_factors(energy_code);

-- Index on dictionaries for category-based queries
CREATE INDEX IF NOT EXISTS idx_dictionaries_category ON dictionaries(category);
CREATE INDEX IF NOT EXISTS idx_dictionaries_parent_code ON dictionaries(parent_code);

-- ==================== Seed Data ====================
-- Common dictionary categories

-- 行业分类 (Industry Classification)
INSERT INTO dictionaries (id, category, code, name, parent_code, sort_order, is_active) VALUES
    ('dict-ind-001', 'industry', 'B', '采矿业', NULL, 1, true),
    ('dict-ind-002', 'industry', 'C', '制造业', NULL, 2, true),
    ('dict-ind-003', 'industry', 'D', '电力、热力、燃气及水生产和供应业', NULL, 3, true),
    ('dict-ind-004', 'industry', 'C13', '农副食品加工业', 'C', 1, true),
    ('dict-ind-005', 'industry', 'C17', '纺织业', 'C', 2, true),
    ('dict-ind-006', 'industry', 'C22', '造纸和纸制品业', 'C', 3, true),
    ('dict-ind-007', 'industry', 'C25', '石油、煤炭及其他燃料加工业', 'C', 4, true),
    ('dict-ind-008', 'industry', 'C26', '化学原料和化学制品制造业', 'C', 5, true),
    ('dict-ind-009', 'industry', 'C30', '非金属矿物制品业', 'C', 6, true),
    ('dict-ind-010', 'industry', 'C31', '黑色金属冶炼和压延加工业', 'C', 7, true),
    ('dict-ind-011', 'industry', 'C32', '有色金属冶炼和压延加工业', 'C', 8, true),
    ('dict-ind-012', 'industry', 'D44', '电力、热力生产和供应业', 'D', 1, true)
ON CONFLICT DO NOTHING;

-- 能源品种分类 (Energy Type Classification)
INSERT INTO dictionaries (id, category, code, name, parent_code, sort_order, is_active) VALUES
    ('dict-eng-001', 'energy_type', 'primary', '一次能源', NULL, 1, true),
    ('dict-eng-002', 'energy_type', 'secondary', '二次能源', NULL, 2, true),
    ('dict-eng-003', 'energy_type', 'coal', '原煤', 'primary', 1, true),
    ('dict-eng-004', 'energy_type', 'crude_oil', '原油', 'primary', 2, true),
    ('dict-eng-005', 'energy_type', 'natural_gas', '天然气', 'primary', 3, true),
    ('dict-eng-006', 'energy_type', 'electricity', '电力', 'secondary', 1, true),
    ('dict-eng-007', 'energy_type', 'heat', '热力', 'secondary', 2, true),
    ('dict-eng-008', 'energy_type', 'gasoline', '汽油', 'secondary', 3, true),
    ('dict-eng-009', 'energy_type', 'diesel', '柴油', 'secondary', 4, true),
    ('dict-eng-010', 'energy_type', 'lpg', '液化石油气', 'secondary', 5, true)
ON CONFLICT DO NOTHING;

-- 计量单位 (Measurement Units)
INSERT INTO dictionaries (id, category, code, name, parent_code, sort_order, is_active) VALUES
    ('dict-unit-001', 'measurement_unit', 'ton', '吨', NULL, 1, true),
    ('dict-unit-002', 'measurement_unit', 'kg', '千克', NULL, 2, true),
    ('dict-unit-003', 'measurement_unit', 'kwh', '千瓦时', NULL, 3, true),
    ('dict-unit-004', 'measurement_unit', 'mj', '兆焦', NULL, 4, true),
    ('dict-unit-005', 'measurement_unit', 'gj', '吉焦', NULL, 5, true),
    ('dict-unit-006', 'measurement_unit', 'm3', '立方米', NULL, 6, true),
    ('dict-unit-007', 'measurement_unit', 'liter', '升', NULL, 7, true),
    ('dict-unit-008', 'measurement_unit', 'tce', '吨标准煤', NULL, 8, true)
ON CONFLICT DO NOTHING;

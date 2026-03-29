-- 012_benchmark_region.sql
-- Add region fields to enterprises and enhance benchmark_values table

-- Region fields for enterprises
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS region_code TEXT;
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS region_name TEXT;
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS city TEXT;

-- Enhance benchmark_values table with additional columns
ALTER TABLE benchmark_values ADD COLUMN IF NOT EXISTS indicator_name TEXT NOT NULL DEFAULT '';
ALTER TABLE benchmark_values ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE benchmark_values ADD COLUMN IF NOT EXISTS applicable_year INTEGER;
ALTER TABLE benchmark_values ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Rename 'year' column to 'applicable_year' if 'year' exists (handle migration from old schema)
-- Note: If the column 'year' exists, we migrate data then drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'benchmark_values' AND column_name = 'year'
  ) THEN
    UPDATE benchmark_values SET applicable_year = year WHERE applicable_year IS NULL AND year IS NOT NULL;
    ALTER TABLE benchmark_values DROP COLUMN year;
  END IF;
END $$;

-- Seed default benchmark data
INSERT INTO benchmark_values (id, industry_code, indicator_code, indicator_name, benchmark_value, unit, source, applicable_year)
VALUES
  ('bv_seed_001', '2511', 'comprehensive_energy_intensity', '综合能耗强度', '0.85', 'tce/万元', 'GB/T 2589-2020', 2025),
  ('bv_seed_002', '2511', 'product_unit_energy', '产品单位能耗', '120', 'kgce/t', 'GB 16780-2021', 2025),
  ('bv_seed_003', '2511', 'equipment_efficiency', '设备能效', '92', '%', 'GB 19153-2019', 2025),
  ('bv_seed_004', '2610', 'comprehensive_energy_intensity', '综合能耗强度', '1.20', 'tce/万元', 'GB/T 2589-2020', 2025),
  ('bv_seed_005', '2610', 'product_unit_energy', '产品单位能耗', '200', 'kgce/t', 'GB 21256-2013', 2025),
  ('bv_seed_006', '2610', 'equipment_efficiency', '设备能效', '88', '%', 'GB 19153-2019', 2025),
  ('bv_seed_007', '1711', 'comprehensive_energy_intensity', '综合能耗强度', '0.65', 'tce/万元', 'GB/T 2589-2020', 2025),
  ('bv_seed_008', '1711', 'product_unit_energy', '产品单位能耗', '80', 'kgce/t', 'GB 21252-2013', 2025),
  ('bv_seed_009', '1711', 'equipment_efficiency', '设备能效', '90', '%', 'GB 19153-2019', 2025),
  ('bv_seed_010', '3311', 'comprehensive_energy_intensity', '综合能耗强度', '2.50', 'tce/万元', 'GB/T 2589-2020', 2025),
  ('bv_seed_011', '3311', 'product_unit_energy', '产品单位能耗', '350', 'kgce/t', 'GB 21342-2013', 2025),
  ('bv_seed_012', '3311', 'equipment_efficiency', '设备能效', '85', '%', 'GB 19153-2019', 2025)
ON CONFLICT (id) DO NOTHING;

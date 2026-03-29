import { describe, expect, it } from 'vitest';

import {
  deepMerge,
  filterAndSortOverrides,
  applyOverrides,
  resolveModuleConfig,
  resolveFieldConfig,
  resolveValidationRules,
} from '@energy-audit/config-engine';

import type { ConfigOverrideRecord, ResolutionContext } from '@energy-audit/config-engine';

// ==================== Helper factories ====================

function makeOverride(partial: Partial<ConfigOverrideRecord> & { scopeType: ConfigOverrideRecord['scopeType']; targetType: ConfigOverrideRecord['targetType']; targetCode: string }): ConfigOverrideRecord {
  return {
    id: `co_${Math.random().toString(36).slice(2)}`,
    scopeId: null,
    configJson: {},
    isActive: true,
    ...partial,
  };
}

// ==================== deepMerge ====================

describe('deepMerge', () => {
  it('should merge flat objects', () => {
    const base = { a: 1, b: 2 };
    const override = { b: 3, c: 4 };
    const result = deepMerge(base, override);
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('should deep-merge nested objects', () => {
    const base = { constraints: { min: 0, max: 100 }, name: 'test' };
    const override = { constraints: { max: 200 } };
    const result = deepMerge(base, override);
    expect(result).toEqual({ constraints: { min: 0, max: 200 }, name: 'test' });
  });

  it('should replace arrays (not concatenate)', () => {
    const base = { tags: ['a', 'b'] };
    const override = { tags: ['c'] };
    const result = deepMerge(base, override);
    expect(result).toEqual({ tags: ['c'] });
  });

  it('should handle null override values', () => {
    const base = { a: 1, b: 2 };
    const override = { b: null };
    const result = deepMerge(base, override as Record<string, unknown>);
    expect(result.b).toBeNull();
  });

  it('should not mutate the base object', () => {
    const base = { a: 1, nested: { x: 10 } };
    const override = { nested: { x: 20, y: 30 } };
    deepMerge(base, override);
    expect(base.nested.x).toBe(10);
  });

  it('should handle empty override', () => {
    const base = { a: 1 };
    const result = deepMerge(base, {});
    expect(result).toEqual({ a: 1 });
  });
});

// ==================== filterAndSortOverrides ====================

describe('filterAndSortOverrides', () => {
  const overrides: ConfigOverrideRecord[] = [
    makeOverride({ scopeType: 'enterprise', scopeId: 'ent1', targetType: 'module', targetCode: 'energy-flow', configJson: { isEnabled: false } }),
    makeOverride({ scopeType: 'platform', scopeId: null, targetType: 'module', targetCode: 'energy-flow', configJson: { sortOrder: 99 } }),
    makeOverride({ scopeType: 'batch_template', scopeId: 'batch1', targetType: 'module', targetCode: 'energy-flow', configJson: { name: '批次能源' } }),
    makeOverride({ scopeType: 'enterprise_type', scopeId: 'ind01', targetType: 'module', targetCode: 'energy-flow', configJson: { category: '特殊行业' } }),
    makeOverride({ scopeType: 'enterprise', scopeId: 'ent2', targetType: 'module', targetCode: 'energy-flow', configJson: { isEnabled: true } }),
    makeOverride({ scopeType: 'platform', scopeId: null, targetType: 'field', targetCode: 'other-field', configJson: {} }),
  ];

  it('should filter by targetType and targetCode', () => {
    const ctx: ResolutionContext = { enterpriseId: 'ent1', batchId: 'batch1', industryCode: 'ind01' };
    const result = filterAndSortOverrides(overrides, 'module', 'energy-flow', ctx);
    // Should not include the 'field' type override or 'ent2' enterprise override
    expect(result.every((o) => o.targetType === 'module' && o.targetCode === 'energy-flow')).toBe(true);
  });

  it('should only include matching scope IDs', () => {
    const ctx: ResolutionContext = { enterpriseId: 'ent1', batchId: 'batch1', industryCode: 'ind01' };
    const result = filterAndSortOverrides(overrides, 'module', 'energy-flow', ctx);
    const enterpriseOverrides = result.filter((o) => o.scopeType === 'enterprise');
    expect(enterpriseOverrides).toHaveLength(1);
    expect(enterpriseOverrides[0].scopeId).toBe('ent1');
  });

  it('should sort by scope priority (platform first, enterprise last)', () => {
    const ctx: ResolutionContext = { enterpriseId: 'ent1', batchId: 'batch1', industryCode: 'ind01' };
    const result = filterAndSortOverrides(overrides, 'module', 'energy-flow', ctx);
    const scopeOrder = result.map((o) => o.scopeType);
    expect(scopeOrder).toEqual(['platform', 'batch_template', 'enterprise_type', 'enterprise']);
  });

  it('should exclude inactive overrides', () => {
    const withInactive = [
      ...overrides,
      makeOverride({ scopeType: 'platform', scopeId: null, targetType: 'module', targetCode: 'energy-flow', configJson: { hidden: true }, isActive: false }),
    ];
    const ctx: ResolutionContext = { enterpriseId: 'ent1' };
    const result = filterAndSortOverrides(withInactive, 'module', 'energy-flow', ctx);
    expect(result.every((o) => o.isActive)).toBe(true);
  });

  it('should return empty array when no context matches', () => {
    const ctx: ResolutionContext = {};
    const result = filterAndSortOverrides(overrides, 'module', 'energy-flow', ctx);
    // Only platform overrides should match when context is empty
    expect(result).toHaveLength(1);
    expect(result[0].scopeType).toBe('platform');
  });
});

// ==================== applyOverrides ====================

describe('applyOverrides', () => {
  it('should apply overrides in order (later wins)', () => {
    const base = { isEnabled: true, name: 'Base', sortOrder: 1 };
    const overrideChain: ConfigOverrideRecord[] = [
      makeOverride({ scopeType: 'platform', targetType: 'module', targetCode: 'x', configJson: { sortOrder: 10 } }),
      makeOverride({ scopeType: 'enterprise', targetType: 'module', targetCode: 'x', configJson: { isEnabled: false, sortOrder: 20 } }),
    ];
    const result = applyOverrides(base, overrideChain);
    expect(result.isEnabled).toBe(false);
    expect(result.sortOrder).toBe(20);
    expect(result.name).toBe('Base');
  });

  it('should return base when no overrides', () => {
    const base = { a: 1 };
    const result = applyOverrides(base, []);
    expect(result).toEqual({ a: 1 });
  });
});

// ==================== resolveModuleConfig ====================

describe('resolveModuleConfig', () => {
  const baseModule = {
    code: 'energy-flow',
    name: '能源流向',
    category: '能源',
    description: '能源流向模块',
    sortOrder: 1,
    isEnabled: true,
    fieldSchema: null,
  };

  it('should return base config when no overrides exist', () => {
    const result = resolveModuleConfig(baseModule, [], {});
    expect(result.code).toBe('energy-flow');
    expect(result.name).toBe('能源流向');
    expect(result.isEnabled).toBe(true);
    expect(result.overrides).toEqual([]);
  });

  it('should apply 4-layer priority correctly (enterprise wins)', () => {
    const overrides: ConfigOverrideRecord[] = [
      makeOverride({ scopeType: 'platform', targetType: 'module', targetCode: 'energy-flow', configJson: { sortOrder: 10 } }),
      makeOverride({ scopeType: 'batch_template', scopeId: 'b1', targetType: 'module', targetCode: 'energy-flow', configJson: { sortOrder: 20 } }),
      makeOverride({ scopeType: 'enterprise_type', scopeId: 'ind01', targetType: 'module', targetCode: 'energy-flow', configJson: { sortOrder: 30 } }),
      makeOverride({ scopeType: 'enterprise', scopeId: 'ent1', targetType: 'module', targetCode: 'energy-flow', configJson: { sortOrder: 40 } }),
    ];
    const ctx: ResolutionContext = { enterpriseId: 'ent1', batchId: 'b1', industryCode: 'ind01' };
    const result = resolveModuleConfig(baseModule, overrides, ctx);
    expect(result.sortOrder).toBe(40); // enterprise wins
  });

  it('should preserve immutable code field', () => {
    const overrides: ConfigOverrideRecord[] = [
      makeOverride({ scopeType: 'platform', targetType: 'module', targetCode: 'energy-flow', configJson: { code: 'hacked', name: '改名' } }),
    ];
    const result = resolveModuleConfig(baseModule, overrides, {});
    expect(result.code).toBe('energy-flow'); // immutable
    expect(result.name).toBe('改名'); // mutable
  });

  it('should track applied overrides', () => {
    const overrides: ConfigOverrideRecord[] = [
      makeOverride({ scopeType: 'platform', targetType: 'module', targetCode: 'energy-flow', configJson: { sortOrder: 5 } }),
      makeOverride({ scopeType: 'enterprise', scopeId: 'ent1', targetType: 'module', targetCode: 'energy-flow', configJson: { isEnabled: false } }),
    ];
    const ctx: ResolutionContext = { enterpriseId: 'ent1' };
    const result = resolveModuleConfig(baseModule, overrides, ctx);
    expect(result.overrides).toHaveLength(2);
  });

  it('should skip layers not present in context', () => {
    const overrides: ConfigOverrideRecord[] = [
      makeOverride({ scopeType: 'platform', targetType: 'module', targetCode: 'energy-flow', configJson: { sortOrder: 10 } }),
      makeOverride({ scopeType: 'enterprise_type', scopeId: 'ind01', targetType: 'module', targetCode: 'energy-flow', configJson: { sortOrder: 30 } }),
    ];
    // Only enterpriseId provided, no industryCode
    const ctx: ResolutionContext = { enterpriseId: 'ent1' };
    const result = resolveModuleConfig(baseModule, overrides, ctx);
    expect(result.sortOrder).toBe(10); // only platform applies
    expect(result.overrides).toHaveLength(1);
  });
});

// ==================== resolveFieldConfig ====================

describe('resolveFieldConfig', () => {
  const baseField = {
    code: 'consumption',
    name: '能耗量',
    fieldType: 'number',
    constraints: { min: 0, max: 99999 },
    displayRules: { width: 120 },
    sortOrder: 1,
  };

  it('should deep-merge constraints from overrides', () => {
    const overrides: ConfigOverrideRecord[] = [
      makeOverride({ scopeType: 'enterprise', scopeId: 'ent1', targetType: 'field', targetCode: 'consumption', configJson: { constraints: { max: 500000 } } }),
    ];
    const ctx: ResolutionContext = { enterpriseId: 'ent1' };
    const result = resolveFieldConfig(baseField, 'energy-flow', overrides, ctx);
    expect((result.constraints as { min: number; max: number }).min).toBe(0); // preserved from base
    expect((result.constraints as { min: number; max: number }).max).toBe(500000); // overridden
  });

  it('should preserve immutable code field', () => {
    const overrides: ConfigOverrideRecord[] = [
      makeOverride({ scopeType: 'platform', targetType: 'field', targetCode: 'consumption', configJson: { code: 'hacked' } }),
    ];
    const result = resolveFieldConfig(baseField, 'energy-flow', overrides, {});
    expect(result.code).toBe('consumption');
  });
});

// ==================== resolveValidationRules ====================

describe('resolveValidationRules', () => {
  const baseRules = [
    {
      ruleCode: 'required_consumption',
      moduleCode: 'energy-flow',
      layer: 1,
      severity: 'error',
      expression: 'value !== null',
      message: '能耗量为必填项',
      fieldCodes: 'consumption',
      isActive: true,
    },
    {
      ruleCode: 'range_check',
      moduleCode: 'energy-flow',
      layer: 2,
      severity: 'warning',
      expression: 'value >= 0 && value <= 99999',
      message: '能耗量超出合理范围',
      fieldCodes: 'consumption',
      isActive: true,
    },
  ];

  it('should return base rules when no overrides exist', () => {
    const result = resolveValidationRules(baseRules, [], {});
    expect(result).toHaveLength(2);
    expect(result[0].ruleCode).toBe('required_consumption');
    expect(result[0].overrides).toEqual([]);
  });

  it('should allow enterprise to disable a rule', () => {
    const overrides: ConfigOverrideRecord[] = [
      makeOverride({ scopeType: 'enterprise', scopeId: 'ent1', targetType: 'validation_rule', targetCode: 'range_check', configJson: { isActive: false } }),
    ];
    const ctx: ResolutionContext = { enterpriseId: 'ent1' };
    const result = resolveValidationRules(baseRules, overrides, ctx);
    const rangeRule = result.find((r) => r.ruleCode === 'range_check')!;
    expect(rangeRule.isActive).toBe(false);
  });

  it('should allow changing severity via override', () => {
    const overrides: ConfigOverrideRecord[] = [
      makeOverride({ scopeType: 'enterprise_type', scopeId: 'ind01', targetType: 'validation_rule', targetCode: 'range_check', configJson: { severity: 'error' } }),
    ];
    const ctx: ResolutionContext = { industryCode: 'ind01' };
    const result = resolveValidationRules(baseRules, overrides, ctx);
    const rangeRule = result.find((r) => r.ruleCode === 'range_check')!;
    expect(rangeRule.severity).toBe('error'); // promoted from warning to error
  });

  it('should preserve immutable ruleCode', () => {
    const overrides: ConfigOverrideRecord[] = [
      makeOverride({ scopeType: 'platform', targetType: 'validation_rule', targetCode: 'range_check', configJson: { ruleCode: 'hacked', message: '新消息' } }),
    ];
    const result = resolveValidationRules(baseRules, overrides, {});
    const rangeRule = result.find((r) => r.ruleCode === 'range_check')!;
    expect(rangeRule.ruleCode).toBe('range_check'); // immutable
    expect(rangeRule.message).toBe('新消息'); // mutable
  });

  it('should apply 4-layer priority for validation rules', () => {
    const overrides: ConfigOverrideRecord[] = [
      makeOverride({ scopeType: 'platform', targetType: 'validation_rule', targetCode: 'range_check', configJson: { message: '平台消息' } }),
      makeOverride({ scopeType: 'batch_template', scopeId: 'b1', targetType: 'validation_rule', targetCode: 'range_check', configJson: { message: '批次消息' } }),
      makeOverride({ scopeType: 'enterprise_type', scopeId: 'ind01', targetType: 'validation_rule', targetCode: 'range_check', configJson: { message: '行业消息' } }),
      makeOverride({ scopeType: 'enterprise', scopeId: 'ent1', targetType: 'validation_rule', targetCode: 'range_check', configJson: { message: '企业消息' } }),
    ];
    const ctx: ResolutionContext = { enterpriseId: 'ent1', batchId: 'b1', industryCode: 'ind01' };
    const result = resolveValidationRules(baseRules, overrides, ctx);
    const rangeRule = result.find((r) => r.ruleCode === 'range_check')!;
    expect(rangeRule.message).toBe('企业消息'); // enterprise wins
  });
});

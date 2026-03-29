/**
 * Config Priority Override Engine
 *
 * Resolution priority (higher overrides lower):
 *   1. Platform defaults (from dataModules / dataFields / validationRules)
 *   2. Batch template overrides (scope_type = 'batch_template')
 *   3. Enterprise type overrides (scope_type = 'enterprise_type')
 *   4. Enterprise overrides (scope_type = 'enterprise')
 */

export interface ConfigOverrideRecord {
  id: string;
  scopeType: 'platform' | 'batch_template' | 'enterprise_type' | 'enterprise';
  scopeId: string | null;
  targetType: 'module' | 'field' | 'validation_rule';
  targetCode: string;
  configJson: Record<string, unknown>;
  isActive: boolean;
}

export interface ResolutionContext {
  enterpriseId?: string;
  industryCode?: string;
  batchId?: string;
}

export interface MergedModuleConfig {
  code: string;
  name: string;
  category: string;
  description?: string;
  sortOrder: number;
  isEnabled: boolean;
  fieldSchema?: unknown;
  overrides: ConfigOverrideRecord[];
  [key: string]: unknown;
}

export interface MergedFieldConfig {
  code: string;
  name: string;
  fieldType: string;
  constraints?: Record<string, unknown>;
  displayRules?: Record<string, unknown>;
  sortOrder: number;
  overrides: ConfigOverrideRecord[];
  [key: string]: unknown;
}

export interface MergedValidationRule {
  ruleCode: string;
  moduleCode: string;
  layer: number;
  severity: string;
  expression: string;
  message: string;
  fieldCodes?: string;
  isActive: boolean;
  overrides: ConfigOverrideRecord[];
  [key: string]: unknown;
}

/** Scope priority: platform < batch_template < enterprise_type < enterprise */
const SCOPE_PRIORITY: Record<string, number> = {
  platform: 0,
  batch_template: 1,
  enterprise_type: 2,
  enterprise: 3,
};

/**
 * Deep-merge two objects. Later values override earlier values.
 * Arrays are replaced, not concatenated.
 */
export function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Record<string, unknown>,
): T {
  const result = { ...base } as Record<string, unknown>;

  for (const key of Object.keys(override)) {
    const baseVal = result[key];
    const overrideVal = override[key];

    if (
      overrideVal !== null &&
      overrideVal !== undefined &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal) &&
      typeof baseVal === 'object' &&
      baseVal !== null &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>,
      );
    } else {
      result[key] = overrideVal;
    }
  }

  return result as T;
}

/**
 * Filter overrides relevant to the given context and target.
 * Returns them sorted by scope priority (platform first, enterprise last).
 */
export function filterAndSortOverrides(
  overrides: ConfigOverrideRecord[],
  targetType: string,
  targetCode: string,
  context: ResolutionContext,
): ConfigOverrideRecord[] {
  return overrides
    .filter((o) => {
      if (!o.isActive) return false;
      if (o.targetType !== targetType) return false;
      if (o.targetCode !== targetCode) return false;

      switch (o.scopeType) {
        case 'platform':
          return true;
        case 'batch_template':
          return !!context.batchId && o.scopeId === context.batchId;
        case 'enterprise_type':
          return !!context.industryCode && o.scopeId === context.industryCode;
        case 'enterprise':
          return !!context.enterpriseId && o.scopeId === context.enterpriseId;
        default:
          return false;
      }
    })
    .sort(
      (a, b) =>
        (SCOPE_PRIORITY[a.scopeType] ?? 0) -
        (SCOPE_PRIORITY[b.scopeType] ?? 0),
    );
}

/**
 * Apply a chain of overrides to a base config object.
 */
export function applyOverrides<T extends Record<string, unknown>>(
  base: T,
  overrides: ConfigOverrideRecord[],
): T {
  let merged = { ...base };
  for (const override of overrides) {
    merged = deepMerge(merged, override.configJson);
  }
  return merged;
}

/**
 * Resolve the effective module config after applying all overrides.
 */
export function resolveModuleConfig(
  baseModule: {
    code: string;
    name: string;
    category: string;
    description?: string | null;
    sortOrder: number;
    isEnabled: boolean;
    fieldSchema?: unknown;
  },
  overrides: ConfigOverrideRecord[],
  context: ResolutionContext,
): MergedModuleConfig {
  const relevantOverrides = filterAndSortOverrides(
    overrides,
    'module',
    baseModule.code,
    context,
  );

  const base: Record<string, unknown> = {
    code: baseModule.code,
    name: baseModule.name,
    category: baseModule.category,
    description: baseModule.description ?? undefined,
    sortOrder: baseModule.sortOrder,
    isEnabled: baseModule.isEnabled,
    fieldSchema: baseModule.fieldSchema,
  };

  const merged = applyOverrides(base, relevantOverrides);
  return {
    ...merged,
    code: baseModule.code, // code is immutable
    overrides: relevantOverrides,
  } as MergedModuleConfig;
}

/**
 * Resolve the effective field config after applying all overrides.
 */
export function resolveFieldConfig(
  baseField: {
    code: string;
    name: string;
    fieldType: string;
    constraints?: unknown;
    displayRules?: unknown;
    sortOrder: number;
  },
  moduleCode: string,
  overrides: ConfigOverrideRecord[],
  context: ResolutionContext,
): MergedFieldConfig {
  const relevantOverrides = filterAndSortOverrides(
    overrides,
    'field',
    baseField.code,
    context,
  );

  const base: Record<string, unknown> = {
    code: baseField.code,
    name: baseField.name,
    fieldType: baseField.fieldType,
    constraints: baseField.constraints ?? {},
    displayRules: baseField.displayRules ?? {},
    sortOrder: baseField.sortOrder,
    moduleCode,
  };

  const merged = applyOverrides(base, relevantOverrides);
  return {
    ...merged,
    code: baseField.code, // code is immutable
    overrides: relevantOverrides,
  } as MergedFieldConfig;
}

/**
 * Resolve the effective validation rules after applying all overrides.
 */
export function resolveValidationRules(
  baseRules: Array<{
    ruleCode: string;
    moduleCode: string;
    layer: number;
    severity: string;
    expression: string;
    message: string;
    fieldCodes: string | null;
    isActive: boolean;
  }>,
  overrides: ConfigOverrideRecord[],
  context: ResolutionContext,
): MergedValidationRule[] {
  return baseRules.map((rule) => {
    const relevantOverrides = filterAndSortOverrides(
      overrides,
      'validation_rule',
      rule.ruleCode,
      context,
    );

    const base: Record<string, unknown> = {
      ruleCode: rule.ruleCode,
      moduleCode: rule.moduleCode,
      layer: rule.layer,
      severity: rule.severity,
      expression: rule.expression,
      message: rule.message,
      fieldCodes: rule.fieldCodes ?? undefined,
      isActive: rule.isActive,
    };

    const merged = applyOverrides(base, relevantOverrides);
    return {
      ...merged,
      ruleCode: rule.ruleCode, // ruleCode is immutable
      overrides: relevantOverrides,
    } as MergedValidationRule;
  });
}

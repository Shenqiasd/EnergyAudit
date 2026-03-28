/**
 * Calculation engine with dependency resolution
 */

export interface CalculationRule {
  ruleCode: string;
  moduleCode: string;
  expression: string;
  dependencies: string[];
  outputFieldCode: string;
  isActive: boolean;
}

export interface CalculationResult {
  fieldCode: string;
  value: number | string | null;
  ruleCode: string;
  success: boolean;
  error?: string;
}

export interface CalculationSnapshot {
  results: CalculationResult[];
  calculatedAt: Date;
  parametersSnapshot: Record<string, unknown>;
}

/**
 * Topological sort for dependency resolution.
 * Returns rules in execution order.
 */
export function resolveDependencyOrder(
  rules: CalculationRule[],
): CalculationRule[] {
  const ruleMap = new Map(rules.map((r) => [r.outputFieldCode, r]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const ordered: CalculationRule[] = [];

  function visit(fieldCode: string): void {
    if (visited.has(fieldCode)) return;
    if (visiting.has(fieldCode)) return; // circular dependency, skip

    visiting.add(fieldCode);
    const rule = ruleMap.get(fieldCode);
    if (rule) {
      for (const dep of rule.dependencies) {
        visit(dep);
      }
      ordered.push(rule);
    }
    visiting.delete(fieldCode);
    visited.add(fieldCode);
  }

  for (const rule of rules) {
    visit(rule.outputFieldCode);
  }

  return ordered;
}

/**
 * Execute a single calculation rule against the provided values.
 */
export function executeCalculation(
  rule: CalculationRule,
  values: Record<string, unknown>,
): CalculationResult {
  try {
    const depKeys = rule.dependencies;
    const fn = new Function(...depKeys, `return ${rule.expression}`);
    const args = depKeys.map((k) => {
      const v = values[k];
      return v !== undefined && v !== null && v !== '' ? Number(v) : 0;
    });
    const result = fn(...args);

    return {
      fieldCode: rule.outputFieldCode,
      value: typeof result === 'number' && isFinite(result) ? result : null,
      ruleCode: rule.ruleCode,
      success: true,
    };
  } catch (err) {
    return {
      fieldCode: rule.outputFieldCode,
      value: null,
      ruleCode: rule.ruleCode,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Execute all calculation rules in dependency order.
 */
export function executeAllCalculations(
  rules: CalculationRule[],
  initialValues: Record<string, unknown>,
): CalculationSnapshot {
  const orderedRules = resolveDependencyOrder(rules.filter((r) => r.isActive));
  const currentValues = { ...initialValues };
  const results: CalculationResult[] = [];

  for (const rule of orderedRules) {
    const result = executeCalculation(rule, currentValues);
    results.push(result);
    if (result.success && result.value !== null) {
      currentValues[rule.outputFieldCode] = result.value;
    }
  }

  return {
    results,
    calculatedAt: new Date(),
    parametersSnapshot: { ...initialValues },
  };
}

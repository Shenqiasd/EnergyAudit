/**
 * 5-layer validation engine:
 *  Layer 1: Required field check
 *  Layer 2: Field-level type/range validation
 *  Layer 3: Cross-field validation (e.g., energy balance)
 *  Layer 4: Cross-module validation
 *  Layer 5: Completeness check (all required modules submitted)
 */

export type ValidationSeverity = 'error' | 'warning' | 'info';

export type ValidationLayer = 1 | 2 | 3 | 4 | 5;

export interface ValidationRule {
  ruleCode: string;
  moduleCode: string;
  layer: ValidationLayer;
  severity: ValidationSeverity;
  expression: string;
  message: string;
  fieldCodes?: string[];
  isActive: boolean;
}

export interface ValidationError {
  ruleCode: string;
  layer: ValidationLayer;
  severity: ValidationSeverity;
  message: string;
  fieldCodes?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  canSave: boolean;
  canSubmit: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
}

export function createEmptyResult(): ValidationResult {
  return {
    isValid: true,
    canSave: true,
    canSubmit: true,
    errors: [],
    warnings: [],
    infos: [],
  };
}

export function executeRequiredCheck(
  fieldCode: string,
  fieldName: string,
  value: unknown,
): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return {
      ruleCode: `required_${fieldCode}`,
      layer: 1,
      severity: 'error',
      message: `${fieldName}为必填项`,
      fieldCodes: [fieldCode],
    };
  }
  return null;
}

export function executeFieldValidation(
  ruleCode: string,
  fieldCode: string,
  value: unknown,
  validationType: string,
  params: { min?: number; max?: number; pattern?: string },
): ValidationError | null {
  if (value === null || value === undefined || value === '') return null;

  if (validationType === 'range') {
    const num = Number(value);
    if (isNaN(num)) {
      return {
        ruleCode,
        layer: 2,
        severity: 'error',
        message: `字段值必须为数字`,
        fieldCodes: [fieldCode],
      };
    }
    if (params.min !== undefined && num < params.min) {
      return {
        ruleCode,
        layer: 2,
        severity: 'error',
        message: `值不能小于${params.min}`,
        fieldCodes: [fieldCode],
      };
    }
    if (params.max !== undefined && num > params.max) {
      return {
        ruleCode,
        layer: 2,
        severity: 'error',
        message: `值不能大于${params.max}`,
        fieldCodes: [fieldCode],
      };
    }
  }

  if (validationType === 'pattern' && params.pattern && typeof value === 'string') {
    const regex = new RegExp(params.pattern);
    if (!regex.test(value)) {
      return {
        ruleCode,
        layer: 2,
        severity: 'error',
        message: `字段值格式不正确`,
        fieldCodes: [fieldCode],
      };
    }
  }

  return null;
}

export function executeCrossFieldValidation(
  ruleCode: string,
  fieldCodes: string[],
  values: Record<string, unknown>,
  expression: string,
  message: string,
  severity: ValidationSeverity = 'error',
): ValidationError | null {
  try {
    const fn = new Function(...fieldCodes, `return ${expression}`);
    const args = fieldCodes.map((fc) => values[fc]);
    const result = fn(...args);
    if (!result) {
      return {
        ruleCode,
        layer: 3,
        severity,
        message,
        fieldCodes,
      };
    }
    return null;
  } catch {
    return {
      ruleCode,
      layer: 3,
      severity: 'warning',
      message: `校验规则执行异常: ${ruleCode}`,
      fieldCodes,
    };
  }
}

export function executeCrossModuleValidation(
  ruleCode: string,
  moduleValues: Record<string, Record<string, unknown>>,
  expression: string,
  message: string,
  severity: ValidationSeverity = 'error',
): ValidationError | null {
  try {
    const fn = new Function('modules', `return ${expression}`);
    const result = fn(moduleValues);
    if (!result) {
      return {
        ruleCode,
        layer: 4,
        severity,
        message,
      };
    }
    return null;
  } catch {
    return {
      ruleCode,
      layer: 4,
      severity: 'warning',
      message: `跨模块校验规则执行异常: ${ruleCode}`,
    };
  }
}

export function executeCompletenessCheck(
  requiredModuleCodes: string[],
  submittedModuleCodes: string[],
): ValidationError[] {
  const errors: ValidationError[] = [];
  const submittedSet = new Set(submittedModuleCodes);

  for (const code of requiredModuleCodes) {
    if (!submittedSet.has(code)) {
      errors.push({
        ruleCode: `completeness_${code}`,
        layer: 5,
        severity: 'error',
        message: `必填模块 ${code} 尚未提交`,
      });
    }
  }

  return errors;
}

export function aggregateResults(errors: ValidationError[]): ValidationResult {
  const result = createEmptyResult();

  for (const err of errors) {
    switch (err.severity) {
      case 'error':
        result.errors.push(err);
        break;
      case 'warning':
        result.warnings.push(err);
        break;
      case 'info':
        result.infos.push(err);
        break;
    }
  }

  result.isValid = result.errors.length === 0;
  result.canSubmit = result.errors.length === 0;
  result.canSave = true; // save always allowed
  return result;
}

export function groupErrorsByLayer(
  errors: ValidationError[],
): Record<ValidationLayer, ValidationError[]> {
  const groups: Record<ValidationLayer, ValidationError[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };

  for (const err of errors) {
    groups[err.layer].push(err);
  }

  return groups;
}

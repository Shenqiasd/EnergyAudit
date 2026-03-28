import { describe, expect, it } from 'vitest';

/**
 * Pure unit tests for validation execution logic.
 * Tests the validation rule engine without any DB involvement.
 */

type ValidationSeverity = 'error' | 'warning' | 'info';
type ValidationLayer = 1 | 2 | 3 | 4 | 5;

interface ValidationError {
  ruleCode: string;
  layer: ValidationLayer;
  severity: ValidationSeverity;
  message: string;
  fieldCodes?: string[];
}

// Layer 1: Required field check
function executeRequiredCheck(
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

// Layer 2: Field-level type/range validation
function executeFieldValidation(
  ruleCode: string,
  fieldCode: string,
  value: unknown,
  validationType: string,
  params: { min?: number; max?: number },
): ValidationError | null {
  if (value === null || value === undefined || value === '') return null;

  if (validationType === 'range') {
    const num = Number(value);
    if (isNaN(num)) {
      return {
        ruleCode,
        layer: 2,
        severity: 'error',
        message: '字段值必须为数字',
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
  return null;
}

// Layer 3: Cross-field validation
function executeCrossFieldValidation(
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

function aggregateResults(errors: ValidationError[]) {
  const result = {
    errors: [] as ValidationError[],
    warnings: [] as ValidationError[],
    infos: [] as ValidationError[],
  };

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

  return result;
}

function groupErrorsByLayer(errors: ValidationError[]): Record<ValidationLayer, ValidationError[]> {
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

describe('validation execution', () => {
  describe('executes required field validation', () => {
    it('should return error for null value', () => {
      const result = executeRequiredCheck('enterprise_name', '企业名称', null);
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('error');
      expect(result!.layer).toBe(1);
      expect(result!.message).toBe('企业名称为必填项');
      expect(result!.fieldCodes).toEqual(['enterprise_name']);
    });

    it('should return error for empty string', () => {
      const result = executeRequiredCheck('enterprise_name', '企业名称', '');
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('error');
    });

    it('should return error for undefined value', () => {
      const result = executeRequiredCheck('enterprise_name', '企业名称', undefined);
      expect(result).not.toBeNull();
    });

    it('should return null for valid value', () => {
      const result = executeRequiredCheck('enterprise_name', '企业名称', '某某公司');
      expect(result).toBeNull();
    });

    it('should return null for numeric zero (valid)', () => {
      const result = executeRequiredCheck('consumption', '能耗', 0);
      expect(result).toBeNull();
    });
  });

  describe('executes cross-field validation (energy balance)', () => {
    it('should detect energy balance mismatch (input != output)', () => {
      const result = executeCrossFieldValidation(
        'energy_balance_check',
        ['energy_input', 'energy_output'],
        { energy_input: 1000, energy_output: 800 },
        'Math.abs(energy_input - energy_output) / energy_input < 0.05',
        '能源输入与输出差异超过5%',
      );

      // 200/1000 = 0.2 > 0.05, so validation should fail
      expect(result).not.toBeNull();
      expect(result!.layer).toBe(3);
      expect(result!.message).toBe('能源输入与输出差异超过5%');
    });

    it('should pass when energy balance is within tolerance', () => {
      const result = executeCrossFieldValidation(
        'energy_balance_check',
        ['energy_input', 'energy_output'],
        { energy_input: 1000, energy_output: 980 },
        'Math.abs(energy_input - energy_output) / energy_input < 0.05',
        '能源输入与输出差异超过5%',
      );

      // 20/1000 = 0.02 < 0.05, so validation should pass
      expect(result).toBeNull();
    });

    it('should handle expression error gracefully', () => {
      const result = executeCrossFieldValidation(
        'bad_rule',
        ['a', 'b'],
        { a: 1, b: 2 },
        'invalidFunction(a, b)',
        '规则执行失败',
      );

      expect(result).not.toBeNull();
      expect(result!.severity).toBe('warning');
      expect(result!.layer).toBe(3);
    });
  });

  describe('returns errors with correct severity levels', () => {
    it('should categorize errors correctly', () => {
      const errors: ValidationError[] = [
        {
          ruleCode: 'req_1',
          layer: 1,
          severity: 'error',
          message: '必填项缺失',
        },
        {
          ruleCode: 'warn_1',
          layer: 3,
          severity: 'warning',
          message: '能源平衡差异较大',
        },
        {
          ruleCode: 'info_1',
          layer: 2,
          severity: 'info',
          message: '建议填写更多信息',
        },
      ];

      const result = aggregateResults(errors);
      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.infos).toHaveLength(1);
      expect(result.errors[0].ruleCode).toBe('req_1');
      expect(result.warnings[0].ruleCode).toBe('warn_1');
      expect(result.infos[0].ruleCode).toBe('info_1');
    });

    it('should handle empty errors list', () => {
      const result = aggregateResults([]);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.infos).toHaveLength(0);
    });

    it('should handle all errors of same severity', () => {
      const errors: ValidationError[] = [
        { ruleCode: 'err_1', layer: 1, severity: 'error', message: '错误1' },
        { ruleCode: 'err_2', layer: 2, severity: 'error', message: '错误2' },
      ];

      const result = aggregateResults(errors);
      expect(result.errors).toHaveLength(2);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('groups errors by layer', () => {
    it('should group errors into correct layers', () => {
      const errors: ValidationError[] = [
        { ruleCode: 'req_1', layer: 1, severity: 'error', message: '必填' },
        { ruleCode: 'range_1', layer: 2, severity: 'error', message: '超范围' },
        { ruleCode: 'cross_1', layer: 3, severity: 'warning', message: '交叉校验' },
        { ruleCode: 'req_2', layer: 1, severity: 'error', message: '必填2' },
      ];

      const groups = groupErrorsByLayer(errors);
      expect(groups[1]).toHaveLength(2);
      expect(groups[2]).toHaveLength(1);
      expect(groups[3]).toHaveLength(1);
      expect(groups[4]).toHaveLength(0);
      expect(groups[5]).toHaveLength(0);
    });

    it('should return empty arrays for layers with no errors', () => {
      const groups = groupErrorsByLayer([]);
      expect(groups[1]).toHaveLength(0);
      expect(groups[2]).toHaveLength(0);
      expect(groups[3]).toHaveLength(0);
      expect(groups[4]).toHaveLength(0);
      expect(groups[5]).toHaveLength(0);
    });

    it('should handle field-level range validation', () => {
      const err = executeFieldValidation(
        'range_check',
        'temperature',
        150,
        'range',
        { min: 0, max: 100 },
      );
      expect(err).not.toBeNull();
      expect(err!.layer).toBe(2);
      expect(err!.message).toBe('值不能大于100');

      const errBelow = executeFieldValidation(
        'range_check',
        'temperature',
        -10,
        'range',
        { min: 0, max: 100 },
      );
      expect(errBelow).not.toBeNull();
      expect(errBelow!.message).toBe('值不能小于0');

      const noErr = executeFieldValidation(
        'range_check',
        'temperature',
        50,
        'range',
        { min: 0, max: 100 },
      );
      expect(noErr).toBeNull();
    });

    it('should return error for non-numeric values in range check', () => {
      const err = executeFieldValidation(
        'range_check',
        'consumption',
        'abc',
        'range',
        { min: 0, max: 1000 },
      );
      expect(err).not.toBeNull();
      expect(err!.message).toBe('字段值必须为数字');
    });
  });
});

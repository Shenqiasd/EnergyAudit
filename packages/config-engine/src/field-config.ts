/**
 * Field configuration with type, constraints, and display rules
 */

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'table';

export interface FieldConstraint {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: SelectOption[];
  precision?: number;
  tableColumns?: TableColumnDef[];
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumnDef {
  code: string;
  name: string;
  type: FieldType;
  constraints?: Omit<FieldConstraint, 'tableColumns'>;
}

export interface DisplayRule {
  hidden?: boolean;
  readonly?: boolean;
  placeholder?: string;
  helpText?: string;
  width?: string;
  group?: string;
  dependsOn?: string;
  showWhen?: string;
}

export interface FieldConfig {
  code: string;
  name: string;
  fieldType: FieldType;
  constraints?: FieldConstraint;
  displayRules?: DisplayRule;
  sortOrder: number;
}

export function isFieldRequired(field: FieldConfig): boolean {
  return field.constraints?.required === true;
}

export function getRequiredFields(fields: FieldConfig[]): FieldConfig[] {
  return fields.filter(isFieldRequired);
}

export function getFieldsByGroup(
  fields: FieldConfig[],
  group: string,
): FieldConfig[] {
  return fields
    .filter((f) => f.displayRules?.group === group)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function isFieldVisible(
  field: FieldConfig,
  values: Record<string, unknown>,
): boolean {
  if (field.displayRules?.hidden) return false;

  if (field.displayRules?.dependsOn && field.displayRules?.showWhen) {
    const depValue = values[field.displayRules.dependsOn];
    return String(depValue) === field.displayRules.showWhen;
  }

  return true;
}

export function validateFieldValue(
  field: FieldConfig,
  value: unknown,
): string | null {
  const { constraints } = field;
  if (!constraints) return null;

  if (constraints.required && (value === null || value === undefined || value === '')) {
    return `${field.name}为必填项`;
  }

  if (value === null || value === undefined || value === '') return null;

  if (field.fieldType === 'number') {
    const num = Number(value);
    if (isNaN(num)) return `${field.name}必须为数字`;
    if (constraints.min !== undefined && num < constraints.min) {
      return `${field.name}不能小于${constraints.min}`;
    }
    if (constraints.max !== undefined && num > constraints.max) {
      return `${field.name}不能大于${constraints.max}`;
    }
  }

  if (field.fieldType === 'text' && typeof value === 'string') {
    if (constraints.minLength !== undefined && value.length < constraints.minLength) {
      return `${field.name}长度不能少于${constraints.minLength}个字符`;
    }
    if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
      return `${field.name}长度不能超过${constraints.maxLength}个字符`;
    }
    if (constraints.pattern) {
      const regex = new RegExp(constraints.pattern);
      if (!regex.test(value)) {
        return `${field.name}格式不正确`;
      }
    }
  }

  if (field.fieldType === 'select' && constraints.options) {
    const validValues = constraints.options.map((o) => o.value);
    if (!validValues.includes(String(value))) {
      return `${field.name}选择的值无效`;
    }
  }

  return null;
}

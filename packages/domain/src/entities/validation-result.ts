/**
 * 校验严重程度
 * 对齐设计文档 9.6 执行结果结构
 */
export type ValidationSeverity = "error" | "warning" | "info";

/**
 * 校验结果对象
 * 对齐设计文档 5.2 业务运行对象 - ValidationResult
 */
export interface ValidationResult {
  id: string;
  dataRecordId: string;
  /** 规则编码 */
  ruleCode: string;
  /** 规则类型 (basic, field_logic, cross_field, cross_module, completeness) */
  ruleType: string;
  /** 所属模块 */
  moduleCode: string;
  /** 关联字段 */
  fieldCode?: string;
  /** 严重程度 */
  severity: ValidationSeverity;
  /** 错误信息 */
  message: string;
  /** 修复建议 */
  fixSuggestion?: string;
  /** 是否阻断提交 */
  blocksSubmission: boolean;
  createdAt: string;
}

export function createValidationResult(
  overrides: Partial<ValidationResult> = {},
): ValidationResult {
  return {
    id: "validation_1",
    dataRecordId: "record_1",
    ruleCode: "required-field",
    ruleType: "basic",
    moduleCode: "enterprise-profile",
    severity: "error",
    message: "企业名称为必填项",
    blocksSubmission: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

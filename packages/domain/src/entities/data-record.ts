/**
 * 填报记录状态
 * 对齐设计文档 6.3 填报记录状态 (7 状态)
 */
export type DataRecordStatus =
  | "draft"              // 草稿
  | "saved"              // 已保存
  | "validation_failed"  // 校验失败
  | "pending_submit"     // 待提交
  | "submitted"          // 已提交
  | "returned"           // 已退回
  | "archived";          // 已归档

/**
 * 填报记录主对象
 * 对齐设计文档 5.2 业务运行对象 - DataRecord
 */
export interface DataRecord {
  id: string;
  auditProjectId: string;
  moduleCode: string;
  status: DataRecordStatus;
  /** 模板版本 ID */
  templateVersionId?: string;
  /** 提交时间 */
  submittedAt?: string;
  /** 退回原因 */
  returnReason?: string;
  /** 协同锁持有者 ID */
  lockHolderId?: string;
  /** 锁获取时间 */
  lockAcquiredAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 字段或单元级数据对象
 * 对齐设计文档 5.2 业务运行对象 - DataItem
 */
export interface DataItem {
  id: string;
  dataRecordId: string;
  fieldCode: string;
  /** 原始录入值 */
  rawValue?: string;
  /** 系统计算值 */
  calculatedValue?: string;
  /** 人工修正值 */
  manualOverrideValue?: string;
  /** 最终采用值 */
  finalValue?: string;
  /** 单位 */
  unit?: string;
}

export function createDataRecord(
  overrides: Partial<DataRecord> = {},
): DataRecord {
  return {
    id: "record_1",
    auditProjectId: "project_1",
    moduleCode: "enterprise-profile",
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createDataItem(
  overrides: Partial<DataItem> = {},
): DataItem {
  return {
    id: "item_1",
    dataRecordId: "record_1",
    fieldCode: "totalEnergy",
    ...overrides,
  };
}

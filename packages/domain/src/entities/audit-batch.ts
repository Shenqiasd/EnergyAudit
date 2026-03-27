export type AuditBatchStatus =
  | "draft"
  | "active"
  | "under_review"
  | "completed";

/**
 * 审计批次
 * 对齐设计文档 5.2 业务运行对象 - AuditBatch
 */
export interface AuditBatch {
  id: string;
  name: string;
  year: number;
  status: AuditBatchStatus;
  templateVersionId?: string;
  /** 批次描述 */
  description?: string;
  /** 填报截止日期 */
  filingDeadline?: string;
  /** 审核截止日期 */
  reviewDeadline?: string;
  /** 创建人 */
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export function createAuditBatch(
  overrides: Partial<AuditBatch> = {},
): AuditBatch {
  return {
    id: "batch_1",
    name: "2026 能源审计批次",
    year: 2026,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

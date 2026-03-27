/**
 * 报告状态
 * 对齐设计文档 6.4 报告状态 (8 状态)
 */
export type ReportStatus =
  | "not_generated"          // 未生成
  | "draft_generated"        // 已生成初稿
  | "enterprise_revising"    // 企业修订中
  | "pending_final_upload"   // 待提交终稿
  | "final_uploaded"         // 终稿已上传
  | "in_review"              // 审核中
  | "archived"               // 已归档
  | "voided";                // 已作废

export type ReportVersionType =
  | "system_draft"
  | "enterprise_revision"
  | "final_archive";

/**
 * 报告主对象
 * 对齐设计文档 5.3 结果输出对象 - Report
 */
export interface Report {
  id: string;
  auditProjectId: string;
  version: number;
  versionType: ReportVersionType;
  status: ReportStatus;
  /** 模板版本 ID */
  templateVersionId?: string;
  /** 文件附件 ID */
  fileAttachmentId?: string;
  /** 生成时间 */
  generatedAt?: string;
  /** 提交时间 */
  submittedAt?: string;
  /** 归档时间 */
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function createReport(overrides: Partial<Report> = {}): Report {
  return {
    id: "report_1",
    auditProjectId: "project_1",
    version: 1,
    versionType: "system_draft",
    status: "not_generated",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * 审计项目状态
 * 对齐设计文档 6.2 审计项目状态 (12 状态)
 */
export type AuditProjectStatus =
  | "pending_start"        // 待启动
  | "configuring"          // 配置中
  | "filing"               // 填报中
  | "pending_submit"       // 待提交
  | "pending_report"       // 待生成报告
  | "report_processing"    // 报告处理中
  | "pending_review"       // 待审核
  | "in_review"            // 审核中
  | "pending_rectification" // 待整改
  | "in_rectification"     // 整改中
  | "completed"            // 已完成
  | "closed";              // 已关闭

/**
 * 企业审计项目
 * 对齐设计文档 5.2 业务运行对象 - AuditProject
 */
export interface AuditProject {
  id: string;
  enterpriseId: string;
  batchId: string;
  status: AuditProjectStatus;
  /** 绑定的模板版本 ID */
  templateVersionId?: string;
  /** 截止日期 */
  deadline?: string;
  /** 是否超期 */
  isOverdue: boolean;
  /** 配置完成标记 */
  configComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export function createAuditProject(
  overrides: Partial<AuditProject> = {},
): AuditProject {
  return {
    id: "project_1",
    enterpriseId: "ent_1",
    batchId: "batch_1",
    status: "pending_start",
    isOverdue: false,
    configComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

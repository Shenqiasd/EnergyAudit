/**
 * 整改任务状态
 * 对齐设计文档 6.6 整改任务状态 (7 状态)
 */
export type RectificationTaskStatus =
  | "pending_issue"         // 待下发
  | "pending_claim"         // 待认领
  | "in_progress"           // 整改中
  | "pending_acceptance"    // 待验收
  | "completed"             // 已完成
  | "delayed"               // 延期中
  | "closed";               // 已关闭

/**
 * 整改任务对象
 * 对齐设计文档 5.3 结果输出对象 - RectificationTask
 */
export interface RectificationTask {
  id: string;
  auditProjectId: string;
  reviewTaskId: string;
  /** 来源问题 ID */
  sourceIssueId?: string;
  title: string;
  description?: string;
  status: RectificationTaskStatus;
  /** 整改截止日期 */
  deadline?: string;
  /** 是否超期 */
  isOverdue: boolean;
  /** 完成时间 */
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function createRectificationTask(
  overrides: Partial<RectificationTask> = {},
): RectificationTask {
  return {
    id: "rectification_1",
    auditProjectId: "project_1",
    reviewTaskId: "review_1",
    title: "完善能源审计整改计划",
    status: "pending_issue",
    isOverdue: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

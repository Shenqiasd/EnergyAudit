/**
 * 审核任务状态
 * 对齐设计文档 6.5 审核任务状态 (7 状态)
 */
export type ReviewTaskStatus =
  | "pending_assignment"   // 待分派
  | "assigned"             // 已分派
  | "in_review"            // 审核中
  | "pending_confirmation" // 待确认
  | "returned"             // 已退回
  | "completed"            // 已完成
  | "closed";              // 已关闭

/**
 * 审核任务对象
 * 对齐设计文档 5.3 结果输出对象 - ReviewTask
 */
export interface ReviewTask {
  id: string;
  auditProjectId: string;
  reportId: string;
  reviewerId: string;
  status: ReviewTaskStatus;
  /** 审核结论 */
  conclusion?: string;
  /** 总分 */
  totalScore?: number;
  /** 分派时间 */
  assignedAt?: string;
  /** 完成时间 */
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function createReviewTask(
  overrides: Partial<ReviewTask> = {},
): ReviewTask {
  return {
    id: "review_1",
    auditProjectId: "project_1",
    reportId: "report_1",
    reviewerId: "reviewer_1",
    status: "pending_assignment",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

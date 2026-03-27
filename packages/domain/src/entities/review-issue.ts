/**
 * 问题严重程度
 */
export type IssueSeverity = "critical" | "major" | "minor" | "suggestion";

/**
 * 审核问题对象
 * 对齐设计文档 5.3 结果输出对象 - ReviewIssue
 */
export interface ReviewIssue {
  id: string;
  reviewTaskId: string;
  /** 问题描述 */
  description: string;
  /** 严重程度 */
  severity: IssueSeverity;
  /** 关联模块编码 */
  moduleCode?: string;
  /** 关联字段编码 */
  fieldCode?: string;
  /** 整改建议 */
  suggestion?: string;
  /** 是否需要整改 */
  requiresRectification: boolean;
  createdAt: string;
}

export function createReviewIssue(
  overrides: Partial<ReviewIssue> = {},
): ReviewIssue {
  return {
    id: "issue_1",
    reviewTaskId: "review_1",
    description: "能源计量设备未校准",
    severity: "major",
    requiresRectification: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

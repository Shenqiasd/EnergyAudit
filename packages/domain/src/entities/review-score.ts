/**
 * 审核评分对象
 * 对齐设计文档 5.3 结果输出对象 - ReviewScore
 */
export interface ReviewScore {
  id: string;
  reviewTaskId: string;
  /** 评分类别 (如 数据完整性, 数据准确性, 节能措施合理性) */
  category: string;
  /** 得分 */
  score: number;
  /** 满分 */
  maxScore: number;
  /** 评语 */
  comment?: string;
}

export function createReviewScore(
  overrides: Partial<ReviewScore> = {},
): ReviewScore {
  return {
    id: "score_1",
    reviewTaskId: "review_1",
    category: "数据完整性",
    score: 85,
    maxScore: 100,
    ...overrides,
  };
}

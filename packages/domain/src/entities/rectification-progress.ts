/**
 * 整改进度对象
 * 对齐设计文档 5.3 结果输出对象 - RectificationProgress
 */
export interface RectificationProgress {
  id: string;
  rectificationTaskId: string;
  /** 进度百分比 0-100 */
  progressPercent: number;
  /** 进度说明 */
  note: string;
  /** 附件 ID 列表 (JSON array) */
  attachmentIds?: string;
  /** 记录人 */
  recordedBy: string;
  createdAt: string;
}

export function createRectificationProgress(
  overrides: Partial<RectificationProgress> = {},
): RectificationProgress {
  return {
    id: "progress_1",
    rectificationTaskId: "rectification_1",
    progressPercent: 50,
    note: "已联系校准单位",
    recordedBy: "user_1",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

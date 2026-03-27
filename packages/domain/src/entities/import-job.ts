/**
 * 导入任务状态
 */
export type ImportJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "partially_completed";

/**
 * 导入任务对象
 * 对齐设计文档 5.2 业务运行对象 - ImportJob
 */
export interface ImportJob {
  id: string;
  auditProjectId: string;
  moduleCode: string;
  /** 上传文件附件 ID */
  fileAttachmentId: string;
  status: ImportJobStatus;
  /** 总行数 */
  totalRows?: number;
  /** 成功行数 */
  successRows?: number;
  /** 失败行数 */
  failedRows?: number;
  /** 错误详情 (JSON array) */
  errors?: string;
  /** 处理开始时间 */
  startedAt?: string;
  /** 处理完成时间 */
  completedAt?: string;
  createdAt: string;
}

export function createImportJob(
  overrides: Partial<ImportJob> = {},
): ImportJob {
  return {
    id: "import_1",
    auditProjectId: "project_1",
    moduleCode: "energy-consumption",
    fileAttachmentId: "attachment_1",
    status: "pending",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

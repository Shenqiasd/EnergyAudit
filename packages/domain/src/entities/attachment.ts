/**
 * 统一附件对象
 * 对齐设计文档 5.1 平台核心对象 - Attachment
 */
export interface Attachment {
  id: string;
  /** 关联业务对象类型 */
  ownerType: string;
  /** 关联业务对象 ID */
  ownerId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  /** 存储路径 (S3 key) */
  storagePath: string;
  /** 上传人 */
  uploadedBy: string;
  createdAt: string;
}

export function createAttachment(
  overrides: Partial<Attachment> = {},
): Attachment {
  return {
    id: "attachment_1",
    ownerType: "report",
    ownerId: "report_1",
    fileName: "审计报告.docx",
    fileSize: 1024000,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    storagePath: "reports/report_1/审计报告.docx",
    uploadedBy: "user_1",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

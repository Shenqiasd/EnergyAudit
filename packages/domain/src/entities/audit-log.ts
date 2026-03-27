/**
 * 审计日志对象
 * 对齐设计文档 5.1 平台核心对象 - AuditLog
 */
export interface AuditLog {
  id: string;
  /** 操作人 ID */
  userId: string;
  /** 操作人角色 */
  userRole: string;
  /** 操作类型 (如 login, data_submit, review_approve, report_generate) */
  action: string;
  /** 关联业务对象类型 */
  targetType?: string;
  /** 关联业务对象 ID */
  targetId?: string;
  /** 操作详情 (JSON) */
  detail?: string;
  /** IP 地址 */
  ipAddress?: string;
  createdAt: string;
}

export function createAuditLog(
  overrides: Partial<AuditLog> = {},
): AuditLog {
  return {
    id: "log_1",
    userId: "user_1",
    userRole: "enterprise_admin",
    action: "data_submit",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

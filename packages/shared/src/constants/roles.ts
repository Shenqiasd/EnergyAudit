export const PLATFORM_ROLES = [
  "enterprise_user",
  "enterprise_admin",
  "manager",
  "reviewer",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/**
 * 项目成员角色 — 对齐设计文档 ProjectMember.role
 */
export const PROJECT_MEMBER_ROLES = [
  "enterprise_contact",
  "enterprise_filler",
  "assigned_reviewer",
  "project_manager",
] as const;

export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLES)[number];

/**
 * 企业准入状态 — 对齐设计文档 6.1
 */
export const ENTERPRISE_ADMISSION_STATUSES = [
  "pending_review",
  "approved",
  "rejected",
  "suspended",
  "locked",
  "expired",
] as const;

export type EnterpriseAdmissionStatus =
  (typeof ENTERPRISE_ADMISSION_STATUSES)[number];

/**
 * 审计项目状态 — 对齐设计文档 6.2（12 状态）
 */
export const AUDIT_PROJECT_STATUSES = [
  "pending_start",
  "configuring",
  "filing",
  "pending_submit",
  "pending_report",
  "report_processing",
  "pending_review",
  "in_review",
  "pending_rectification",
  "in_rectification",
  "completed",
  "closed",
] as const;

export type AuditProjectStatus = (typeof AUDIT_PROJECT_STATUSES)[number];

/**
 * 填报记录状态 — 对齐设计文档 6.3（7 状态）
 */
export const DATA_RECORD_STATUSES = [
  "draft",
  "saved",
  "validation_failed",
  "pending_submit",
  "submitted",
  "returned",
  "archived",
] as const;

export type DataRecordStatus = (typeof DATA_RECORD_STATUSES)[number];

/**
 * 报告状态 — 对齐设计文档 6.4（8 状态）
 */
export const REPORT_STATUSES = [
  "not_generated",
  "draft_generated",
  "enterprise_revising",
  "pending_final_upload",
  "final_uploaded",
  "in_review",
  "archived",
  "voided",
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

/**
 * 审核任务状态 — 对齐设计文档 6.5（7 状态）
 */
export const REVIEW_TASK_STATUSES = [
  "pending_assignment",
  "assigned",
  "in_review",
  "pending_confirmation",
  "returned",
  "completed",
  "closed",
] as const;

export type ReviewTaskStatus = (typeof REVIEW_TASK_STATUSES)[number];

/**
 * 整改任务状态 — 对齐设计文档 6.6（7 状态）
 */
export const RECTIFICATION_TASK_STATUSES = [
  "pending_issue",
  "pending_claim",
  "in_progress",
  "pending_acceptance",
  "completed",
  "delayed",
  "closed",
] as const;

export type RectificationTaskStatus =
  (typeof RECTIFICATION_TASK_STATUSES)[number];

/**
 * 审核问题严重程度
 */
export const ISSUE_SEVERITIES = [
  "critical",
  "major",
  "minor",
  "suggestion",
] as const;

export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number];

/**
 * 校验结果严重程度
 */
export const VALIDATION_SEVERITIES = ["error", "warning", "info"] as const;

export type ValidationSeverity = (typeof VALIDATION_SEVERITIES)[number];

/**
 * 导入任务状态
 */
export const IMPORT_JOB_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
  "partially_completed",
] as const;

export type ImportJobStatus = (typeof IMPORT_JOB_STATUSES)[number];

/**
 * 外部绑定同步状态
 */
export const EXTERNAL_BINDING_SYNC_STATUSES = [
  "pending",
  "synced",
  "failed",
  "degraded",
] as const;

export type ExternalBindingSyncStatus =
  (typeof EXTERNAL_BINDING_SYNC_STATUSES)[number];

/**
 * 业务类型 — 对齐设计文档第16章（平台合并预留）
 */
export const BUSINESS_TYPES = [
  "energy_audit",
  "energy_diagnosis",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

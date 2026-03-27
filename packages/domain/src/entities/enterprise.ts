/**
 * 企业准入状态
 * 对齐设计文档 6.1 企业准入状态
 */
export type EnterpriseAdmissionStatus =
  | "pending_review"    // 待审核
  | "approved"          // 已通过
  | "rejected"          // 已驳回
  | "suspended"         // 已停用
  | "locked"            // 已锁定
  | "expired";          // 已过期

export type ExternalBindingStatus = "pending" | "synced" | "failed" | "degraded";
export type UserAccountStatus = "active" | "disabled";

/**
 * 企业主档案
 * 对齐设计文档 5.1 平台核心对象 - Enterprise
 */
export interface Enterprise {
  id: string;
  unifiedSocialCreditCode: string;
  name: string;
  admissionStatus: EnterpriseAdmissionStatus;
  /** 行业分类编码 */
  industryCode?: string;
  /** 企业联系人 */
  contactPerson?: string;
  /** 联系电话 */
  contactPhone?: string;
  /** 联系邮箱 */
  contactEmail?: string;
  /** 企业地址 */
  address?: string;
  /** 备注 */
  notes?: string;
  /** 账号过期日期 */
  expiryDate?: string;
  /** 最近登录时间 */
  lastLoginAt?: string;
  /** 排序标识 */
  sortOrder?: number;
  /** 是否启用 */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 企业与外部系统映射关系
 * 对齐设计文档 11.4 绑定机制
 */
export interface EnterpriseExternalBinding {
  id: string;
  enterpriseId: string;
  externalSystem: string;
  externalId: string;
  syncStatus: ExternalBindingStatus;
  /** 最近同步成功时间 */
  lastSyncedAt?: string;
  /** 最近同步快照 (降级展示用) */
  lastSuccessfulSnapshot?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 平台账号对象
 * 对齐设计文档 5.1 平台核心对象 - UserAccount
 */
export interface UserAccount {
  id: string;
  enterpriseId?: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  status: UserAccountStatus;
  /** 外部身份映射 ID (OIDC subject) */
  externalIdentityId?: string;
  createdAt: string;
  updatedAt: string;
}

export function createEnterprise(
  overrides: Partial<Enterprise> = {},
): Enterprise {
  return {
    id: "ent_1",
    unifiedSocialCreditCode: "91310000123456789X",
    name: "示例企业",
    admissionStatus: "pending_review",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createEnterpriseExternalBinding(
  overrides: Partial<EnterpriseExternalBinding> = {},
): EnterpriseExternalBinding {
  return {
    id: "binding_1",
    enterpriseId: "ent_1",
    externalSystem: "enterprise-info",
    externalId: "external_ent_1",
    syncStatus: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createUserAccount(
  overrides: Partial<UserAccount> = {},
): UserAccount {
  return {
    id: "user_1",
    email: "owner@example.com",
    name: "示例用户",
    role: "enterprise_admin",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

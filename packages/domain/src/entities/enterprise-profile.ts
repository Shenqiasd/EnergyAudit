/**
 * 审计期企业信息快照
 * 对齐设计文档 5.2 业务运行对象 - EnterpriseProfile
 * 项目创建时冻结企业信息，外部主数据变化不影响历史项目快照
 */
export interface EnterpriseProfile {
  id: string;
  auditProjectId: string;
  enterpriseId: string;
  /** 快照时企业名称 */
  name: string;
  /** 快照时统一社会信用代码 */
  unifiedSocialCreditCode: string;
  /** 快照时行业分类 */
  industryCode?: string;
  /** 快照时联系人 */
  contactPerson?: string;
  /** 快照时联系电话 */
  contactPhone?: string;
  /** 快照时联系邮箱 */
  contactEmail?: string;
  /** 快照时企业地址 */
  address?: string;
  /** 快照时间 */
  snapshotAt: string;
}

export function createEnterpriseProfile(
  overrides: Partial<EnterpriseProfile> = {},
): EnterpriseProfile {
  return {
    id: "profile_1",
    auditProjectId: "project_1",
    enterpriseId: "ent_1",
    name: "示例企业",
    unifiedSocialCreditCode: "91310000123456789X",
    snapshotAt: new Date().toISOString(),
    ...overrides,
  };
}

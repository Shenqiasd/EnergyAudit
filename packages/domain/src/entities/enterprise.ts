export type EnterpriseStatus = "pending" | "active" | "locked" | "expired";
export type ExternalBindingStatus = "pending" | "synced" | "failed";
export type UserAccountStatus = "active" | "disabled";

export interface Enterprise {
  id: string;
  unifiedSocialCreditCode: string;
  name: string;
  status: EnterpriseStatus;
}

export interface EnterpriseExternalBinding {
  id: string;
  enterpriseId: string;
  externalSystem: string;
  externalId: string;
  syncStatus: ExternalBindingStatus;
}

export interface UserAccount {
  id: string;
  enterpriseId?: string;
  email: string;
  role: string;
  status: UserAccountStatus;
}

export function createEnterprise(
  overrides: Partial<Enterprise> = {},
): Enterprise {
  return {
    id: "ent_1",
    unifiedSocialCreditCode: "91310000123456789X",
    name: "示例企业",
    status: "pending",
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
    ...overrides,
  };
}

export function createUserAccount(
  overrides: Partial<UserAccount> = {},
): UserAccount {
  return {
    id: "user_1",
    email: "owner@example.com",
    role: "enterprise_admin",
    status: "active",
    ...overrides,
  };
}

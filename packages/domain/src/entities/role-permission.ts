/**
 * 角色对象
 * 对齐设计文档 5.1 平台核心对象 - Role
 */
export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  /** 是否为系统内置角色 */
  isBuiltin: boolean;
}

/**
 * 权限对象
 * 对齐设计文档 5.1 平台核心对象 - Permission
 */
export interface Permission {
  id: string;
  code: string;
  name: string;
  /** 权限分组 (如 enterprise, audit_project, report, review) */
  group: string;
}

/**
 * 角色-权限关联
 */
export interface RolePermission {
  roleId: string;
  permissionId: string;
}

export function createRole(overrides: Partial<Role> = {}): Role {
  return {
    id: "role_1",
    code: "enterprise_admin",
    name: "企业管理员",
    isBuiltin: true,
    ...overrides,
  };
}

export function createPermission(
  overrides: Partial<Permission> = {},
): Permission {
  return {
    id: "perm_1",
    code: "enterprise:read",
    name: "查看企业",
    group: "enterprise",
    ...overrides,
  };
}

export function createRolePermission(
  overrides: Partial<RolePermission & { id: string }> = {},
): RolePermission & { id: string } {
  return {
    id: "rp_1",
    roleId: "role_1",
    permissionId: "perm_1",
    ...overrides,
  };
}

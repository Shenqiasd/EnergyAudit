/**
 * 项目成员角色
 */
export type ProjectMemberRole =
  | "enterprise_contact"   // 企业联系人
  | "enterprise_filler"    // 企业填报人
  | "assigned_reviewer"    // 指定审核员
  | "project_manager";     // 项目管理员

/**
 * 项目参与关系
 * 对齐设计文档 5.2 业务运行对象 - ProjectMember
 */
export interface ProjectMember {
  id: string;
  auditProjectId: string;
  userId: string;
  role: ProjectMemberRole;
  /** 加入时间 */
  joinedAt: string;
}

export function createProjectMember(
  overrides: Partial<ProjectMember> = {},
): ProjectMember {
  return {
    id: "member_1",
    auditProjectId: "project_1",
    userId: "user_1",
    role: "enterprise_contact",
    joinedAt: new Date().toISOString(),
    ...overrides,
  };
}

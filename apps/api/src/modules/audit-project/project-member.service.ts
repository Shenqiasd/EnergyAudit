import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface AddMemberDto {
  userId: string;
  role: string;
}

@Injectable()
export class ProjectMemberService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getMembers(projectId: string) {
    const members = await this.db
      .select({
        id: schema.projectMembers.id,
        auditProjectId: schema.projectMembers.auditProjectId,
        userId: schema.projectMembers.userId,
        role: schema.projectMembers.role,
        joinedAt: schema.projectMembers.joinedAt,
        userName: schema.userAccounts.name,
        userEmail: schema.userAccounts.email,
      })
      .from(schema.projectMembers)
      .leftJoin(
        schema.userAccounts,
        eq(schema.projectMembers.userId, schema.userAccounts.id),
      )
      .where(eq(schema.projectMembers.auditProjectId, projectId));

    return members;
  }

  async addMember(projectId: string, dto: AddMemberDto) {
    const [project] = await this.db
      .select()
      .from(schema.auditProjects)
      .where(eq(schema.auditProjects.id, projectId))
      .limit(1);

    if (!project) {
      throw new HttpException('项目不存在', HttpStatus.NOT_FOUND);
    }

    const [user] = await this.db
      .select()
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.id, dto.userId))
      .limit(1);

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    const validRoles = ['enterprise_contact', 'enterprise_filler', 'assigned_reviewer', 'project_manager'];
    if (!validRoles.includes(dto.role)) {
      throw new HttpException('无效的成员角色', HttpStatus.BAD_REQUEST);
    }

    const existing = await this.db
      .select()
      .from(schema.projectMembers)
      .where(
        and(
          eq(schema.projectMembers.auditProjectId, projectId),
          eq(schema.projectMembers.userId, dto.userId),
          eq(schema.projectMembers.role, dto.role),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new HttpException('该成员已存在相同角色', HttpStatus.CONFLICT);
    }

    const id = `pm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const [member] = await this.db
      .insert(schema.projectMembers)
      .values({
        id,
        auditProjectId: projectId,
        userId: dto.userId,
        role: dto.role,
      })
      .returning();

    return member;
  }

  async removeMember(projectId: string, memberId: string) {
    const [member] = await this.db
      .select()
      .from(schema.projectMembers)
      .where(
        and(
          eq(schema.projectMembers.id, memberId),
          eq(schema.projectMembers.auditProjectId, projectId),
        ),
      )
      .limit(1);

    if (!member) {
      throw new HttpException('成员不存在', HttpStatus.NOT_FOUND);
    }

    await this.db
      .delete(schema.projectMembers)
      .where(eq(schema.projectMembers.id, memberId));

    return { success: true };
  }

  async validateFilingReadiness(projectId: string): Promise<{ ready: boolean; missing: string[] }> {
    const members = await this.db
      .select()
      .from(schema.projectMembers)
      .where(eq(schema.projectMembers.auditProjectId, projectId));

    const missing: string[] = [];
    if (!members.some((m) => m.role === 'enterprise_contact')) {
      missing.push('企业联系人');
    }
    if (!members.some((m) => m.role === 'enterprise_filler')) {
      missing.push('填报人');
    }

    return { ready: missing.length === 0, missing };
  }
}

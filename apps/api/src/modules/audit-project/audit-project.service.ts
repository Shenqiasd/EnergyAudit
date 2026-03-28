import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, count, eq, ilike, sql } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';
import { NotificationTriggerService } from '../notification/notification-trigger.service';
import {
  canTransition,
  checkPreconditions,
  getValidNextStates,
} from './project-status-machine';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { PreconditionContext } from './project-status-machine';

export interface AuditProjectListQuery {
  page?: number;
  pageSize?: number;
  batchId?: string;
  status?: string;
  enterpriseId?: string;
  enterpriseName?: string;
  businessType?: string;
}

export interface TransitionDto {
  targetStatus: string;
  userId?: string;
  reason?: string;
}

@Injectable()
export class AuditProjectService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly notificationTrigger: NotificationTriggerService,
  ) {}

  async findAll(query: AuditProjectListQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.batchId) {
      conditions.push(eq(schema.auditProjects.batchId, query.batchId));
    }
    if (query.status) {
      conditions.push(eq(schema.auditProjects.status, query.status));
    }
    if (query.enterpriseId) {
      conditions.push(eq(schema.auditProjects.enterpriseId, query.enterpriseId));
    }
    if (query.businessType) {
      conditions.push(eq(schema.auditProjects.businessType, query.businessType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      this.db
        .select({
          id: schema.auditProjects.id,
          enterpriseId: schema.auditProjects.enterpriseId,
          batchId: schema.auditProjects.batchId,
          status: schema.auditProjects.status,
          businessType: schema.auditProjects.businessType,
          templateVersionId: schema.auditProjects.templateVersionId,
          deadline: schema.auditProjects.deadline,
          isOverdue: schema.auditProjects.isOverdue,
          configComplete: schema.auditProjects.configComplete,
          createdAt: schema.auditProjects.createdAt,
          updatedAt: schema.auditProjects.updatedAt,
          enterpriseName: schema.enterprises.name,
        })
        .from(schema.auditProjects)
        .leftJoin(
          schema.enterprises,
          eq(schema.auditProjects.enterpriseId, schema.enterprises.id),
        )
        .where(
          query.enterpriseName
            ? and(whereClause, ilike(schema.enterprises.name, `%${query.enterpriseName}%`))
            : whereClause,
        )
        .orderBy(sql`${schema.auditProjects.createdAt} desc`)
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(schema.auditProjects)
        .leftJoin(
          schema.enterprises,
          eq(schema.auditProjects.enterpriseId, schema.enterprises.id),
        )
        .where(
          query.enterpriseName
            ? and(whereClause, ilike(schema.enterprises.name, `%${query.enterpriseName}%`))
            : whereClause,
        ),
    ]);

    return {
      items,
      total: totalResult[0]?.total ?? 0,
      page,
      pageSize,
    };
  }

  async findById(id: string) {
    const results = await this.db
      .select({
        id: schema.auditProjects.id,
        enterpriseId: schema.auditProjects.enterpriseId,
        batchId: schema.auditProjects.batchId,
        status: schema.auditProjects.status,
        businessType: schema.auditProjects.businessType,
        templateVersionId: schema.auditProjects.templateVersionId,
        deadline: schema.auditProjects.deadline,
        isOverdue: schema.auditProjects.isOverdue,
        configComplete: schema.auditProjects.configComplete,
        createdAt: schema.auditProjects.createdAt,
        updatedAt: schema.auditProjects.updatedAt,
        enterpriseName: schema.enterprises.name,
        batchName: schema.auditBatches.name,
      })
      .from(schema.auditProjects)
      .leftJoin(
        schema.enterprises,
        eq(schema.auditProjects.enterpriseId, schema.enterprises.id),
      )
      .leftJoin(
        schema.auditBatches,
        eq(schema.auditProjects.batchId, schema.auditBatches.id),
      )
      .where(eq(schema.auditProjects.id, id))
      .limit(1);

    if (results.length === 0) {
      throw new HttpException('项目不存在', HttpStatus.NOT_FOUND);
    }

    const project = results[0];

    const now = new Date();
    const isOverdue = project.deadline && project.status !== 'completed' && project.status !== 'closed'
      ? new Date(project.deadline) < now
      : false;

    if (isOverdue !== project.isOverdue) {
      await this.db
        .update(schema.auditProjects)
        .set({ isOverdue, updatedAt: now })
        .where(eq(schema.auditProjects.id, id));
    }

    return { ...project, isOverdue, validNextStates: getValidNextStates(project.status) };
  }

  async transition(id: string, dto: TransitionDto) {
    const [project] = await this.db
      .select()
      .from(schema.auditProjects)
      .where(eq(schema.auditProjects.id, id))
      .limit(1);

    if (!project) {
      throw new HttpException('项目不存在', HttpStatus.NOT_FOUND);
    }

    const fromStatus = project.status;
    const toStatus = dto.targetStatus;

    if (!canTransition(fromStatus, toStatus)) {
      throw new HttpException(
        `无法从状态 "${fromStatus}" 转换到 "${toStatus}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const members = await this.db
      .select()
      .from(schema.projectMembers)
      .where(eq(schema.projectMembers.auditProjectId, id));

    const context: PreconditionContext = {
      configComplete: project.configComplete,
      hasContact: members.some((m) => m.role === 'enterprise_contact'),
      hasFiller: members.some((m) => m.role === 'enterprise_filler'),
    };

    const preconditionResult = checkPreconditions(fromStatus, toStatus, context);
    if (!preconditionResult.allowed) {
      throw new HttpException(
        preconditionResult.message ?? '前置条件不满足',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.db.transaction(async (tx) => {
      const updated = await tx
        .update(schema.auditProjects)
        .set({
          status: toStatus,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.auditProjects.id, id),
            eq(schema.auditProjects.status, fromStatus),
          ),
        )
        .returning();

      if (updated.length === 0) {
        throw new HttpException(
          '状态已被其他操作修改，请刷新后重试',
          HttpStatus.CONFLICT,
        );
      }

      const transitionId = `pst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await tx.insert(schema.projectStatusTransitions).values({
        id: transitionId,
        projectId: id,
        fromStatus,
        toStatus,
        userId: dto.userId ?? null,
        reason: dto.reason ?? null,
      });

      const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await tx.insert(schema.auditLogs).values({
        id: logId,
        userId: dto.userId ?? 'system',
        userRole: 'manager',
        action: 'project_transition',
        targetType: 'audit_project',
        targetId: id,
        detail: JSON.stringify({ fromStatus, toStatus, reason: dto.reason }),
      });
    });

    // Trigger notification for status change
    try {
      await this.notificationTrigger.onProjectStatusChange(id, fromStatus, toStatus);
    } catch {
      // Non-critical: don't fail the transition if notification fails
    }

    return { projectId: id, fromStatus, toStatus };
  }

  async getTimeline(id: string) {
    const transitions = await this.db
      .select()
      .from(schema.projectStatusTransitions)
      .where(eq(schema.projectStatusTransitions.projectId, id))
      .orderBy(sql`${schema.projectStatusTransitions.transitionedAt} asc`);

    return transitions;
  }

  async extendDeadline(id: string, newDeadline: string, reason: string, userId?: string) {
    const [project] = await this.db
      .select()
      .from(schema.auditProjects)
      .where(eq(schema.auditProjects.id, id))
      .limit(1);

    if (!project) {
      throw new HttpException('项目不存在', HttpStatus.NOT_FOUND);
    }

    const deadline = new Date(newDeadline);
    const now = new Date();
    const isOverdue = deadline < now;

    await this.db
      .update(schema.auditProjects)
      .set({
        deadline,
        isOverdue,
        updatedAt: now,
      })
      .where(eq(schema.auditProjects.id, id));

    // Record in audit logs
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await this.db.insert(schema.auditLogs).values({
      id: logId,
      userId: userId ?? 'system',
      userRole: 'manager',
      action: 'extend_deadline',
      targetType: 'audit_project',
      targetId: id,
      detail: JSON.stringify({
        oldDeadline: project.deadline?.toISOString() ?? null,
        newDeadline: deadline.toISOString(),
        reason,
      }),
    });

    return { id, deadline: deadline.toISOString(), isOverdue, reason };
  }

  async updateOverdueStatus() {
    const now = new Date();
    await this.db
      .update(schema.auditProjects)
      .set({ isOverdue: true, updatedAt: now })
      .where(
        and(
          eq(schema.auditProjects.isOverdue, false),
          sql`${schema.auditProjects.deadline} < ${now}`,
          sql`${schema.auditProjects.status} NOT IN ('completed', 'closed')`,
        ),
      );
  }
}

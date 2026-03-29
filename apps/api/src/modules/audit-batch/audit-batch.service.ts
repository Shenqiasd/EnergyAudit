import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CreateBatchDto {
  name: string;
  year: number;
  description?: string;
  filingDeadline?: string;
  reviewDeadline?: string;
  templateVersionId?: string;
  createdBy?: string;
  businessType?: string;
}

export interface UpdateBatchDto {
  name?: string;
  description?: string;
  filingDeadline?: string;
  reviewDeadline?: string;
}

export interface BatchListQuery {
  page?: number;
  pageSize?: number;
  year?: number;
  status?: string;
  businessType?: string;
}

export interface AssignEnterprisesDto {
  enterpriseIds: string[];
}

@Injectable()
export class AuditBatchService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(dto: CreateBatchDto) {
    const id = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const [batch] = await this.db
      .insert(schema.auditBatches)
      .values({
        id,
        name: dto.name,
        year: dto.year,
        status: 'draft',
        businessType: dto.businessType ?? 'energy_audit',
        description: dto.description ?? null,
        filingDeadline: dto.filingDeadline ? new Date(dto.filingDeadline) : null,
        reviewDeadline: dto.reviewDeadline ? new Date(dto.reviewDeadline) : null,
        templateVersionId: dto.templateVersionId ?? null,
        createdBy: dto.createdBy ?? null,
      })
      .returning();

    return batch;
  }

  async findAll(query: BatchListQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.year) {
      conditions.push(eq(schema.auditBatches.year, Number(query.year)));
    }
    if (query.status) {
      conditions.push(eq(schema.auditBatches.status, query.status));
    }
    if (query.businessType) {
      conditions.push(eq(schema.auditBatches.businessType, query.businessType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      this.db
        .select()
        .from(schema.auditBatches)
        .where(whereClause)
        .orderBy(sql`${schema.auditBatches.createdAt} desc`)
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(schema.auditBatches)
        .where(whereClause),
    ]);

    const itemsWithStats = await Promise.all(
      items.map(async (batch) => {
        const projectCount = await this.db
          .select({ total: count() })
          .from(schema.auditProjects)
          .where(eq(schema.auditProjects.batchId, batch.id));
        return { ...batch, projectCount: projectCount[0]?.total ?? 0 };
      }),
    );

    return {
      items: itemsWithStats,
      total: totalResult[0]?.total ?? 0,
      page,
      pageSize,
    };
  }

  async findById(id: string) {
    const [batch] = await this.db
      .select()
      .from(schema.auditBatches)
      .where(eq(schema.auditBatches.id, id))
      .limit(1);

    if (!batch) {
      throw new HttpException('批次不存在', HttpStatus.NOT_FOUND);
    }

    const statusCounts = await this.db
      .select({
        status: schema.auditProjects.status,
        count: count(),
      })
      .from(schema.auditProjects)
      .where(eq(schema.auditProjects.batchId, id))
      .groupBy(schema.auditProjects.status);

    const totalProjects = statusCounts.reduce((sum, s) => sum + s.count, 0);

    const stats: Record<string, number> = {};
    for (const row of statusCounts) {
      stats[row.status] = row.count;
    }

    return { ...batch, stats, totalProjects };
  }

  async update(id: string, dto: UpdateBatchDto) {
    const [existing] = await this.db
      .select()
      .from(schema.auditBatches)
      .where(eq(schema.auditBatches.id, id))
      .limit(1);

    if (!existing) {
      throw new HttpException('批次不存在', HttpStatus.NOT_FOUND);
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.filingDeadline !== undefined) updateData.filingDeadline = new Date(dto.filingDeadline);
    if (dto.reviewDeadline !== undefined) updateData.reviewDeadline = new Date(dto.reviewDeadline);

    const [updated] = await this.db
      .update(schema.auditBatches)
      .set(updateData)
      .where(eq(schema.auditBatches.id, id))
      .returning();

    return updated;
  }

  async assignEnterprises(batchId: string, dto: AssignEnterprisesDto) {
    const [batch] = await this.db
      .select()
      .from(schema.auditBatches)
      .where(eq(schema.auditBatches.id, batchId))
      .limit(1);

    if (!batch) {
      throw new HttpException('批次不存在', HttpStatus.NOT_FOUND);
    }

    const results: Array<{ enterpriseId: string; projectId: string; status: string }> = [];
    const errors: Array<{ enterpriseId: string; error: string }> = [];

    for (const enterpriseId of dto.enterpriseIds) {
      const [enterprise] = await this.db
        .select()
        .from(schema.enterprises)
        .where(eq(schema.enterprises.id, enterpriseId))
        .limit(1);

      if (!enterprise) {
        errors.push({ enterpriseId, error: '企业不存在' });
        continue;
      }

      const existing = await this.db
        .select()
        .from(schema.auditProjects)
        .where(
          and(
            eq(schema.auditProjects.batchId, batchId),
            eq(schema.auditProjects.enterpriseId, enterpriseId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        errors.push({ enterpriseId, error: '该企业已分配到此批次' });
        continue;
      }

      const projectId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await this.db.insert(schema.auditProjects).values({
        id: projectId,
        enterpriseId,
        batchId,
        status: 'pending_start',
        businessType: batch.businessType ?? 'energy_audit',
        templateVersionId: batch.templateVersionId ?? null,
        deadline: batch.filingDeadline ?? null,
        isOverdue: false,
        configComplete: false,
      });

      results.push({ enterpriseId, projectId, status: 'pending_start' });
    }

    return { created: results, errors };
  }

  async extendDeadline(
    id: string,
    body: { newDeadline: string; reason: string; deadlineType?: 'filing' | 'review' },
    userId?: string,
    userRole?: string,
  ) {
    const [batch] = await this.db
      .select()
      .from(schema.auditBatches)
      .where(eq(schema.auditBatches.id, id))
      .limit(1);

    if (!batch) {
      throw new HttpException('批次不存在', HttpStatus.NOT_FOUND);
    }

    const deadline = new Date(body.newDeadline);
    const now = new Date();
    const deadlineType = body.deadlineType ?? 'filing';

    const updateData: Record<string, unknown> = { updatedAt: now };
    if (deadlineType === 'filing') {
      updateData.filingDeadline = deadline;
    } else {
      updateData.reviewDeadline = deadline;
    }

    // Update overdue status based on new deadline
    if (deadline > now) {
      // Check if both deadlines are now in future
      const otherDeadline = deadlineType === 'filing' ? batch.reviewDeadline : batch.filingDeadline;
      if (!otherDeadline || otherDeadline > now) {
        updateData.isOverdue = false;
      }
    } else {
      // New deadline is in the past, mark as overdue
      updateData.isOverdue = true;
    }

    const updated = await this.db.transaction(async (tx) => {
      await tx
        .update(schema.auditBatches)
        .set(updateData)
        .where(eq(schema.auditBatches.id, id));

      // Cascade deadline to child projects when filing deadline changes
      if (deadlineType === 'filing') {
        const isProjectOverdue = deadline < now;
        await tx
          .update(schema.auditProjects)
          .set({
            deadline,
            isOverdue: isProjectOverdue
              ? sql`CASE WHEN ${schema.auditProjects.status} NOT IN ('completed', 'closed') THEN true ELSE is_overdue END`
              : false,
            updatedAt: now,
          })
          .where(eq(schema.auditProjects.batchId, id));
      }

      // Record in audit logs
      const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await tx.insert(schema.auditLogs).values({
        id: logId,
        userId: userId ?? 'system',
        userRole: userRole ?? 'manager',
        action: 'extend_deadline',
        targetType: 'audit_batch',
        targetId: id,
        detail: JSON.stringify({
          deadlineType,
          oldDeadline: deadlineType === 'filing'
            ? batch.filingDeadline?.toISOString() ?? null
            : batch.reviewDeadline?.toISOString() ?? null,
          newDeadline: deadline.toISOString(),
          reason: body.reason,
        }),
      });

      const [result] = await tx
        .select()
        .from(schema.auditBatches)
        .where(eq(schema.auditBatches.id, id))
        .limit(1);

      return result;
    });

    return updated;
  }

  async close(id: string) {
    const [batch] = await this.db
      .select()
      .from(schema.auditBatches)
      .where(eq(schema.auditBatches.id, id))
      .limit(1);

    if (!batch) {
      throw new HttpException('批次不存在', HttpStatus.NOT_FOUND);
    }

    if (batch.status === 'closed') {
      throw new HttpException('批次已关闭', HttpStatus.BAD_REQUEST);
    }

    const [updated] = await this.db
      .update(schema.auditBatches)
      .set({ status: 'closed', updatedAt: new Date() })
      .where(eq(schema.auditBatches.id, id))
      .returning();

    return updated;
  }
}

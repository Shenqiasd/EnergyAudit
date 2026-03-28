import { Inject, Injectable } from '@nestjs/common';
import { eq, sql, and, desc, inArray } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface RectificationLedgerQuery {
  batchId?: string;
  enterpriseId?: string;
  status?: string;
  isOverdue?: string;
  page?: string;
  pageSize?: string;
}

export interface RectificationLedgerItem {
  rectificationTaskId: string;
  projectId: string;
  enterpriseId: string;
  enterpriseName: string;
  title: string;
  description: string | null;
  status: string;
  isOverdue: boolean;
  progressPercent: number;
  deadline: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface RectificationLedgerResponse {
  items: RectificationLedgerItem[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class RectificationLedgerService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getLedger(
    query: RectificationLedgerQuery,
  ): Promise<RectificationLedgerResponse> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.enterpriseId) {
      conditions.push(
        eq(schema.auditProjects.enterpriseId, query.enterpriseId),
      );
    }
    if (query.status) {
      conditions.push(eq(schema.rectificationTasks.status, query.status));
    }
    if (query.isOverdue === 'true') {
      conditions.push(eq(schema.rectificationTasks.isOverdue, true));
    }
    if (query.batchId) {
      conditions.push(eq(schema.auditProjects.batchId, query.batchId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(schema.rectificationTasks)
      .innerJoin(
        schema.auditProjects,
        eq(
          schema.rectificationTasks.auditProjectId,
          schema.auditProjects.id,
        ),
      )
      .where(whereClause);

    const total = Number(countResult[0]?.count ?? 0);

    // Data - join enterprises to avoid N+1 for enterprise names
    const rows = await this.db
      .select({
        rectificationTaskId: schema.rectificationTasks.id,
        projectId: schema.auditProjects.id,
        enterpriseId: schema.auditProjects.enterpriseId,
        enterpriseName: schema.enterprises.name,
        title: schema.rectificationTasks.title,
        description: schema.rectificationTasks.description,
        status: schema.rectificationTasks.status,
        isOverdue: schema.rectificationTasks.isOverdue,
        deadline: schema.rectificationTasks.deadline,
        completedAt: schema.rectificationTasks.completedAt,
        createdAt: schema.rectificationTasks.createdAt,
      })
      .from(schema.rectificationTasks)
      .innerJoin(
        schema.auditProjects,
        eq(
          schema.rectificationTasks.auditProjectId,
          schema.auditProjects.id,
        ),
      )
      .innerJoin(
        schema.enterprises,
        eq(schema.auditProjects.enterpriseId, schema.enterprises.id),
      )
      .where(whereClause)
      .orderBy(desc(schema.rectificationTasks.createdAt))
      .limit(pageSize)
      .offset(offset);

    const taskIds = rows.map((r) => r.rectificationTaskId);

    // Batch: latest progress per rectification task
    const progressMap = new Map<string, number>();
    if (taskIds.length > 0) {
      const allProgress = await this.db
        .select({
          rectificationTaskId: schema.rectificationProgress.rectificationTaskId,
          progressPercent: schema.rectificationProgress.progressPercent,
          createdAt: schema.rectificationProgress.createdAt,
        })
        .from(schema.rectificationProgress)
        .where(inArray(schema.rectificationProgress.rectificationTaskId, taskIds))
        .orderBy(desc(schema.rectificationProgress.createdAt));

      for (const p of allProgress) {
        if (!progressMap.has(p.rectificationTaskId)) {
          progressMap.set(p.rectificationTaskId, p.progressPercent);
        }
      }
    }

    const items: RectificationLedgerItem[] = rows.map((row) => ({
      rectificationTaskId: row.rectificationTaskId,
      projectId: row.projectId,
      enterpriseId: row.enterpriseId,
      enterpriseName: row.enterpriseName ?? 'Unknown',
      title: row.title,
      description: row.description,
      status: row.status,
      isOverdue: row.isOverdue,
      progressPercent: progressMap.get(row.rectificationTaskId) ?? 0,
      deadline: row.deadline?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }));

    return { items, total, page, pageSize };
  }
}

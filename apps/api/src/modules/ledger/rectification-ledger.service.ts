import { Inject, Injectable } from '@nestjs/common';
import { eq, sql, and, desc } from 'drizzle-orm';

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

    // Data
    const rows = await this.db
      .select({
        rectificationTaskId: schema.rectificationTasks.id,
        projectId: schema.auditProjects.id,
        enterpriseId: schema.auditProjects.enterpriseId,
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
      .where(whereClause)
      .orderBy(desc(schema.rectificationTasks.createdAt))
      .limit(pageSize)
      .offset(offset);

    const items: RectificationLedgerItem[] = [];
    for (const row of rows) {
      // Get enterprise name
      const [enterprise] = await this.db
        .select({ name: schema.enterprises.name })
        .from(schema.enterprises)
        .where(eq(schema.enterprises.id, row.enterpriseId))
        .limit(1);

      // Get latest progress
      const [latestProgress] = await this.db
        .select({ progressPercent: schema.rectificationProgress.progressPercent })
        .from(schema.rectificationProgress)
        .where(
          eq(
            schema.rectificationProgress.rectificationTaskId,
            row.rectificationTaskId,
          ),
        )
        .orderBy(desc(schema.rectificationProgress.createdAt))
        .limit(1);

      items.push({
        rectificationTaskId: row.rectificationTaskId,
        projectId: row.projectId,
        enterpriseId: row.enterpriseId,
        enterpriseName: enterprise?.name ?? 'Unknown',
        title: row.title,
        description: row.description,
        status: row.status,
        isOverdue: row.isOverdue,
        progressPercent: latestProgress?.progressPercent ?? 0,
        deadline: row.deadline?.toISOString() ?? null,
        completedAt: row.completedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      });
    }

    return { items, total, page, pageSize };
  }
}

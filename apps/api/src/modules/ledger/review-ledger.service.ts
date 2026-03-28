import { Inject, Injectable } from '@nestjs/common';
import { eq, sql, and, desc } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface ReviewLedgerQuery {
  batchId?: string;
  reviewerId?: string;
  status?: string;
  page?: string;
  pageSize?: string;
}

export interface ReviewLedgerItem {
  reviewTaskId: string;
  projectId: string;
  enterpriseId: string;
  enterpriseName: string;
  reviewerId: string;
  status: string;
  totalScore: string | null;
  issueCount: number;
  completedAt: string | null;
  createdAt: string;
}

export interface ReviewLedgerResponse {
  items: ReviewLedgerItem[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class ReviewLedgerService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getLedger(query: ReviewLedgerQuery): Promise<ReviewLedgerResponse> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.reviewerId) {
      conditions.push(eq(schema.reviewTasks.reviewerId, query.reviewerId));
    }
    if (query.status) {
      conditions.push(eq(schema.reviewTasks.status, query.status));
    }
    if (query.batchId) {
      conditions.push(eq(schema.auditProjects.batchId, query.batchId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(schema.reviewTasks)
      .innerJoin(
        schema.auditProjects,
        eq(schema.reviewTasks.auditProjectId, schema.auditProjects.id),
      )
      .where(whereClause);

    const total = Number(countResult[0]?.count ?? 0);

    // Data
    const rows = await this.db
      .select({
        reviewTaskId: schema.reviewTasks.id,
        projectId: schema.auditProjects.id,
        enterpriseId: schema.auditProjects.enterpriseId,
        reviewerId: schema.reviewTasks.reviewerId,
        status: schema.reviewTasks.status,
        totalScore: schema.reviewTasks.totalScore,
        completedAt: schema.reviewTasks.completedAt,
        createdAt: schema.reviewTasks.createdAt,
      })
      .from(schema.reviewTasks)
      .innerJoin(
        schema.auditProjects,
        eq(schema.reviewTasks.auditProjectId, schema.auditProjects.id),
      )
      .where(whereClause)
      .orderBy(desc(schema.reviewTasks.createdAt))
      .limit(pageSize)
      .offset(offset);

    const items: ReviewLedgerItem[] = [];
    for (const row of rows) {
      // Get enterprise name
      const [enterprise] = await this.db
        .select({ name: schema.enterprises.name })
        .from(schema.enterprises)
        .where(eq(schema.enterprises.id, row.enterpriseId))
        .limit(1);

      // Get issue count
      const [issueResult] = await this.db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(schema.reviewIssues)
        .where(eq(schema.reviewIssues.reviewTaskId, row.reviewTaskId));

      items.push({
        reviewTaskId: row.reviewTaskId,
        projectId: row.projectId,
        enterpriseId: row.enterpriseId,
        enterpriseName: enterprise?.name ?? 'Unknown',
        reviewerId: row.reviewerId,
        status: row.status,
        totalScore: row.totalScore,
        issueCount: Number(issueResult?.count ?? 0),
        completedAt: row.completedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      });
    }

    return { items, total, page, pageSize };
  }
}

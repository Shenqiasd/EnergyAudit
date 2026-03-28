import { Inject, Injectable } from '@nestjs/common';
import { eq, sql, and, desc, asc } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface EnterpriseLedgerQuery {
  batchId?: string;
  industryCode?: string;
  status?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface EnterpriseLedgerItem {
  enterpriseId: string;
  enterpriseName: string;
  industryCode: string | null;
  projectId: string;
  projectStatus: string;
  isOverdue: boolean;
  reviewScore: string | null;
  rectificationStatus: string | null;
  filingProgress: number;
}

export interface EnterpriseLedgerResponse {
  items: EnterpriseLedgerItem[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class EnterpriseLedgerService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getLedger(query: EnterpriseLedgerQuery): Promise<EnterpriseLedgerResponse> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.batchId) {
      conditions.push(eq(schema.auditProjects.batchId, query.batchId));
    }
    if (query.industryCode) {
      conditions.push(eq(schema.enterprises.industryCode, query.industryCode));
    }
    if (query.status) {
      conditions.push(eq(schema.auditProjects.status, query.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(schema.auditProjects)
      .innerJoin(
        schema.enterprises,
        eq(schema.auditProjects.enterpriseId, schema.enterprises.id),
      )
      .where(whereClause);

    const total = Number(countResult[0]?.count ?? 0);

    // Determine sort
    const sortOrder = query.sortOrder === 'asc' ? asc : desc;
    let orderByColumn;
    switch (query.sortBy) {
      case 'enterpriseName':
        orderByColumn = sortOrder(schema.enterprises.name);
        break;
      case 'status':
        orderByColumn = sortOrder(schema.auditProjects.status);
        break;
      case 'industryCode':
        orderByColumn = sortOrder(schema.enterprises.industryCode);
        break;
      default:
        orderByColumn = desc(schema.auditProjects.updatedAt);
    }

    // Get paginated data
    const rows = await this.db
      .select({
        enterpriseId: schema.enterprises.id,
        enterpriseName: schema.enterprises.name,
        industryCode: schema.enterprises.industryCode,
        projectId: schema.auditProjects.id,
        projectStatus: schema.auditProjects.status,
        isOverdue: schema.auditProjects.isOverdue,
      })
      .from(schema.auditProjects)
      .innerJoin(
        schema.enterprises,
        eq(schema.auditProjects.enterpriseId, schema.enterprises.id),
      )
      .where(whereClause)
      .orderBy(orderByColumn)
      .limit(pageSize)
      .offset(offset);

    // Enrich with review scores and rectification status
    const items: EnterpriseLedgerItem[] = [];
    for (const row of rows) {
      // Get review score
      const [reviewTask] = await this.db
        .select({ totalScore: schema.reviewTasks.totalScore })
        .from(schema.reviewTasks)
        .where(eq(schema.reviewTasks.auditProjectId, row.projectId))
        .orderBy(desc(schema.reviewTasks.createdAt))
        .limit(1);

      // Get rectification status
      const rectTasks = await this.db
        .select({ status: schema.rectificationTasks.status })
        .from(schema.rectificationTasks)
        .where(eq(schema.rectificationTasks.auditProjectId, row.projectId));

      let rectificationStatus: string | null = null;
      if (rectTasks.length > 0) {
        const allCompleted = rectTasks.every(
          (t) => t.status === 'completed' || t.status === 'verified',
        );
        rectificationStatus = allCompleted ? 'completed' : 'in_progress';
      }

      // Get filing progress
      const dataRecords = await this.db
        .select({ status: schema.dataRecords.status })
        .from(schema.dataRecords)
        .where(eq(schema.dataRecords.auditProjectId, row.projectId));

      const totalRecords = dataRecords.length;
      const submittedRecords = dataRecords.filter(
        (r) => r.status === 'submitted' || r.status === 'approved',
      ).length;
      const filingProgress = totalRecords > 0 ? submittedRecords / totalRecords : 0;

      items.push({
        enterpriseId: row.enterpriseId,
        enterpriseName: row.enterpriseName,
        industryCode: row.industryCode,
        projectId: row.projectId,
        projectStatus: row.projectStatus,
        isOverdue: row.isOverdue,
        reviewScore: reviewTask?.totalScore ?? null,
        rectificationStatus,
        filingProgress,
      });
    }

    return { items, total, page, pageSize };
  }
}

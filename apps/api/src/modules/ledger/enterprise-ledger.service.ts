import { Inject, Injectable } from '@nestjs/common';
import { eq, sql, and, desc, asc, inArray } from 'drizzle-orm';

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

    // Batch-fetch enrichment data to avoid N+1 queries
    const projectIds = rows.map((r) => r.projectId);

    if (projectIds.length === 0) {
      return { items: [], total, page, pageSize };
    }

    // Batch: review scores (latest per project)
    const allReviewTasks = await this.db
      .select({
        auditProjectId: schema.reviewTasks.auditProjectId,
        totalScore: schema.reviewTasks.totalScore,
        createdAt: schema.reviewTasks.createdAt,
      })
      .from(schema.reviewTasks)
      .where(inArray(schema.reviewTasks.auditProjectId, projectIds))
      .orderBy(desc(schema.reviewTasks.createdAt));

    const reviewScoreMap = new Map<string, string | null>();
    for (const rt of allReviewTasks) {
      if (!reviewScoreMap.has(rt.auditProjectId)) {
        reviewScoreMap.set(rt.auditProjectId, rt.totalScore);
      }
    }

    // Batch: rectification statuses
    const allRectTasks = await this.db
      .select({
        auditProjectId: schema.rectificationTasks.auditProjectId,
        status: schema.rectificationTasks.status,
      })
      .from(schema.rectificationTasks)
      .where(inArray(schema.rectificationTasks.auditProjectId, projectIds));

    const rectTasksByProject = new Map<string, string[]>();
    for (const rt of allRectTasks) {
      const statuses = rectTasksByProject.get(rt.auditProjectId) ?? [];
      statuses.push(rt.status);
      rectTasksByProject.set(rt.auditProjectId, statuses);
    }

    // Batch: filing progress (data records)
    const allDataRecords = await this.db
      .select({
        auditProjectId: schema.dataRecords.auditProjectId,
        status: schema.dataRecords.status,
      })
      .from(schema.dataRecords)
      .where(inArray(schema.dataRecords.auditProjectId, projectIds));

    const dataRecordsByProject = new Map<string, string[]>();
    for (const dr of allDataRecords) {
      const statuses = dataRecordsByProject.get(dr.auditProjectId) ?? [];
      statuses.push(dr.status);
      dataRecordsByProject.set(dr.auditProjectId, statuses);
    }

    // Build items from batch data
    const items: EnterpriseLedgerItem[] = rows.map((row) => {
      const rectStatuses = rectTasksByProject.get(row.projectId);
      let rectificationStatus: string | null = null;
      if (rectStatuses && rectStatuses.length > 0) {
        const allCompleted = rectStatuses.every(
          (s) => s === 'completed' || s === 'verified',
        );
        rectificationStatus = allCompleted ? 'completed' : 'in_progress';
      }

      const records = dataRecordsByProject.get(row.projectId) ?? [];
      const totalRecords = records.length;
      const submittedRecords = records.filter(
        (s) => s === 'submitted' || s === 'approved',
      ).length;
      const filingProgress = totalRecords > 0 ? submittedRecords / totalRecords : 0;

      return {
        enterpriseId: row.enterpriseId,
        enterpriseName: row.enterpriseName,
        industryCode: row.industryCode,
        projectId: row.projectId,
        projectStatus: row.projectStatus,
        isOverdue: row.isOverdue,
        reviewScore: reviewScoreMap.get(row.projectId) ?? null,
        rectificationStatus,
        filingProgress,
      };
    });

    return { items, total, page, pageSize };
  }
}

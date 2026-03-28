import { Inject, Injectable } from '@nestjs/common';
import { eq, sql, and, count } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface BatchCompletionStats {
  totalProjects: number;
  completedProjects: number;
  completionRate: number;
  overdueProjects: number;
  overdueRate: number;
  averageReviewScore: number | null;
  statusDistribution: Array<{ status: string; count: number }>;
}

@Injectable()
export class BatchStatisticsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getBatchStatistics(batchId: string): Promise<BatchCompletionStats> {
    const projects = await this.db
      .select()
      .from(schema.auditProjects)
      .where(eq(schema.auditProjects.batchId, batchId));

    const totalProjects = projects.length;
    const completedProjects = projects.filter(
      (p) => p.status === 'closed' || p.status === 'completed',
    ).length;
    const overdueProjects = projects.filter((p) => p.isOverdue).length;

    const completionRate = totalProjects > 0 ? completedProjects / totalProjects : 0;
    const overdueRate = totalProjects > 0 ? overdueProjects / totalProjects : 0;

    // Calculate average review score for the batch
    const reviewScores = await this.db
      .select({ totalScore: schema.reviewTasks.totalScore })
      .from(schema.reviewTasks)
      .innerJoin(
        schema.auditProjects,
        eq(schema.reviewTasks.auditProjectId, schema.auditProjects.id),
      )
      .where(
        and(
          eq(schema.auditProjects.batchId, batchId),
          sql`${schema.reviewTasks.totalScore} IS NOT NULL`,
        ),
      );

    let averageReviewScore: number | null = null;
    if (reviewScores.length > 0) {
      const sum = reviewScores.reduce(
        (acc, r) => acc + Number(r.totalScore),
        0,
      );
      averageReviewScore = sum / reviewScores.length;
    }

    // Status distribution
    const statusCounts = new Map<string, number>();
    for (const project of projects) {
      statusCounts.set(project.status, (statusCounts.get(project.status) ?? 0) + 1);
    }
    const statusDistribution = Array.from(statusCounts.entries()).map(
      ([status, cnt]) => ({ status, count: cnt }),
    );

    return {
      totalProjects,
      completedProjects,
      completionRate,
      overdueProjects,
      overdueRate,
      averageReviewScore,
      statusDistribution,
    };
  }

  async getFilingProgressByBatch(batchId: string) {
    const records = await this.db
      .select({
        moduleCode: schema.dataRecords.moduleCode,
        status: schema.dataRecords.status,
      })
      .from(schema.dataRecords)
      .innerJoin(
        schema.auditProjects,
        eq(schema.dataRecords.auditProjectId, schema.auditProjects.id),
      )
      .where(eq(schema.auditProjects.batchId, batchId));

    const moduleStats = new Map<string, { total: number; submitted: number }>();
    for (const record of records) {
      const existing = moduleStats.get(record.moduleCode) ?? { total: 0, submitted: 0 };
      existing.total += 1;
      if (record.status === 'submitted' || record.status === 'approved') {
        existing.submitted += 1;
      }
      moduleStats.set(record.moduleCode, existing);
    }

    return Array.from(moduleStats.entries()).map(([moduleCode, stats]) => ({
      moduleCode,
      total: stats.total,
      submitted: stats.submitted,
      progress: stats.total > 0 ? stats.submitted / stats.total : 0,
    }));
  }
}

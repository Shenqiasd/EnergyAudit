import { Inject, Injectable } from '@nestjs/common';
import { eq, sql, and, desc, gt, inArray } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface DashboardSummary {
  activeBatches: number;
  projectCompletionRate: number;
  pendingReviewTasks: number;
  overdueAlerts: number;
}

export interface AlertItem {
  id: string;
  type: 'overdue_project' | 'low_score' | 'delayed_rectification';
  title: string;
  description: string;
  severity: 'warning' | 'danger';
  createdAt: string;
  relatedId: string;
}

export interface TimelineItem {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  detail: string | null;
  userId: string;
  userRole: string;
  createdAt: string;
}

@Injectable()
export class StatisticsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getDashboardSummary(): Promise<DashboardSummary> {
    // Active batches (status = 'active' or 'in_progress')
    const batches = await this.db
      .select()
      .from(schema.auditBatches)
      .where(
        sql`${schema.auditBatches.status} IN ('active', 'in_progress')`,
      );

    // All projects
    const allProjects = await this.db
      .select({
        status: schema.auditProjects.status,
        isOverdue: schema.auditProjects.isOverdue,
      })
      .from(schema.auditProjects);

    const totalProjects = allProjects.length;
    const completedProjects = allProjects.filter(
      (p) => p.status === 'closed' || p.status === 'completed',
    ).length;
    const projectCompletionRate =
      totalProjects > 0 ? completedProjects / totalProjects : 0;

    // Pending review tasks
    const pendingReviews = await this.db
      .select({ id: schema.reviewTasks.id })
      .from(schema.reviewTasks)
      .where(
        sql`${schema.reviewTasks.status} IN ('pending_assignment', 'assigned', 'in_review')`,
      );

    // Overdue alerts (projects + rectification tasks)
    const overdueProjects = allProjects.filter((p) => p.isOverdue).length;
    const overdueRectifications = await this.db
      .select({ id: schema.rectificationTasks.id })
      .from(schema.rectificationTasks)
      .where(eq(schema.rectificationTasks.isOverdue, true));

    return {
      activeBatches: batches.length,
      projectCompletionRate,
      pendingReviewTasks: pendingReviews.length,
      overdueAlerts: overdueProjects + overdueRectifications.length,
    };
  }

  async getAlerts(): Promise<AlertItem[]> {
    const alerts: AlertItem[] = [];

    // Overdue projects
    const overdueProjects = await this.db
      .select({
        id: schema.auditProjects.id,
        enterpriseId: schema.auditProjects.enterpriseId,
        deadline: schema.auditProjects.deadline,
      })
      .from(schema.auditProjects)
      .where(eq(schema.auditProjects.isOverdue, true))
      .orderBy(desc(schema.auditProjects.updatedAt))
      .limit(20);

    for (const p of overdueProjects) {
      alerts.push({
        id: `alert_overdue_${p.id}`,
        type: 'overdue_project',
        title: '项目超期',
        description: `项目 ${p.id} 已超过截止日期`,
        severity: 'danger',
        createdAt: p.deadline?.toISOString() ?? new Date().toISOString(),
        relatedId: p.id,
      });
    }

    // Low review scores (below 60)
    const lowScoreReviews = await this.db
      .select({
        id: schema.reviewTasks.id,
        totalScore: schema.reviewTasks.totalScore,
        auditProjectId: schema.reviewTasks.auditProjectId,
      })
      .from(schema.reviewTasks)
      .where(
        and(
          sql`${schema.reviewTasks.totalScore} IS NOT NULL`,
          sql`CAST(${schema.reviewTasks.totalScore} AS numeric) < 60`,
        ),
      )
      .orderBy(desc(schema.reviewTasks.updatedAt))
      .limit(10);

    for (const r of lowScoreReviews) {
      alerts.push({
        id: `alert_score_${r.id}`,
        type: 'low_score',
        title: '审核评分偏低',
        description: `项目 ${r.auditProjectId} 审核评分 ${r.totalScore} 分`,
        severity: 'warning',
        createdAt: new Date().toISOString(),
        relatedId: r.id,
      });
    }

    // Delayed rectification tasks
    const delayedRectifications = await this.db
      .select({
        id: schema.rectificationTasks.id,
        title: schema.rectificationTasks.title,
        deadline: schema.rectificationTasks.deadline,
      })
      .from(schema.rectificationTasks)
      .where(eq(schema.rectificationTasks.isOverdue, true))
      .orderBy(desc(schema.rectificationTasks.updatedAt))
      .limit(10);

    for (const r of delayedRectifications) {
      alerts.push({
        id: `alert_rect_${r.id}`,
        type: 'delayed_rectification',
        title: '整改超期',
        description: `整改任务「${r.title}」已超期`,
        severity: 'danger',
        createdAt: r.deadline?.toISOString() ?? new Date().toISOString(),
        relatedId: r.id,
      });
    }

    return alerts;
  }

  async getTimeline(limit = 20): Promise<TimelineItem[]> {
    const logs = await this.db
      .select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit);

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      detail: log.detail,
      userId: log.userId,
      userRole: log.userRole,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  async getRankings(query: { metric?: string; batchId?: string }) {
    const conditions = [];
    if (query.batchId) {
      conditions.push(eq(schema.auditProjects.batchId, query.batchId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Enterprise rankings by review score
    const results = await this.db
      .select({
        enterpriseId: schema.auditProjects.enterpriseId,
        totalScore: schema.reviewTasks.totalScore,
      })
      .from(schema.reviewTasks)
      .innerJoin(
        schema.auditProjects,
        eq(schema.reviewTasks.auditProjectId, schema.auditProjects.id),
      )
      .where(
        whereClause
          ? and(whereClause, sql`${schema.reviewTasks.totalScore} IS NOT NULL`)
          : sql`${schema.reviewTasks.totalScore} IS NOT NULL`,
      );

    const enterpriseScores = new Map<string, number[]>();
    for (const r of results) {
      const scores = enterpriseScores.get(r.enterpriseId) ?? [];
      scores.push(Number(r.totalScore));
      enterpriseScores.set(r.enterpriseId, scores);
    }

    const enterpriseIds = Array.from(enterpriseScores.keys());
    const enterprises =
      enterpriseIds.length > 0
        ? await this.db
            .select({ id: schema.enterprises.id, name: schema.enterprises.name })
            .from(schema.enterprises)
            .where(inArray(schema.enterprises.id, enterpriseIds))
        : [];

    const enterpriseNameMap = new Map(enterprises.map((e) => [e.id, e.name]));

    const rankings = Array.from(enterpriseScores.entries())
      .map(([enterpriseId, scores]) => ({
        enterpriseId,
        enterpriseName: enterpriseNameMap.get(enterpriseId) ?? 'Unknown',
        averageScore:
          scores.reduce((a, b) => a + b, 0) / scores.length,
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((item, index) => ({ rank: index + 1, ...item }));

    return rankings;
  }
}

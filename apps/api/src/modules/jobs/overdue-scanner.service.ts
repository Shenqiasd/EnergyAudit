import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, lt, sql } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';
import { NotificationTriggerService } from '../notification/notification-trigger.service';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface OverdueScanResult {
  batchesMarked: number;
  projectsMarked: number;
  rectificationTasksMarked: number;
  scannedAt: string;
}

export interface UpcomingDeadlineItem {
  entityType: 'audit_batch' | 'audit_project' | 'rectification_task';
  entityId: string;
  deadline: Date;
  daysRemaining: number;
}

@Injectable()
export class OverdueScannerService {
  private readonly logger = new Logger(OverdueScannerService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly notificationTrigger: NotificationTriggerService,
  ) {}

  async scanAll(): Promise<OverdueScanResult> {
    this.logger.log('开始执行超期扫描...');

    const [batchesMarked, projectsMarked, rectificationTasksMarked] =
      await Promise.all([
        this.scanBatches(),
        this.scanProjects(),
        this.scanRectificationTasks(),
      ]);

    const result: OverdueScanResult = {
      batchesMarked,
      projectsMarked,
      rectificationTasksMarked,
      scannedAt: new Date().toISOString(),
    };

    this.logger.log(
      `超期扫描完成: 批次=${batchesMarked}, 项目=${projectsMarked}, 整改=${rectificationTasksMarked}`,
    );

    return result;
  }

  async scanBatches(): Promise<number> {
    const now = new Date();

    // Find batches where filingDeadline or reviewDeadline has passed and not yet marked overdue
    const overdueBatches = await this.db
      .select({
        id: schema.auditBatches.id,
        filingDeadline: schema.auditBatches.filingDeadline,
        reviewDeadline: schema.auditBatches.reviewDeadline,
      })
      .from(schema.auditBatches)
      .where(
        and(
          eq(schema.auditBatches.isOverdue, false),
          sql`${schema.auditBatches.status} NOT IN ('closed')`,
          sql`(${schema.auditBatches.filingDeadline} < ${now} OR ${schema.auditBatches.reviewDeadline} < ${now})`,
        ),
      );

    for (const batch of overdueBatches) {
      await this.db
        .update(schema.auditBatches)
        .set({ isOverdue: true, updatedAt: new Date() })
        .where(eq(schema.auditBatches.id, batch.id));

      this.logger.warn(`批次 ${batch.id} 已标记为超期`);
    }

    return overdueBatches.length;
  }

  async scanProjects(): Promise<number> {
    const now = new Date();

    const overdueProjects = await this.db
      .select({
        id: schema.auditProjects.id,
        deadline: schema.auditProjects.deadline,
      })
      .from(schema.auditProjects)
      .where(
        and(
          eq(schema.auditProjects.isOverdue, false),
          lt(schema.auditProjects.deadline, now),
          sql`${schema.auditProjects.status} NOT IN ('completed', 'closed')`,
        ),
      );

    for (const project of overdueProjects) {
      await this.db
        .update(schema.auditProjects)
        .set({ isOverdue: true, updatedAt: new Date() })
        .where(eq(schema.auditProjects.id, project.id));

      this.logger.warn(`项目 ${project.id} 已标记为超期`);

      try {
        await this.notificationTrigger.onDeadlineWarning(
          'audit_project',
          project.id,
          0,
        );
      } catch {
        // Non-critical: notification failure should not block scanning
      }
    }

    return overdueProjects.length;
  }

  async scanRectificationTasks(): Promise<number> {
    const now = new Date();

    const overdueTasks = await this.db
      .select({
        id: schema.rectificationTasks.id,
        deadline: schema.rectificationTasks.deadline,
      })
      .from(schema.rectificationTasks)
      .where(
        and(
          eq(schema.rectificationTasks.isOverdue, false),
          lt(schema.rectificationTasks.deadline, now),
          sql`${schema.rectificationTasks.status} NOT IN ('completed', 'closed')`,
        ),
      );

    for (const task of overdueTasks) {
      await this.db
        .update(schema.rectificationTasks)
        .set({ isOverdue: true, updatedAt: new Date() })
        .where(eq(schema.rectificationTasks.id, task.id));

      this.logger.warn(`整改任务 ${task.id} 已标记为超期`);

      try {
        await this.notificationTrigger.onDeadlineWarning(
          'rectification_task',
          task.id,
          0,
        );
      } catch {
        // Non-critical
      }
    }

    return overdueTasks.length;
  }

  async getUpcomingDeadlines(daysAhead: number): Promise<UpcomingDeadlineItem[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const results: UpcomingDeadlineItem[] = [];

    // Upcoming batch deadlines (filing)
    const upcomingBatchesFiling = await this.db
      .select({
        id: schema.auditBatches.id,
        deadline: schema.auditBatches.filingDeadline,
      })
      .from(schema.auditBatches)
      .where(
        and(
          eq(schema.auditBatches.isOverdue, false),
          sql`${schema.auditBatches.filingDeadline} >= ${now}`,
          sql`${schema.auditBatches.filingDeadline} <= ${futureDate}`,
          sql`${schema.auditBatches.status} NOT IN ('closed')`,
        ),
      );

    for (const batch of upcomingBatchesFiling) {
      if (batch.deadline) {
        const daysRemaining = Math.ceil(
          (batch.deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        results.push({
          entityType: 'audit_batch',
          entityId: batch.id,
          deadline: batch.deadline,
          daysRemaining,
        });
      }
    }

    // Upcoming batch deadlines (review)
    const upcomingBatchesReview = await this.db
      .select({
        id: schema.auditBatches.id,
        deadline: schema.auditBatches.reviewDeadline,
      })
      .from(schema.auditBatches)
      .where(
        and(
          eq(schema.auditBatches.isOverdue, false),
          sql`${schema.auditBatches.reviewDeadline} >= ${now}`,
          sql`${schema.auditBatches.reviewDeadline} <= ${futureDate}`,
          sql`${schema.auditBatches.status} NOT IN ('closed')`,
        ),
      );

    for (const batch of upcomingBatchesReview) {
      if (batch.deadline) {
        const daysRemaining = Math.ceil(
          (batch.deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        // If batch already added from filing deadline, update if review deadline is more urgent
        const existingIdx = results.findIndex((r) => r.entityId === batch.id && r.entityType === 'audit_batch');
        if (existingIdx !== -1) {
          if (daysRemaining < results[existingIdx].daysRemaining) {
            results[existingIdx] = {
              entityType: 'audit_batch',
              entityId: batch.id,
              deadline: batch.deadline,
              daysRemaining,
            };
          }
        } else {
          results.push({
            entityType: 'audit_batch',
            entityId: batch.id,
            deadline: batch.deadline,
            daysRemaining,
          });
        }
      }
    }

    // Upcoming project deadlines
    const upcomingProjects = await this.db
      .select({
        id: schema.auditProjects.id,
        deadline: schema.auditProjects.deadline,
      })
      .from(schema.auditProjects)
      .where(
        and(
          eq(schema.auditProjects.isOverdue, false),
          sql`${schema.auditProjects.deadline} >= ${now}`,
          sql`${schema.auditProjects.deadline} <= ${futureDate}`,
          sql`${schema.auditProjects.status} NOT IN ('completed', 'closed')`,
        ),
      );

    for (const project of upcomingProjects) {
      if (project.deadline) {
        const daysRemaining = Math.ceil(
          (project.deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        results.push({
          entityType: 'audit_project',
          entityId: project.id,
          deadline: project.deadline,
          daysRemaining,
        });
      }
    }

    // Upcoming rectification task deadlines
    const upcomingTasks = await this.db
      .select({
        id: schema.rectificationTasks.id,
        deadline: schema.rectificationTasks.deadline,
      })
      .from(schema.rectificationTasks)
      .where(
        and(
          eq(schema.rectificationTasks.isOverdue, false),
          sql`${schema.rectificationTasks.deadline} >= ${now}`,
          sql`${schema.rectificationTasks.deadline} <= ${futureDate}`,
          sql`${schema.rectificationTasks.status} NOT IN ('completed', 'closed')`,
        ),
      );

    for (const task of upcomingTasks) {
      if (task.deadline) {
        const daysRemaining = Math.ceil(
          (task.deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        results.push({
          entityType: 'rectification_task',
          entityId: task.id,
          deadline: task.deadline,
          daysRemaining,
        });
      }
    }

    // Sort by days remaining ascending (most urgent first)
    results.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return results;
  }
}

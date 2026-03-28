import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';
import { NotificationService } from './notification.service';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

const PROJECT_STATUS_LABELS: Record<string, string> = {
  pending_start: '待启动',
  started: '已启动',
  config_in_progress: '配置中',
  data_filing: '数据填报',
  filing_completed: '填报完成',
  review_in_progress: '审核中',
  review_completed: '审核完成',
  rectification_in_progress: '整改中',
  rectification_completed: '整改完成',
  report_generation: '报告生成',
  completed: '已完成',
  closed: '已关闭',
};

@Injectable()
export class NotificationTriggerService {
  constructor(
    private readonly notificationService: NotificationService,
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async onProjectStatusChange(
    projectId: string,
    oldStatus: string,
    newStatus: string,
  ) {
    const [project] = await this.db
      .select({
        id: schema.auditProjects.id,
        enterpriseId: schema.auditProjects.enterpriseId,
      })
      .from(schema.auditProjects)
      .where(eq(schema.auditProjects.id, projectId))
      .limit(1);

    if (!project) return;

    const enterpriseUsers = await this.db
      .select({ id: schema.userAccounts.id })
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.enterpriseId, project.enterpriseId));

    const oldLabel = PROJECT_STATUS_LABELS[oldStatus] ?? oldStatus;
    const newLabel = PROJECT_STATUS_LABELS[newStatus] ?? newStatus;

    const notifications = enterpriseUsers.map((user) => ({
      recipientId: user.id,
      type: 'status_change',
      title: '项目状态变更',
      content: `您的审计项目状态已从「${oldLabel}」变更为「${newLabel}」`,
      relatedType: 'audit_project',
      relatedId: projectId,
    }));

    if (notifications.length > 0) {
      await this.notificationService.createBulk(notifications);
    }
  }

  async onReviewTaskAssigned(reviewTaskId: string, reviewerId: string) {
    const [task] = await this.db
      .select({
        id: schema.reviewTasks.id,
        auditProjectId: schema.reviewTasks.auditProjectId,
      })
      .from(schema.reviewTasks)
      .where(eq(schema.reviewTasks.id, reviewTaskId))
      .limit(1);

    if (!task) return;

    await this.notificationService.create({
      recipientId: reviewerId,
      type: 'task_assigned',
      title: '新审核任务',
      content: '您有一个新的审核任务需要处理',
      relatedType: 'review_task',
      relatedId: reviewTaskId,
    });
  }

  async onReviewCompleted(reviewTaskId: string, result: string) {
    const [task] = await this.db
      .select({
        id: schema.reviewTasks.id,
        auditProjectId: schema.reviewTasks.auditProjectId,
      })
      .from(schema.reviewTasks)
      .where(eq(schema.reviewTasks.id, reviewTaskId))
      .limit(1);

    if (!task) return;

    const [project] = await this.db
      .select({
        enterpriseId: schema.auditProjects.enterpriseId,
      })
      .from(schema.auditProjects)
      .where(eq(schema.auditProjects.id, task.auditProjectId))
      .limit(1);

    if (!project) return;

    const enterpriseUsers = await this.db
      .select({ id: schema.userAccounts.id })
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.enterpriseId, project.enterpriseId));

    const managers = await this.db
      .select({ id: schema.userAccounts.id })
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.role, 'manager'));

    const recipients = [...enterpriseUsers, ...managers];

    const notifications = recipients.map((user) => ({
      recipientId: user.id,
      type: 'review_result',
      title: '审核已完成',
      content: `审核任务已完成，结论：${result}`,
      relatedType: 'review_task',
      relatedId: reviewTaskId,
    }));

    if (notifications.length > 0) {
      await this.notificationService.createBulk(notifications);
    }
  }

  async onRectificationAssigned(rectTaskId: string, enterpriseId: string) {
    const enterpriseUsers = await this.db
      .select({ id: schema.userAccounts.id })
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.enterpriseId, enterpriseId));

    const notifications = enterpriseUsers.map((user) => ({
      recipientId: user.id,
      type: 'rectification_assigned',
      title: '新整改任务',
      content: '您有一个新的整改任务需要处理',
      relatedType: 'rectification_task',
      relatedId: rectTaskId,
    }));

    if (notifications.length > 0) {
      await this.notificationService.createBulk(notifications);
    }
  }

  async onRectificationCompleted(rectTaskId: string) {
    const managers = await this.db
      .select({ id: schema.userAccounts.id })
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.role, 'manager'));

    const notifications = managers.map((user) => ({
      recipientId: user.id,
      type: 'status_change',
      title: '整改任务已完成',
      content: '一个整改任务已完成，请查看',
      relatedType: 'rectification_task',
      relatedId: rectTaskId,
    }));

    if (notifications.length > 0) {
      await this.notificationService.createBulk(notifications);
    }
  }

  async onReportStatusChange(reportId: string, status: string) {
    const [report] = await this.db
      .select({
        auditProjectId: schema.reports.auditProjectId,
      })
      .from(schema.reports)
      .where(eq(schema.reports.id, reportId))
      .limit(1);

    if (!report) return;

    const [project] = await this.db
      .select({
        enterpriseId: schema.auditProjects.enterpriseId,
      })
      .from(schema.auditProjects)
      .where(eq(schema.auditProjects.id, report.auditProjectId))
      .limit(1);

    if (!project) return;

    const enterpriseUsers = await this.db
      .select({ id: schema.userAccounts.id })
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.enterpriseId, project.enterpriseId));

    const managers = await this.db
      .select({ id: schema.userAccounts.id })
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.role, 'manager'));

    const recipients = [...enterpriseUsers, ...managers];

    const notifications = recipients.map((user) => ({
      recipientId: user.id,
      type: 'status_change',
      title: '报告状态变更',
      content: `报告状态已变更为「${status}」`,
      relatedType: 'report',
      relatedId: reportId,
    }));

    if (notifications.length > 0) {
      await this.notificationService.createBulk(notifications);
    }
  }

  async onDeadlineWarning(
    entityType: string,
    entityId: string,
    daysRemaining: number,
  ) {
    let recipients: { id: string }[] = [];
    let title = '截止日期提醒';
    let content = `距离截止日期还有 ${daysRemaining} 天`;

    if (entityType === 'audit_project') {
      const [project] = await this.db
        .select({
          enterpriseId: schema.auditProjects.enterpriseId,
        })
        .from(schema.auditProjects)
        .where(eq(schema.auditProjects.id, entityId))
        .limit(1);

      if (project) {
        recipients = await this.db
          .select({ id: schema.userAccounts.id })
          .from(schema.userAccounts)
          .where(eq(schema.userAccounts.enterpriseId, project.enterpriseId));

        title = '项目截止日期提醒';
        content = `您的审计项目距离截止日期还有 ${daysRemaining} 天，请尽快完成`;
      }
    } else if (entityType === 'rectification_task') {
      const [task] = await this.db
        .select({
          auditProjectId: schema.rectificationTasks.auditProjectId,
        })
        .from(schema.rectificationTasks)
        .where(eq(schema.rectificationTasks.id, entityId))
        .limit(1);

      if (task) {
        const [project] = await this.db
          .select({
            enterpriseId: schema.auditProjects.enterpriseId,
          })
          .from(schema.auditProjects)
          .where(eq(schema.auditProjects.id, task.auditProjectId))
          .limit(1);

        if (project) {
          recipients = await this.db
            .select({ id: schema.userAccounts.id })
            .from(schema.userAccounts)
            .where(eq(schema.userAccounts.enterpriseId, project.enterpriseId));

          title = '整改截止日期提醒';
          content = `您的整改任务距离截止日期还有 ${daysRemaining} 天，请尽快处理`;
        }
      }
    }

    const notifications = recipients.map((user) => ({
      recipientId: user.id,
      type: 'deadline_warning',
      title,
      content,
      relatedType: entityType,
      relatedId: entityId,
    }));

    if (notifications.length > 0) {
      await this.notificationService.createBulk(notifications);
    }
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { and, eq, desc, sql } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export type RectificationStatus =
  | 'pending_issue'
  | 'pending_claim'
  | 'in_progress'
  | 'pending_acceptance'
  | 'completed'
  | 'delayed'
  | 'closed';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending_issue: ['pending_claim'],
  pending_claim: ['in_progress'],
  in_progress: ['pending_acceptance', 'delayed'],
  pending_acceptance: ['completed', 'in_progress'],
  delayed: ['in_progress', 'closed'],
  completed: ['closed'],
};

export function canTransitionRectification(from: string, to: string): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}

export interface RectificationListQuery {
  projectId?: string;
  enterpriseId?: string;
  status?: string;
  page?: string;
  pageSize?: string;
}

export interface GenerateRectificationInput {
  reviewTaskId: string;
  auditProjectId: string;
  issues: Array<{
    issueId: string;
    title: string;
    description?: string;
    deadline?: string;
  }>;
}

export interface UpdateProgressInput {
  progressPercent: number;
  note: string;
  attachmentIds?: string;
  recordedBy: string;
}

@Injectable()
export class RectificationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async generateFromIssues(input: GenerateRectificationInput) {
    const tasks = [];

    for (const issue of input.issues) {
      const taskId = `rect_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await this.db.insert(schema.rectificationTasks).values({
        id: taskId,
        auditProjectId: input.auditProjectId,
        reviewTaskId: input.reviewTaskId,
        sourceIssueId: issue.issueId,
        title: issue.title,
        description: issue.description ?? null,
        status: 'pending_issue',
        deadline: issue.deadline ? new Date(issue.deadline) : null,
      });

      tasks.push(taskId);
    }

    return { generatedCount: tasks.length, taskIds: tasks };
  }

  async findAll(query: RectificationListQuery) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.projectId) {
      conditions.push(eq(schema.rectificationTasks.auditProjectId, query.projectId));
    }
    if (query.status) {
      conditions.push(eq(schema.rectificationTasks.status, query.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await this.db
      .select()
      .from(schema.rectificationTasks)
      .where(whereClause)
      .orderBy(desc(schema.rectificationTasks.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { items, page, pageSize };
  }

  async findById(id: string) {
    const [task] = await this.db
      .select()
      .from(schema.rectificationTasks)
      .where(eq(schema.rectificationTasks.id, id))
      .limit(1);

    if (!task) {
      throw new Error('整改任务不存在');
    }

    const progress = await this.db
      .select()
      .from(schema.rectificationProgress)
      .where(eq(schema.rectificationProgress.rectificationTaskId, id))
      .orderBy(desc(schema.rectificationProgress.createdAt));

    return { ...task, progress };
  }

  async issueToEnterprise(id: string) {
    const task = await this.getTask(id);

    if (!canTransitionRectification(task.status, 'pending_claim')) {
      throw new Error(`无法从 ${task.status} 转换到 pending_claim`);
    }

    await this.db
      .update(schema.rectificationTasks)
      .set({ status: 'pending_claim', updatedAt: new Date() })
      .where(eq(schema.rectificationTasks.id, id));

    return this.findById(id);
  }

  async claimTask(id: string) {
    const task = await this.getTask(id);

    if (!canTransitionRectification(task.status, 'in_progress')) {
      throw new Error(`无法从 ${task.status} 转换到 in_progress`);
    }

    await this.db
      .update(schema.rectificationTasks)
      .set({ status: 'in_progress', updatedAt: new Date() })
      .where(eq(schema.rectificationTasks.id, id));

    return this.findById(id);
  }

  async updateProgress(id: string, input: UpdateProgressInput) {
    const progressId = `rp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await this.db.insert(schema.rectificationProgress).values({
      id: progressId,
      rectificationTaskId: id,
      progressPercent: input.progressPercent,
      note: input.note,
      attachmentIds: input.attachmentIds ?? null,
      recordedBy: input.recordedBy,
    });

    return this.findById(id);
  }

  async submitForAcceptance(id: string) {
    const task = await this.getTask(id);

    if (!canTransitionRectification(task.status, 'pending_acceptance')) {
      throw new Error(`无法从 ${task.status} 转换到 pending_acceptance`);
    }

    await this.db
      .update(schema.rectificationTasks)
      .set({ status: 'pending_acceptance', updatedAt: new Date() })
      .where(eq(schema.rectificationTasks.id, id));

    return this.findById(id);
  }

  async acceptCompletion(id: string) {
    const task = await this.getTask(id);

    if (!canTransitionRectification(task.status, 'completed')) {
      throw new Error(`无法从 ${task.status} 转换到 completed`);
    }

    await this.db
      .update(schema.rectificationTasks)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.rectificationTasks.id, id));

    return this.findById(id);
  }

  async rejectCompletion(id: string) {
    const task = await this.getTask(id);

    if (!canTransitionRectification(task.status, 'in_progress')) {
      throw new Error(`无法从 ${task.status} 转换到 in_progress`);
    }

    await this.db
      .update(schema.rectificationTasks)
      .set({ status: 'in_progress', updatedAt: new Date() })
      .where(eq(schema.rectificationTasks.id, id));

    return this.findById(id);
  }

  async markDelayed(id: string) {
    const task = await this.getTask(id);

    if (!canTransitionRectification(task.status, 'delayed')) {
      throw new Error(`无法从 ${task.status} 转换到 delayed`);
    }

    await this.db
      .update(schema.rectificationTasks)
      .set({
        status: 'delayed',
        isOverdue: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.rectificationTasks.id, id));

    return this.findById(id);
  }

  async closeTask(id: string) {
    const task = await this.getTask(id);

    if (!canTransitionRectification(task.status, 'closed')) {
      throw new Error(`无法从 ${task.status} 转换到 closed`);
    }

    await this.db
      .update(schema.rectificationTasks)
      .set({ status: 'closed', updatedAt: new Date() })
      .where(eq(schema.rectificationTasks.id, id));

    return this.findById(id);
  }

  async getStatistics(query: { projectId?: string; batchId?: string }) {
    const conditions = [];
    if (query.projectId) {
      conditions.push(eq(schema.rectificationTasks.auditProjectId, query.projectId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const tasks = await this.db
      .select({
        status: schema.rectificationTasks.status,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.rectificationTasks)
      .where(whereClause)
      .groupBy(schema.rectificationTasks.status);

    const statusCounts: Record<string, number> = {};
    let total = 0;
    for (const row of tasks) {
      statusCounts[row.status] = row.count;
      total += row.count;
    }

    const completed = statusCounts['completed'] ?? 0;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';

    return {
      total,
      statusCounts,
      completionRate: `${completionRate}%`,
      overdueCount: statusCounts['delayed'] ?? 0,
    };
  }

  private async getTask(id: string) {
    const [task] = await this.db
      .select()
      .from(schema.rectificationTasks)
      .where(eq(schema.rectificationTasks.id, id))
      .limit(1);

    if (!task) {
      throw new Error('整改任务不存在');
    }

    return task;
  }
}

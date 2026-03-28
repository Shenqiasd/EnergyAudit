import { Inject, Injectable } from '@nestjs/common';
import { and, eq, desc, inArray } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';
import { NotificationTriggerService } from '../notification/notification-trigger.service';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export type ReviewTaskStatus =
  | 'pending_assignment'
  | 'assigned'
  | 'in_review'
  | 'pending_confirmation'
  | 'returned'
  | 'completed'
  | 'closed';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending_assignment: ['assigned'],
  assigned: ['in_review'],
  in_review: ['pending_confirmation'],
  pending_confirmation: ['completed', 'returned'],
  returned: ['in_review'],
  completed: ['closed'],
};

export function canTransitionReviewTask(from: string, to: string): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}

export interface ReviewTaskListQuery {
  projectId?: string;
  reviewerId?: string;
  status?: string;
  batchId?: string;
  page?: string;
  pageSize?: string;
}

export interface CreateReviewTaskInput {
  auditProjectId: string;
  reportId: string;
  reviewerId: string;
}

@Injectable()
export class ReviewTaskService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly notificationTrigger: NotificationTriggerService,
  ) {}

  async create(input: CreateReviewTaskInput) {
    const taskId = `rt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await this.db.insert(schema.reviewTasks).values({
      id: taskId,
      auditProjectId: input.auditProjectId,
      reportId: input.reportId,
      reviewerId: input.reviewerId,
      status: 'pending_assignment',
    });

    return this.findById(taskId);
  }

  async findAll(query: ReviewTaskListQuery) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.projectId) {
      conditions.push(eq(schema.reviewTasks.auditProjectId, query.projectId));
    }
    if (query.reviewerId) {
      conditions.push(eq(schema.reviewTasks.reviewerId, query.reviewerId));
    }
    if (query.status) {
      conditions.push(eq(schema.reviewTasks.status, query.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await this.db
      .select()
      .from(schema.reviewTasks)
      .where(whereClause)
      .orderBy(desc(schema.reviewTasks.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { items, page, pageSize };
  }

  async findById(id: string) {
    const [task] = await this.db
      .select()
      .from(schema.reviewTasks)
      .where(eq(schema.reviewTasks.id, id))
      .limit(1);

    if (!task) {
      throw new Error('审核任务不存在');
    }

    const scores = await this.db
      .select()
      .from(schema.reviewScores)
      .where(eq(schema.reviewScores.reviewTaskId, id));

    const issues = await this.db
      .select()
      .from(schema.reviewIssues)
      .where(eq(schema.reviewIssues.reviewTaskId, id));

    return { ...task, scores, issues };
  }

  async assignReviewer(id: string, reviewerId: string) {
    const task = await this.getTask(id);

    if (!canTransitionReviewTask(task.status, 'assigned')) {
      throw new Error(`无法从 ${task.status} 转换到 assigned`);
    }

    await this.db
      .update(schema.reviewTasks)
      .set({
        reviewerId,
        status: 'assigned',
        assignedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.reviewTasks.id, id));

    try {
      await this.notificationTrigger.onReviewTaskAssigned(id, reviewerId);
    } catch {
      // Non-critical
    }

    return this.findById(id);
  }

  async startReview(id: string) {
    const task = await this.getTask(id);

    if (!canTransitionReviewTask(task.status, 'in_review')) {
      throw new Error(`无法从 ${task.status} 转换到 in_review`);
    }

    await this.db
      .update(schema.reviewTasks)
      .set({
        status: 'in_review',
        updatedAt: new Date(),
      })
      .where(eq(schema.reviewTasks.id, id));

    return this.findById(id);
  }

  async submitConclusion(id: string, conclusion: string, totalScore?: string) {
    const task = await this.getTask(id);

    if (!canTransitionReviewTask(task.status, 'pending_confirmation')) {
      throw new Error(`无法从 ${task.status} 转换到 pending_confirmation`);
    }

    await this.db
      .update(schema.reviewTasks)
      .set({
        status: 'pending_confirmation',
        conclusion,
        totalScore: totalScore ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.reviewTasks.id, id));

    return this.findById(id);
  }

  async confirmReview(id: string) {
    const task = await this.getTask(id);

    if (!canTransitionReviewTask(task.status, 'completed')) {
      throw new Error(`无法从 ${task.status} 转换到 completed`);
    }

    await this.db
      .update(schema.reviewTasks)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.reviewTasks.id, id));

    try {
      await this.notificationTrigger.onReviewCompleted(id, task.conclusion ?? 'completed');
    } catch {
      // Non-critical
    }

    return this.findById(id);
  }

  async returnReview(id: string) {
    const task = await this.getTask(id);

    if (!canTransitionReviewTask(task.status, 'returned')) {
      throw new Error(`无法从 ${task.status} 转换到 returned`);
    }

    await this.db
      .update(schema.reviewTasks)
      .set({
        status: 'returned',
        updatedAt: new Date(),
      })
      .where(eq(schema.reviewTasks.id, id));

    return this.findById(id);
  }

  async closeReview(id: string) {
    const task = await this.getTask(id);

    if (!canTransitionReviewTask(task.status, 'closed')) {
      throw new Error(`无法从 ${task.status} 转换到 closed`);
    }

    await this.db
      .update(schema.reviewTasks)
      .set({
        status: 'closed',
        updatedAt: new Date(),
      })
      .where(eq(schema.reviewTasks.id, id));

    return this.findById(id);
  }

  async findByStatuses(statuses: string[]) {
    return this.db
      .select()
      .from(schema.reviewTasks)
      .where(inArray(schema.reviewTasks.status, statuses))
      .orderBy(desc(schema.reviewTasks.createdAt));
  }

  private async getTask(id: string) {
    const [task] = await this.db
      .select()
      .from(schema.reviewTasks)
      .where(eq(schema.reviewTasks.id, id))
      .limit(1);

    if (!task) {
      throw new Error('审核任务不存在');
    }

    return task;
  }
}

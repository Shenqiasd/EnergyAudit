import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CreateIssueInput {
  reviewTaskId: string;
  description: string;
  severity: string;
  moduleCode?: string;
  fieldCode?: string;
  suggestion?: string;
  requiresRectification?: boolean;
}

@Injectable()
export class ReviewIssueService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async createIssue(input: CreateIssueInput) {
    const issueId = `ri_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await this.db.insert(schema.reviewIssues).values({
      id: issueId,
      reviewTaskId: input.reviewTaskId,
      description: input.description,
      severity: input.severity,
      moduleCode: input.moduleCode ?? null,
      fieldCode: input.fieldCode ?? null,
      suggestion: input.suggestion ?? null,
      requiresRectification: input.requiresRectification ?? false,
    });

    return this.getIssueById(issueId);
  }

  async getIssues(reviewTaskId: string) {
    return this.db
      .select()
      .from(schema.reviewIssues)
      .where(eq(schema.reviewIssues.reviewTaskId, reviewTaskId));
  }

  async resolveIssue(issueId: string) {
    const issue = await this.getIssueById(issueId);

    await this.db
      .update(schema.reviewIssues)
      .set({ requiresRectification: false })
      .where(eq(schema.reviewIssues.id, issueId));

    return { ...issue, requiresRectification: false };
  }

  async getUnresolvedIssues(reviewTaskId: string) {
    return this.db
      .select()
      .from(schema.reviewIssues)
      .where(and(
        eq(schema.reviewIssues.reviewTaskId, reviewTaskId),
        eq(schema.reviewIssues.requiresRectification, true),
      ));
  }

  private async getIssueById(id: string) {
    const [issue] = await this.db
      .select()
      .from(schema.reviewIssues)
      .where(eq(schema.reviewIssues.id, id))
      .limit(1);

    if (!issue) {
      throw new Error('审核问题不存在');
    }

    return issue;
  }
}

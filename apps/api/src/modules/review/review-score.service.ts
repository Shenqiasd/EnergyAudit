import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export const REVIEW_SCORE_CATEGORIES = [
  '数据完整性',
  '数据准确性',
  '合规性',
  '节能措施可行性',
  '报告质量',
] as const;

export type ReviewScoreCategory = (typeof REVIEW_SCORE_CATEGORIES)[number];

export interface ScoreInput {
  category: string;
  score: string;
  maxScore: string;
  comment?: string;
}

@Injectable()
export class ReviewScoreService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async submitScores(reviewTaskId: string, scores: ScoreInput[]) {
    // Delete existing scores for this task
    await this.db
      .delete(schema.reviewScores)
      .where(eq(schema.reviewScores.reviewTaskId, reviewTaskId));

    const values = scores.map((s) => ({
      id: `rs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      reviewTaskId,
      category: s.category,
      score: s.score,
      maxScore: s.maxScore,
      comment: s.comment ?? null,
    }));

    if (values.length > 0) {
      await this.db.insert(schema.reviewScores).values(values);
    }

    // Calculate total score
    const totalScore = scores.reduce((sum, s) => sum + Number(s.score), 0);
    const totalMaxScore = scores.reduce((sum, s) => sum + Number(s.maxScore), 0);

    // Update total score on review task
    await this.db
      .update(schema.reviewTasks)
      .set({
        totalScore: String(totalScore),
        updatedAt: new Date(),
      })
      .where(eq(schema.reviewTasks.id, reviewTaskId));

    return {
      scores: values,
      totalScore,
      totalMaxScore,
      averageScore: scores.length > 0 ? totalScore / scores.length : 0,
    };
  }

  async getScores(reviewTaskId: string) {
    const scores = await this.db
      .select()
      .from(schema.reviewScores)
      .where(eq(schema.reviewScores.reviewTaskId, reviewTaskId));

    const totalScore = scores.reduce((sum, s) => sum + Number(s.score), 0);
    const totalMaxScore = scores.reduce((sum, s) => sum + Number(s.maxScore), 0);

    return {
      scores,
      totalScore,
      totalMaxScore,
      averageScore: scores.length > 0 ? totalScore / scores.length : 0,
    };
  }
}

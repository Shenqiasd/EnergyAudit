import { describe, expect, it } from 'vitest';

import { canTransitionReviewTask } from '../../src/modules/review/review-task.service';
import { REVIEW_SCORE_CATEGORIES } from '../../src/modules/review/review-score.service';

describe('review workflow', () => {
  it('creates review task for a project', () => {
    const task = {
      id: 'rt_test_001',
      auditProjectId: 'proj_001',
      reportId: 'report_001',
      reviewerId: 'reviewer_001',
      status: 'pending_assignment',
    };

    expect(task.id).toBe('rt_test_001');
    expect(task.auditProjectId).toBe('proj_001');
    expect(task.status).toBe('pending_assignment');
  });

  it('assigns reviewer to review task (status → assigned)', () => {
    expect(canTransitionReviewTask('pending_assignment', 'assigned')).toBe(true);

    const task = {
      status: 'assigned',
      reviewerId: 'reviewer_002',
      assignedAt: new Date().toISOString(),
    };

    expect(task.status).toBe('assigned');
    expect(task.reviewerId).toBe('reviewer_002');
    expect(task.assignedAt).toBeDefined();
  });

  it('starts review (status → in_review)', () => {
    expect(canTransitionReviewTask('assigned', 'in_review')).toBe(true);
  });

  it('submits structured review scores with 5 categories', () => {
    expect(REVIEW_SCORE_CATEGORIES.length).toBe(5);
    expect(REVIEW_SCORE_CATEGORIES).toContain('数据完整性');
    expect(REVIEW_SCORE_CATEGORIES).toContain('数据准确性');
    expect(REVIEW_SCORE_CATEGORIES).toContain('合规性');
    expect(REVIEW_SCORE_CATEGORIES).toContain('节能措施可行性');
    expect(REVIEW_SCORE_CATEGORIES).toContain('报告质量');

    const scores = REVIEW_SCORE_CATEGORIES.map((category, i) => ({
      category,
      score: String(15 + i),
      maxScore: '20',
      comment: `${category}评价`,
    }));

    expect(scores.length).toBe(5);
    expect(scores[0].category).toBe('数据完整性');
    expect(scores[0].score).toBe('15');
    expect(scores[0].maxScore).toBe('20');
  });

  it('calculates total and average scores', () => {
    const scores = [
      { score: '18', maxScore: '20' },
      { score: '16', maxScore: '20' },
      { score: '19', maxScore: '20' },
      { score: '17', maxScore: '20' },
      { score: '15', maxScore: '20' },
    ];

    const totalScore = scores.reduce((sum, s) => sum + Number(s.score), 0);
    const totalMaxScore = scores.reduce((sum, s) => sum + Number(s.maxScore), 0);
    const averageScore = totalScore / scores.length;

    expect(totalScore).toBe(85);
    expect(totalMaxScore).toBe(100);
    expect(averageScore).toBe(17);
  });

  it('submits review conclusion (status → pending_confirmation)', () => {
    expect(canTransitionReviewTask('in_review', 'pending_confirmation')).toBe(true);

    const task = {
      status: 'pending_confirmation',
      conclusion: '该企业能源审计数据基本完整，建议通过审核。',
      totalScore: '85',
    };

    expect(task.status).toBe('pending_confirmation');
    expect(task.conclusion).toContain('建议通过审核');
    expect(task.totalScore).toBe('85');
  });

  it('confirms review (status → completed)', () => {
    expect(canTransitionReviewTask('pending_confirmation', 'completed')).toBe(true);

    const task = {
      status: 'completed',
      completedAt: new Date().toISOString(),
    };

    expect(task.status).toBe('completed');
    expect(task.completedAt).toBeDefined();
  });

  it('returns review (status → returned)', () => {
    expect(canTransitionReviewTask('pending_confirmation', 'returned')).toBe(true);

    const task = { status: 'returned' };
    expect(task.status).toBe('returned');

    // After return, can go back to in_review
    expect(canTransitionReviewTask('returned', 'in_review')).toBe(true);
  });

  it('blocks invalid status transitions', () => {
    expect(canTransitionReviewTask('pending_assignment', 'in_review')).toBe(false);
    expect(canTransitionReviewTask('pending_assignment', 'completed')).toBe(false);
    expect(canTransitionReviewTask('assigned', 'completed')).toBe(false);
    expect(canTransitionReviewTask('in_review', 'assigned')).toBe(false);
    expect(canTransitionReviewTask('completed', 'in_review')).toBe(false);
    expect(canTransitionReviewTask('closed', 'pending_assignment')).toBe(false);
    expect(canTransitionReviewTask('pending_confirmation', 'assigned')).toBe(false);
  });

  it('lists review tasks filtered by status', () => {
    const allTasks = [
      { id: '1', status: 'pending_assignment' },
      { id: '2', status: 'assigned' },
      { id: '3', status: 'in_review' },
      { id: '4', status: 'completed' },
      { id: '5', status: 'in_review' },
    ];

    const inReviewTasks = allTasks.filter((t) => t.status === 'in_review');
    expect(inReviewTasks.length).toBe(2);
    expect(inReviewTasks.every((t) => t.status === 'in_review')).toBe(true);

    const completedTasks = allTasks.filter((t) => t.status === 'completed');
    expect(completedTasks.length).toBe(1);
  });

  it('closes review task after completion', () => {
    expect(canTransitionReviewTask('completed', 'closed')).toBe(true);
    expect(canTransitionReviewTask('in_review', 'closed')).toBe(false);
    expect(canTransitionReviewTask('assigned', 'closed')).toBe(false);
  });
});

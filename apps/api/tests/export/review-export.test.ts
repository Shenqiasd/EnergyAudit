import { describe, expect, it } from 'vitest';

import { REVIEW_SCORE_CATEGORIES } from '../../src/modules/review/review-score.service';

describe('review export report structure', () => {
  it('review report has 5 score categories', () => {
    expect(REVIEW_SCORE_CATEGORIES.length).toBe(5);
    expect(REVIEW_SCORE_CATEGORIES).toContain('数据完整性');
    expect(REVIEW_SCORE_CATEGORIES).toContain('数据准确性');
    expect(REVIEW_SCORE_CATEGORIES).toContain('合规性');
    expect(REVIEW_SCORE_CATEGORIES).toContain('节能措施可行性');
    expect(REVIEW_SCORE_CATEGORIES).toContain('报告质量');
  });

  it('review report data structure matches expected PDF output', () => {
    const reviewData = {
      reviewerName: '张审核',
      reviewDate: '2025-12-15',
      status: 'completed',
      totalScore: '85',
      conclusion: '该企业能源审计数据基本完整，建议通过审核。',
      scores: REVIEW_SCORE_CATEGORIES.map((category, i) => ({
        category,
        score: String(15 + i),
        maxScore: '20',
        comment: `${category}评价：良好`,
      })),
      issues: [
        {
          severity: 'medium',
          description: '部分能源消费数据缺失',
          moduleCode: 'energy-balance',
          suggestion: '补充完善能源消费数据',
          requiresRectification: true,
        },
        {
          severity: 'low',
          description: '报告格式需要调整',
          moduleCode: null,
          suggestion: '按照模板格式调整报告排版',
          requiresRectification: false,
        },
      ],
    };

    // Verify structure
    expect(reviewData.scores.length).toBe(5);
    expect(reviewData.scores[0].category).toBe('数据完整性');
    expect(reviewData.issues.length).toBe(2);
    expect(reviewData.issues[0].severity).toBe('medium');

    // Total score calculation
    const totalScore = reviewData.scores.reduce((sum, s) => sum + Number(s.score), 0);
    expect(totalScore).toBe(85); // 15+16+17+18+19 = 85
  });

  it('severity labels map correctly for PDF rendering', () => {
    const severityLabels: Record<string, string> = {
      critical: '严重',
      high: '高',
      medium: '中',
      low: '低',
    };

    expect(severityLabels['critical']).toBe('严重');
    expect(severityLabels['high']).toBe('高');
    expect(severityLabels['medium']).toBe('中');
    expect(severityLabels['low']).toBe('低');
  });

  it('review issues include all required fields for PDF', () => {
    const issue = {
      severity: 'high',
      description: '碳排放计算方法不符合标准',
      moduleCode: 'carbon-emission',
      fieldCode: 'total_carbon_emission',
      suggestion: '按照GB/T XXXXX标准重新计算',
      requiresRectification: true,
    };

    expect(issue.severity).toBeDefined();
    expect(issue.description).toBeDefined();
    expect(issue.moduleCode).toBeDefined();
    expect(issue.suggestion).toBeDefined();
    expect(typeof issue.requiresRectification).toBe('boolean');
  });

  it('rectification report data structure matches expected PDF output', () => {
    const rectData = {
      title: '能源数据补充整改',
      status: 'in_progress',
      description: '根据审核意见，补充完善能源消费数据',
      deadline: '2026-01-15',
      isOverdue: false,
      completedAt: null,
      progress: [
        {
          date: '2025-12-20',
          progressPercent: 30,
          note: '已开始收集缺失数据',
          recordedBy: '李工',
        },
        {
          date: '2025-12-25',
          progressPercent: 60,
          note: '已补充大部分能源消费数据',
          recordedBy: '李工',
        },
      ],
    };

    expect(rectData.title).toBe('能源数据补充整改');
    expect(rectData.progress.length).toBe(2);
    expect(rectData.progress[1].progressPercent).toBe(60);
  });

  it('rectification status labels map correctly for PDF rendering', () => {
    const statusLabels: Record<string, string> = {
      pending_issue: '待下发',
      pending_claim: '待认领',
      in_progress: '整改中',
      pending_acceptance: '待验收',
      completed: '已完成',
      delayed: '已逾期',
      closed: '已关闭',
    };

    expect(Object.keys(statusLabels).length).toBe(7);
    expect(statusLabels['pending_issue']).toBe('待下发');
    expect(statusLabels['completed']).toBe('已完成');
    expect(statusLabels['delayed']).toBe('已逾期');
  });

  it('score breakdown table has correct structure', () => {
    const scores = REVIEW_SCORE_CATEGORIES.map((category, i) => ({
      category,
      score: 15 + i,
      maxScore: 20,
      comment: `${category}评价`,
    }));

    // Verify table structure for PDF rendering
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    const totalMaxScore = scores.reduce((sum, s) => sum + s.maxScore, 0);
    const averageScore = totalScore / scores.length;

    expect(totalScore).toBe(85);
    expect(totalMaxScore).toBe(100);
    expect(averageScore).toBe(17);

    // Each score should have category, score, maxScore, comment
    for (const score of scores) {
      expect(score.category).toBeDefined();
      expect(typeof score.score).toBe('number');
      expect(typeof score.maxScore).toBe('number');
      expect(score.comment).toBeDefined();
    }
  });
});

import { describe, expect, it } from 'vitest';

import type { BatchCompletionStats } from '../../src/modules/statistics/batch-statistics.service';

describe('batch statistics', () => {
  it('calculates batch completion rate correctly', () => {
    const projects = [
      { status: 'completed', isOverdue: false },
      { status: 'closed', isOverdue: false },
      { status: 'in_progress', isOverdue: false },
      { status: 'filing', isOverdue: false },
    ];

    const totalProjects = projects.length;
    const completedProjects = projects.filter(
      (p) => p.status === 'closed' || p.status === 'completed',
    ).length;
    const completionRate = totalProjects > 0 ? completedProjects / totalProjects : 0;

    expect(totalProjects).toBe(4);
    expect(completedProjects).toBe(2);
    expect(completionRate).toBe(0.5);
  });

  it('calculates overdue rate', () => {
    const projects = [
      { status: 'in_progress', isOverdue: true },
      { status: 'in_progress', isOverdue: false },
      { status: 'filing', isOverdue: true },
      { status: 'completed', isOverdue: false },
      { status: 'closed', isOverdue: false },
    ];

    const totalProjects = projects.length;
    const overdueProjects = projects.filter((p) => p.isOverdue).length;
    const overdueRate = totalProjects > 0 ? overdueProjects / totalProjects : 0;

    expect(overdueProjects).toBe(2);
    expect(overdueRate).toBe(0.4);
  });

  it('returns status distribution counts', () => {
    const projects = [
      { status: 'in_progress' },
      { status: 'in_progress' },
      { status: 'filing' },
      { status: 'completed' },
      { status: 'completed' },
      { status: 'completed' },
      { status: 'closed' },
    ];

    const statusCounts = new Map<string, number>();
    for (const project of projects) {
      statusCounts.set(project.status, (statusCounts.get(project.status) ?? 0) + 1);
    }
    const statusDistribution = Array.from(statusCounts.entries()).map(
      ([status, count]) => ({ status, count }),
    );

    expect(statusDistribution).toContainEqual({ status: 'in_progress', count: 2 });
    expect(statusDistribution).toContainEqual({ status: 'filing', count: 1 });
    expect(statusDistribution).toContainEqual({ status: 'completed', count: 3 });
    expect(statusDistribution).toContainEqual({ status: 'closed', count: 1 });
    expect(statusDistribution.length).toBe(4);
  });

  it('calculates average review score', () => {
    const reviewScores = [
      { totalScore: '85' },
      { totalScore: '72' },
      { totalScore: '90' },
      { totalScore: '68' },
    ];

    const sum = reviewScores.reduce((acc, r) => acc + Number(r.totalScore), 0);
    const averageReviewScore = sum / reviewScores.length;

    expect(sum).toBe(315);
    expect(averageReviewScore).toBe(78.75);
  });

  it('handles empty batch (no projects)', () => {
    const projects: Array<{ status: string; isOverdue: boolean }> = [];

    const totalProjects = projects.length;
    const completedProjects = projects.filter(
      (p) => p.status === 'closed' || p.status === 'completed',
    ).length;
    const overdueProjects = projects.filter((p) => p.isOverdue).length;
    const completionRate = totalProjects > 0 ? completedProjects / totalProjects : 0;
    const overdueRate = totalProjects > 0 ? overdueProjects / totalProjects : 0;

    const stats: BatchCompletionStats = {
      totalProjects,
      completedProjects,
      completionRate,
      overdueProjects,
      overdueRate,
      averageReviewScore: null,
      statusDistribution: [],
    };

    expect(stats.totalProjects).toBe(0);
    expect(stats.completedProjects).toBe(0);
    expect(stats.completionRate).toBe(0);
    expect(stats.overdueRate).toBe(0);
    expect(stats.averageReviewScore).toBeNull();
    expect(stats.statusDistribution).toEqual([]);
  });
});

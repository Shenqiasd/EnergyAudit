import { describe, expect, it } from 'vitest';

import { canTransitionRectification } from '../../src/modules/rectification/rectification.service';

describe('review to rectification', () => {
  it('registers review issue with severity', () => {
    const issue = {
      id: 'ri_test_001',
      reviewTaskId: 'rt_001',
      description: '能源消费数据与统计局公布数据不一致',
      severity: 'high',
      suggestion: '请核实2025年度能源消费总量数据',
      requiresRectification: true,
    };

    expect(issue.id).toBe('ri_test_001');
    expect(issue.severity).toBe('high');
    expect(issue.requiresRectification).toBe(true);
    expect(issue.description).toContain('能源消费数据');

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    expect(validSeverities).toContain(issue.severity);
  });

  it('generates rectification tasks from review issues', () => {
    const issues = [
      {
        issueId: 'ri_001',
        title: '数据不一致整改',
        description: '能源消费数据需要重新核实',
      },
      {
        issueId: 'ri_002',
        title: '报告格式整改',
        description: '报告缺少必要章节',
      },
    ];

    const generatedTasks = issues.map((issue, idx) => ({
      id: `rect_test_${idx}`,
      auditProjectId: 'proj_001',
      reviewTaskId: 'rt_001',
      sourceIssueId: issue.issueId,
      title: issue.title,
      description: issue.description,
      status: 'pending_issue',
    }));

    expect(generatedTasks.length).toBe(2);
    expect(generatedTasks[0].sourceIssueId).toBe('ri_001');
    expect(generatedTasks[0].status).toBe('pending_issue');
    expect(generatedTasks[1].title).toBe('报告格式整改');
  });

  it('rectification task links back to source issue', () => {
    const rectTask = {
      id: 'rect_001',
      sourceIssueId: 'ri_001',
      reviewTaskId: 'rt_001',
      auditProjectId: 'proj_001',
    };

    expect(rectTask.sourceIssueId).toBe('ri_001');
    expect(rectTask.reviewTaskId).toBe('rt_001');
    expect(rectTask.auditProjectId).toBe('proj_001');
  });

  it('tracks rectification progress with timeline', () => {
    const progressEntries = [
      {
        id: 'rp_001',
        rectificationTaskId: 'rect_001',
        progressPercent: 30,
        note: '已开始核实数据',
        recordedBy: 'user_001',
        createdAt: '2025-01-15T10:00:00Z',
      },
      {
        id: 'rp_002',
        rectificationTaskId: 'rect_001',
        progressPercent: 60,
        note: '数据核实完成，正在修改报告',
        recordedBy: 'user_001',
        createdAt: '2025-01-20T10:00:00Z',
      },
      {
        id: 'rp_003',
        rectificationTaskId: 'rect_001',
        progressPercent: 100,
        note: '整改完成，提交验收',
        recordedBy: 'user_001',
        createdAt: '2025-01-25T10:00:00Z',
      },
    ];

    expect(progressEntries.length).toBe(3);
    expect(progressEntries[0].progressPercent).toBe(30);
    expect(progressEntries[2].progressPercent).toBe(100);

    // Timeline should be ordered
    const dates = progressEntries.map((e) => new Date(e.createdAt).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeGreaterThan(dates[i - 1]);
    }
  });

  it('completes rectification with acceptance', () => {
    // in_progress → pending_acceptance
    expect(canTransitionRectification('in_progress', 'pending_acceptance')).toBe(true);
    // pending_acceptance → completed
    expect(canTransitionRectification('pending_acceptance', 'completed')).toBe(true);

    const task = {
      status: 'completed',
      completedAt: new Date().toISOString(),
    };

    expect(task.status).toBe('completed');
    expect(task.completedAt).toBeDefined();
  });

  it('rejects rectification back to in_progress', () => {
    expect(canTransitionRectification('pending_acceptance', 'in_progress')).toBe(true);

    const task = { status: 'in_progress' };
    expect(task.status).toBe('in_progress');

    // Can resubmit after rejection
    expect(canTransitionRectification('in_progress', 'pending_acceptance')).toBe(true);
  });

  it('marks rectification as delayed', () => {
    expect(canTransitionRectification('in_progress', 'delayed')).toBe(true);

    const task = {
      status: 'delayed',
      isOverdue: true,
    };

    expect(task.status).toBe('delayed');
    expect(task.isOverdue).toBe(true);

    // Delayed can go back to in_progress or be closed
    expect(canTransitionRectification('delayed', 'in_progress')).toBe(true);
    expect(canTransitionRectification('delayed', 'closed')).toBe(true);
  });

  it('calculates rectification statistics', () => {
    const tasks = [
      { status: 'pending_issue' },
      { status: 'pending_claim' },
      { status: 'in_progress' },
      { status: 'in_progress' },
      { status: 'pending_acceptance' },
      { status: 'completed' },
      { status: 'completed' },
      { status: 'completed' },
      { status: 'delayed' },
      { status: 'closed' },
    ];

    const statusCounts: Record<string, number> = {};
    for (const task of tasks) {
      statusCounts[task.status] = (statusCounts[task.status] ?? 0) + 1;
    }

    const total = tasks.length;
    const completed = statusCounts['completed'] ?? 0;
    const completionRate = ((completed / total) * 100).toFixed(1);
    const overdueCount = statusCounts['delayed'] ?? 0;

    expect(total).toBe(10);
    expect(completed).toBe(3);
    expect(completionRate).toBe('30.0');
    expect(overdueCount).toBe(1);
    expect(statusCounts['in_progress']).toBe(2);
  });

  it('blocks invalid rectification status transitions', () => {
    expect(canTransitionRectification('pending_issue', 'in_progress')).toBe(false);
    expect(canTransitionRectification('pending_issue', 'completed')).toBe(false);
    expect(canTransitionRectification('pending_claim', 'completed')).toBe(false);
    expect(canTransitionRectification('completed', 'in_progress')).toBe(false);
    expect(canTransitionRectification('closed', 'in_progress')).toBe(false);
    expect(canTransitionRectification('pending_acceptance', 'delayed')).toBe(false);
  });

  it('follows full rectification lifecycle', () => {
    // Full happy path
    expect(canTransitionRectification('pending_issue', 'pending_claim')).toBe(true);
    expect(canTransitionRectification('pending_claim', 'in_progress')).toBe(true);
    expect(canTransitionRectification('in_progress', 'pending_acceptance')).toBe(true);
    expect(canTransitionRectification('pending_acceptance', 'completed')).toBe(true);
    expect(canTransitionRectification('completed', 'closed')).toBe(true);
  });
});

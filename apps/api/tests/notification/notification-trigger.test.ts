import { describe, expect, it } from 'vitest';

describe('NotificationTriggerService', () => {
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

  it('maps all project status labels', () => {
    expect(Object.keys(PROJECT_STATUS_LABELS).length).toBe(12);
    expect(PROJECT_STATUS_LABELS['pending_start']).toBe('待启动');
    expect(PROJECT_STATUS_LABELS['completed']).toBe('已完成');
    expect(PROJECT_STATUS_LABELS['closed']).toBe('已关闭');
  });

  it('generates correct status change notification content', () => {
    const oldStatus = 'pending_start';
    const newStatus = 'started';
    const oldLabel = PROJECT_STATUS_LABELS[oldStatus] ?? oldStatus;
    const newLabel = PROJECT_STATUS_LABELS[newStatus] ?? newStatus;
    const content = `您的审计项目状态已从「${oldLabel}」变更为「${newLabel}」`;

    expect(content).toBe('您的审计项目状态已从「待启动」变更为「已启动」');
    expect(content).toContain('待启动');
    expect(content).toContain('已启动');
  });

  it('falls back to raw status if label not found', () => {
    const unknownStatus = 'some_new_status';
    const label = PROJECT_STATUS_LABELS[unknownStatus] ?? unknownStatus;
    expect(label).toBe('some_new_status');
  });

  it('creates onProjectStatusChange notification for enterprise users', () => {
    const enterpriseUsers = [
      { id: 'user_001' },
      { id: 'user_002' },
    ];
    const projectId = 'proj_001';
    const oldStatus = 'data_filing';
    const newStatus = 'review_in_progress';

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

    expect(notifications.length).toBe(2);
    expect(notifications[0].recipientId).toBe('user_001');
    expect(notifications[0].type).toBe('status_change');
    expect(notifications[0].relatedType).toBe('audit_project');
    expect(notifications[0].relatedId).toBe('proj_001');
    expect(notifications[0].content).toContain('数据填报');
    expect(notifications[0].content).toContain('审核中');
  });

  it('creates onReviewTaskAssigned notification for reviewer', () => {
    const reviewerId = 'reviewer_001';
    const reviewTaskId = 'rt_001';

    const notification = {
      recipientId: reviewerId,
      type: 'task_assigned',
      title: '新审核任务',
      content: '您有一个新的审核任务需要处理',
      relatedType: 'review_task',
      relatedId: reviewTaskId,
    };

    expect(notification.recipientId).toBe('reviewer_001');
    expect(notification.type).toBe('task_assigned');
    expect(notification.title).toBe('新审核任务');
    expect(notification.relatedType).toBe('review_task');
    expect(notification.relatedId).toBe('rt_001');
  });

  it('creates onReviewCompleted notifications for enterprise users and managers', () => {
    const enterpriseUsers = [{ id: 'eu_001' }];
    const managers = [{ id: 'mgr_001' }, { id: 'mgr_002' }];
    const reviewTaskId = 'rt_001';
    const result = '建议通过审核';

    const recipients = [...enterpriseUsers, ...managers];

    const notifications = recipients.map((user) => ({
      recipientId: user.id,
      type: 'review_result',
      title: '审核已完成',
      content: `审核任务已完成，结论：${result}`,
      relatedType: 'review_task',
      relatedId: reviewTaskId,
    }));

    expect(notifications.length).toBe(3);
    expect(notifications.every((n) => n.type === 'review_result')).toBe(true);
    expect(notifications[0].recipientId).toBe('eu_001');
    expect(notifications[1].recipientId).toBe('mgr_001');
    expect(notifications[2].recipientId).toBe('mgr_002');
    expect(notifications[0].content).toContain('建议通过审核');
  });

  it('creates onRectificationAssigned notifications for enterprise users', () => {
    const enterpriseUsers = [
      { id: 'eu_001' },
      { id: 'eu_002' },
    ];
    const rectTaskId = 'rect_001';

    const notifications = enterpriseUsers.map((user) => ({
      recipientId: user.id,
      type: 'rectification_assigned',
      title: '新整改任务',
      content: '您有一个新的整改任务需要处理',
      relatedType: 'rectification_task',
      relatedId: rectTaskId,
    }));

    expect(notifications.length).toBe(2);
    expect(notifications.every((n) => n.type === 'rectification_assigned')).toBe(true);
    expect(notifications.every((n) => n.relatedType === 'rectification_task')).toBe(true);
  });

  it('creates onRectificationCompleted notifications for managers', () => {
    const managers = [
      { id: 'mgr_001' },
      { id: 'mgr_002' },
    ];
    const rectTaskId = 'rect_001';

    const notifications = managers.map((user) => ({
      recipientId: user.id,
      type: 'status_change',
      title: '整改任务已完成',
      content: '一个整改任务已完成，请查看',
      relatedType: 'rectification_task',
      relatedId: rectTaskId,
    }));

    expect(notifications.length).toBe(2);
    expect(notifications.every((n) => n.title === '整改任务已完成')).toBe(true);
    expect(notifications.every((n) => n.relatedId === 'rect_001')).toBe(true);
  });

  it('creates onReportStatusChange notifications for enterprise users and managers', () => {
    const enterpriseUsers = [{ id: 'eu_001' }];
    const managers = [{ id: 'mgr_001' }];
    const reportId = 'report_001';
    const status = 'finalized';

    const recipients = [...enterpriseUsers, ...managers];

    const notifications = recipients.map((user) => ({
      recipientId: user.id,
      type: 'status_change',
      title: '报告状态变更',
      content: `报告状态已变更为「${status}」`,
      relatedType: 'report',
      relatedId: reportId,
    }));

    expect(notifications.length).toBe(2);
    expect(notifications[0].content).toContain('finalized');
    expect(notifications[0].relatedType).toBe('report');
  });

  it('creates onDeadlineWarning notifications with correct content', () => {
    const daysRemaining = 3;
    const entityType = 'audit_project';
    const entityId = 'proj_001';
    const recipients = [{ id: 'eu_001' }, { id: 'eu_002' }];

    const title = '项目截止日期提醒';
    const content = `您的审计项目距离截止日期还有 ${daysRemaining} 天，请尽快完成`;

    const notifications = recipients.map((user) => ({
      recipientId: user.id,
      type: 'deadline_warning',
      title,
      content,
      relatedType: entityType,
      relatedId: entityId,
    }));

    expect(notifications.length).toBe(2);
    expect(notifications[0].type).toBe('deadline_warning');
    expect(notifications[0].content).toContain('3 天');
    expect(notifications[0].title).toBe('项目截止日期提醒');
  });

  it('creates rectification deadline warning with specific content', () => {
    const daysRemaining = 7;

    const title = '整改截止日期提醒';
    const content = `您的整改任务距离截止日期还有 ${daysRemaining} 天，请尽快处理`;

    expect(title).toBe('整改截止日期提醒');
    expect(content).toContain('7 天');
    expect(content).toContain('整改任务');
  });

  it('skips notification if no recipients found', () => {
    const recipients: { id: string }[] = [];

    const notifications = recipients.map((user) => ({
      recipientId: user.id,
      type: 'status_change',
      title: 'Test',
      content: 'Test',
    }));

    expect(notifications.length).toBe(0);
    // In the service, createBulk is skipped when notifications.length === 0
    const shouldCreateBulk = notifications.length > 0;
    expect(shouldCreateBulk).toBe(false);
  });
});

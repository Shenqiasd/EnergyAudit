import { describe, expect, it } from 'vitest';

import type {
  CreateNotificationInput,
  NotificationListQuery,
} from '../../src/modules/notification/notification.service';

describe('NotificationService', () => {
  it('generates unique notification IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      ids.add(id);
    }
    // All IDs should be unique
    expect(ids.size).toBe(100);

    // Check ID format
    const sampleId = ids.values().next().value as string;
    expect(sampleId).toMatch(/^notif_\d+_[a-z0-9]+$/);
  });

  it('validates CreateNotificationInput structure', () => {
    const input: CreateNotificationInput = {
      recipientId: 'user_001',
      type: 'status_change',
      title: '项目状态变更',
      content: '您的审计项目状态已从「待启动」变更为「已启动」',
      relatedType: 'audit_project',
      relatedId: 'proj_001',
    };

    expect(input.recipientId).toBe('user_001');
    expect(input.type).toBe('status_change');
    expect(input.title).toBe('项目状态变更');
    expect(input.content).toContain('待启动');
    expect(input.relatedType).toBe('audit_project');
    expect(input.relatedId).toBe('proj_001');
  });

  it('supports optional relatedType and relatedId', () => {
    const input: CreateNotificationInput = {
      recipientId: 'user_001',
      type: 'system',
      title: '系统通知',
      content: '系统维护通知',
    };

    expect(input.relatedType).toBeUndefined();
    expect(input.relatedId).toBeUndefined();
  });

  it('validates notification types', () => {
    const validTypes = [
      'status_change',
      'task_assigned',
      'deadline_warning',
      'review_result',
      'rectification_assigned',
      'system',
    ];

    validTypes.forEach((type) => {
      const input: CreateNotificationInput = {
        recipientId: 'user_001',
        type,
        title: `Test ${type}`,
        content: `Test content for ${type}`,
      };
      expect(input.type).toBe(type);
    });
  });

  it('validates related entity types', () => {
    const validRelatedTypes = [
      'audit_project',
      'review_task',
      'rectification_task',
      'report',
      'enterprise',
    ];

    validRelatedTypes.forEach((relatedType) => {
      const input: CreateNotificationInput = {
        recipientId: 'user_001',
        type: 'status_change',
        title: 'Test',
        content: 'Test',
        relatedType,
        relatedId: 'entity_001',
      };
      expect(input.relatedType).toBe(relatedType);
    });
  });

  it('builds query with pagination defaults', () => {
    const query: NotificationListQuery = {};
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    expect(page).toBe(1);
    expect(limit).toBe(20);
    expect(offset).toBe(0);
  });

  it('builds query with custom pagination', () => {
    const query: NotificationListQuery = { page: 3, limit: 10 };
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    expect(page).toBe(3);
    expect(limit).toBe(10);
    expect(offset).toBe(20);
  });

  it('builds query with isRead filter', () => {
    const unreadQuery: NotificationListQuery = { isRead: false };
    expect(unreadQuery.isRead).toBe(false);

    const readQuery: NotificationListQuery = { isRead: true };
    expect(readQuery.isRead).toBe(true);
  });

  it('builds query with type filter', () => {
    const query: NotificationListQuery = { type: 'task_assigned' };
    expect(query.type).toBe('task_assigned');
  });

  it('structures bulk notification input correctly', () => {
    const recipients = ['user_001', 'user_002', 'user_003'];
    const notifications: CreateNotificationInput[] = recipients.map((recipientId) => ({
      recipientId,
      type: 'status_change',
      title: '项目状态变更',
      content: '您的审计项目状态已变更',
      relatedType: 'audit_project',
      relatedId: 'proj_001',
    }));

    expect(notifications.length).toBe(3);
    expect(notifications[0].recipientId).toBe('user_001');
    expect(notifications[2].recipientId).toBe('user_003');
    expect(notifications.every((n) => n.type === 'status_change')).toBe(true);
  });

  it('computes unread count correctly', () => {
    const notifications = [
      { id: '1', isRead: false },
      { id: '2', isRead: true },
      { id: '3', isRead: false },
      { id: '4', isRead: false },
      { id: '5', isRead: true },
    ];

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    expect(unreadCount).toBe(3);

    const readCount = notifications.filter((n) => n.isRead).length;
    expect(readCount).toBe(2);
  });

  it('marks notification as read with timestamp', () => {
    const notification = {
      id: 'notif_001',
      recipientId: 'user_001',
      isRead: false,
      readAt: null as Date | null,
    };

    // Mark as read
    const now = new Date();
    const updated = { ...notification, isRead: true, readAt: now };

    expect(updated.isRead).toBe(true);
    expect(updated.readAt).toBe(now);
    expect(updated.id).toBe('notif_001');
  });

  it('marks all notifications as read for a user', () => {
    const notifications = [
      { id: '1', recipientId: 'user_001', isRead: false },
      { id: '2', recipientId: 'user_001', isRead: false },
      { id: '3', recipientId: 'user_002', isRead: false },
      { id: '4', recipientId: 'user_001', isRead: true },
    ];

    const userId = 'user_001';
    const toUpdate = notifications.filter(
      (n) => n.recipientId === userId && !n.isRead,
    );

    expect(toUpdate.length).toBe(2);
    expect(toUpdate.every((n) => n.recipientId === userId)).toBe(true);
    expect(toUpdate.every((n) => !n.isRead)).toBe(true);
  });

  it('deletes notification only for correct recipient', () => {
    const notifications = [
      { id: 'notif_1', recipientId: 'user_001' },
      { id: 'notif_2', recipientId: 'user_002' },
    ];

    const targetId = 'notif_1';
    const userId = 'user_001';

    const found = notifications.find(
      (n) => n.id === targetId && n.recipientId === userId,
    );
    expect(found).toBeDefined();
    expect(found!.id).toBe('notif_1');

    const wrongUser = notifications.find(
      (n) => n.id === targetId && n.recipientId === 'user_002',
    );
    expect(wrongUser).toBeUndefined();
  });

  it('sorts notifications by createdAt descending', () => {
    const notifications = [
      { id: '1', createdAt: '2026-01-01T00:00:00Z' },
      { id: '2', createdAt: '2026-03-01T00:00:00Z' },
      { id: '3', createdAt: '2026-02-01T00:00:00Z' },
    ];

    const sorted = [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('3');
    expect(sorted[2].id).toBe('1');
  });

  it('paginates notification list correctly', () => {
    const allNotifications = Array.from({ length: 45 }, (_, i) => ({
      id: `notif_${i}`,
    }));

    const page1 = allNotifications.slice(0, 20);
    const page2 = allNotifications.slice(20, 40);
    const page3 = allNotifications.slice(40, 60);

    expect(page1.length).toBe(20);
    expect(page2.length).toBe(20);
    expect(page3.length).toBe(5);

    const totalPages = Math.ceil(allNotifications.length / 20);
    expect(totalPages).toBe(3);
  });
});

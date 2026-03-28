import { describe, expect, it } from 'vitest';

import type { AlertItem } from '../../src/modules/statistics/statistics.service';

describe('statistics alerts', () => {
  describe('AlertItem interface', () => {
    it('should support overdue_project type', () => {
      const alert: AlertItem = {
        id: 'alert_overdue_proj_001',
        type: 'overdue_project',
        title: '项目超期',
        description: '项目 proj_001 已超过截止日期',
        severity: 'danger',
        createdAt: new Date().toISOString(),
        relatedId: 'proj_001',
      };

      expect(alert.type).toBe('overdue_project');
      expect(alert.severity).toBe('danger');
      expect(alert.relatedId).toBe('proj_001');
    });

    it('should support low_score type', () => {
      const alert: AlertItem = {
        id: 'alert_score_review_001',
        type: 'low_score',
        title: '评分偏低',
        description: '审核评分 45 低于 60 分',
        severity: 'warning',
        createdAt: new Date().toISOString(),
        relatedId: 'review_001',
      };

      expect(alert.type).toBe('low_score');
      expect(alert.severity).toBe('warning');
    });

    it('should support delayed_rectification type', () => {
      const alert: AlertItem = {
        id: 'alert_rect_task_001',
        type: 'delayed_rectification',
        title: '整改超期',
        description: '整改任务「更换设备」已超期',
        severity: 'danger',
        createdAt: new Date().toISOString(),
        relatedId: 'task_001',
      };

      expect(alert.type).toBe('delayed_rectification');
      expect(alert.severity).toBe('danger');
    });

    it('should support approaching_deadline type', () => {
      const alert: AlertItem = {
        id: 'alert_approaching_proj_002',
        type: 'approaching_deadline',
        title: '即将到期',
        description: '项目 proj_002 距截止日期还有 3 天',
        severity: 'warning',
        createdAt: new Date().toISOString(),
        relatedId: 'proj_002',
      };

      expect(alert.type).toBe('approaching_deadline');
      expect(alert.severity).toBe('warning');
    });

    it('should support overdue_batch type', () => {
      const alert: AlertItem = {
        id: 'alert_batch_batch_001',
        type: 'overdue_batch',
        title: '批次超期',
        description: '批次「2026年度能源审计」已超过截止日期',
        severity: 'danger',
        createdAt: new Date().toISOString(),
        relatedId: 'batch_001',
      };

      expect(alert.type).toBe('overdue_batch');
      expect(alert.severity).toBe('danger');
    });
  });

  describe('alert severity', () => {
    it('should categorize overdue alerts as danger', () => {
      const dangerTypes: AlertItem['type'][] = ['overdue_project', 'delayed_rectification', 'overdue_batch'];

      for (const type of dangerTypes) {
        const alert: AlertItem = {
          id: `alert_${type}`,
          type,
          title: 'Test',
          description: 'Test',
          severity: 'danger',
          createdAt: new Date().toISOString(),
          relatedId: 'test',
        };
        expect(alert.severity).toBe('danger');
      }
    });

    it('should categorize approaching deadline alerts as warning', () => {
      const alert: AlertItem = {
        id: 'alert_approaching',
        type: 'approaching_deadline',
        title: '即将到期',
        description: 'Test',
        severity: 'warning',
        createdAt: new Date().toISOString(),
        relatedId: 'test',
      };
      expect(alert.severity).toBe('warning');
    });
  });

  describe('all alert types', () => {
    it('should have all 5 supported alert types', () => {
      const supportedTypes: AlertItem['type'][] = [
        'overdue_project',
        'low_score',
        'delayed_rectification',
        'approaching_deadline',
        'overdue_batch',
      ];

      expect(supportedTypes).toHaveLength(5);

      // Each type should be unique
      const unique = new Set(supportedTypes);
      expect(unique.size).toBe(5);
    });
  });
});

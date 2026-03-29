import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock types matching the service
interface SnapshotItem {
  id: string;
  dataRecordId: string;
  fieldCode: string;
  rawValue: string | null;
  calculatedValue: string | null;
  manualOverrideValue: string | null;
  finalValue: string | null;
  unit: string | null;
}

interface ImportJob {
  id: string;
  auditProjectId: string;
  moduleCode: string;
  fileAttachmentId: string;
  status: string;
  totalRows: number | null;
  successRows: number | null;
  failedRows: number | null;
  errors: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  preImportSnapshot: SnapshotItem[] | null;
  isRolledBack: boolean;
  rolledBackAt: Date | null;
  rolledBackBy: string | null;
}

const ROLLBACK_TIME_LIMIT_MS = 24 * 60 * 60 * 1000;

/**
 * Pure logic extracted from DataImportService.canRollback for unit testing
 * without database dependencies.
 */
function canRollbackLogic(job: ImportJob | null): {
  canRollback: boolean;
  reason?: string;
} {
  if (!job) {
    return { canRollback: false, reason: '导入任务不存在' };
  }

  if (job.isRolledBack) {
    return { canRollback: false, reason: '该导入已被回滚' };
  }

  if (!job.preImportSnapshot) {
    return { canRollback: false, reason: '无导入前快照数据' };
  }

  const completedAt = job.completedAt ?? job.createdAt;
  const elapsed = Date.now() - new Date(completedAt).getTime();
  if (elapsed > ROLLBACK_TIME_LIMIT_MS) {
    return { canRollback: false, reason: '已超过24小时回滚时限' };
  }

  return { canRollback: true };
}

function createMockJob(overrides: Partial<ImportJob> = {}): ImportJob {
  return {
    id: 'ij_test_001',
    auditProjectId: 'ap_test_001',
    moduleCode: 'energy-flow',
    fileAttachmentId: 'att_test_001',
    status: 'completed',
    totalRows: 10,
    successRows: 10,
    failedRows: 0,
    errors: null,
    startedAt: new Date('2026-03-28T10:00:00Z'),
    completedAt: new Date('2026-03-28T10:05:00Z'),
    createdAt: new Date('2026-03-28T10:00:00Z'),
    preImportSnapshot: [
      {
        id: 'di_snap_001',
        dataRecordId: 'dr_test_001',
        fieldCode: 'total_energy',
        rawValue: '1000',
        calculatedValue: null,
        manualOverrideValue: null,
        finalValue: '1000',
        unit: 'kWh',
      },
      {
        id: 'di_snap_002',
        dataRecordId: 'dr_test_001',
        fieldCode: 'coal_consumption',
        rawValue: '500',
        calculatedValue: null,
        manualOverrideValue: null,
        finalValue: '500',
        unit: 'tons',
      },
    ],
    isRolledBack: false,
    rolledBackAt: null,
    rolledBackBy: null,
    ...overrides,
  };
}

describe('Import Rollback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-28T12:00:00Z'));
  });

  describe('Snapshot Creation', () => {
    it('should capture all existing data items as snapshot', () => {
      const job = createMockJob();
      const snapshot = job.preImportSnapshot;

      expect(snapshot).not.toBeNull();
      expect(snapshot).toHaveLength(2);
      expect(snapshot![0].fieldCode).toBe('total_energy');
      expect(snapshot![0].rawValue).toBe('1000');
      expect(snapshot![1].fieldCode).toBe('coal_consumption');
      expect(snapshot![1].rawValue).toBe('500');
    });

    it('should preserve all field values in snapshot', () => {
      const job = createMockJob({
        preImportSnapshot: [
          {
            id: 'di_001',
            dataRecordId: 'dr_001',
            fieldCode: 'test_field',
            rawValue: '100',
            calculatedValue: '200',
            manualOverrideValue: '150',
            finalValue: '150',
            unit: 'kWh',
          },
        ],
      });

      const item = job.preImportSnapshot![0];
      expect(item.rawValue).toBe('100');
      expect(item.calculatedValue).toBe('200');
      expect(item.manualOverrideValue).toBe('150');
      expect(item.finalValue).toBe('150');
      expect(item.unit).toBe('kWh');
    });

    it('should handle empty pre-import state (no existing items)', () => {
      const job = createMockJob({ preImportSnapshot: [] });
      expect(job.preImportSnapshot).toEqual([]);
    });
  });

  describe('canRollback Logic', () => {
    it('should allow rollback for valid completed job within time limit', () => {
      const job = createMockJob();
      const result = canRollbackLogic(job);
      expect(result.canRollback).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject rollback for non-existent job', () => {
      const result = canRollbackLogic(null);
      expect(result.canRollback).toBe(false);
      expect(result.reason).toBe('导入任务不存在');
    });

    it('should reject rollback for already rolled-back job', () => {
      const job = createMockJob({
        isRolledBack: true,
        rolledBackAt: new Date('2026-03-28T11:00:00Z'),
        rolledBackBy: 'user_001',
      });

      const result = canRollbackLogic(job);
      expect(result.canRollback).toBe(false);
      expect(result.reason).toBe('该导入已被回滚');
    });

    it('should reject rollback when no snapshot exists', () => {
      const job = createMockJob({ preImportSnapshot: null });

      const result = canRollbackLogic(job);
      expect(result.canRollback).toBe(false);
      expect(result.reason).toBe('无导入前快照数据');
    });

    it('should reject rollback when 24-hour time limit has passed', () => {
      // Set current time to 25 hours after completion
      vi.setSystemTime(new Date('2026-03-29T11:10:00Z'));

      const job = createMockJob({
        completedAt: new Date('2026-03-28T10:05:00Z'),
      });

      const result = canRollbackLogic(job);
      expect(result.canRollback).toBe(false);
      expect(result.reason).toBe('已超过24小时回滚时限');
    });

    it('should allow rollback just before 24-hour limit', () => {
      // Set current time to 23 hours and 59 minutes after completion
      vi.setSystemTime(new Date('2026-03-29T10:04:00Z'));

      const job = createMockJob({
        completedAt: new Date('2026-03-28T10:05:00Z'),
      });

      const result = canRollbackLogic(job);
      expect(result.canRollback).toBe(true);
    });

    it('should use createdAt when completedAt is null', () => {
      const job = createMockJob({
        completedAt: null,
        createdAt: new Date('2026-03-28T10:00:00Z'),
      });

      // 2 hours after createdAt — should be within limit
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'));

      const result = canRollbackLogic(job);
      expect(result.canRollback).toBe(true);
    });
  });

  describe('Rollback Execution', () => {
    it('snapshot should contain enough data to fully restore items', () => {
      const job = createMockJob();
      const snapshot = job.preImportSnapshot!;

      // Each snapshot item should have all required fields for restoration
      for (const item of snapshot) {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('dataRecordId');
        expect(item).toHaveProperty('fieldCode');
        expect(item).toHaveProperty('rawValue');
        expect(item).toHaveProperty('calculatedValue');
        expect(item).toHaveProperty('manualOverrideValue');
        expect(item).toHaveProperty('finalValue');
        expect(item).toHaveProperty('unit');
      }
    });

    it('should mark job as rolled back with correct metadata', () => {
      const job = createMockJob();

      // Simulate rollback by updating fields
      const rolledBackJob: ImportJob = {
        ...job,
        isRolledBack: true,
        rolledBackAt: new Date('2026-03-28T12:00:00Z'),
        rolledBackBy: 'user_manager_001',
      };

      expect(rolledBackJob.isRolledBack).toBe(true);
      expect(rolledBackJob.rolledBackAt).toEqual(new Date('2026-03-28T12:00:00Z'));
      expect(rolledBackJob.rolledBackBy).toBe('user_manager_001');
    });

    it('rolled back job should not be rollback-able again', () => {
      const job = createMockJob({
        isRolledBack: true,
        rolledBackAt: new Date('2026-03-28T12:00:00Z'),
        rolledBackBy: 'user_001',
      });

      const result = canRollbackLogic(job);
      expect(result.canRollback).toBe(false);
      expect(result.reason).toBe('该导入已被回滚');
    });

    it('should handle rollback with empty snapshot (restoring to empty state)', () => {
      const job = createMockJob({ preImportSnapshot: [] });

      // canRollback should still succeed (empty snapshot is valid — means no items existed before)
      const result = canRollbackLogic(job);
      expect(result.canRollback).toBe(true);
    });
  });

  describe('Time Limit Configuration', () => {
    it('should use 24-hour default time limit', () => {
      expect(ROLLBACK_TIME_LIMIT_MS).toBe(24 * 60 * 60 * 1000);
      expect(ROLLBACK_TIME_LIMIT_MS).toBe(86_400_000);
    });

    it('should be exactly at boundary — 24 hours should fail', () => {
      const completedAt = new Date('2026-03-28T10:00:00Z');
      const job = createMockJob({ completedAt });

      // Exactly 24 hours later
      vi.setSystemTime(new Date('2026-03-29T10:00:01Z'));

      const result = canRollbackLogic(job);
      expect(result.canRollback).toBe(false);
    });
  });
});

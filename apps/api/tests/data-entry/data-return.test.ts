import { describe, expect, it } from 'vitest';

/**
 * Pure unit tests for data return reason saving and retrieval.
 * Tests return reason tracking with returnedBy and returnedAt.
 */

type DataRecordStatus =
  | 'draft'
  | 'saved'
  | 'validation_failed'
  | 'ready_to_submit'
  | 'submitted'
  | 'returned'
  | 'archived';

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['saved'],
  saved: ['saved', 'validation_failed', 'ready_to_submit', 'submitted'],
  validation_failed: ['saved', 'validation_failed', 'ready_to_submit'],
  ready_to_submit: ['saved', 'submitted'],
  submitted: ['returned', 'archived'],
  returned: ['saved', 'draft'],
};

function canTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}

interface DataRecord {
  id: string;
  status: DataRecordStatus;
  returnReason: string | null;
  returnedBy: string | null;
  returnedAt: Date | null;
  submittedAt: Date | null;
  updatedAt: Date;
}

function returnRecord(
  record: DataRecord,
  reason: string,
  returnedBy?: string,
): DataRecord | { error: string } {
  if (!canTransition(record.status, 'returned')) {
    return { error: `当前状态 ${record.status} 不允许退回` };
  }

  if (!reason || reason.trim().length === 0) {
    return { error: '退回原因不能为空' };
  }

  return {
    ...record,
    status: 'returned',
    returnReason: reason,
    returnedBy: returnedBy ?? null,
    returnedAt: new Date(),
    updatedAt: new Date(),
  };
}

function isError(result: DataRecord | { error: string }): result is { error: string } {
  return 'error' in result;
}

describe('data return reason enhancement', () => {
  describe('return reason saving', () => {
    it('saves return reason when returning a submitted record', () => {
      const record: DataRecord = {
        id: 'rec-1',
        status: 'submitted',
        returnReason: null,
        returnedBy: null,
        returnedAt: null,
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      const result = returnRecord(record, '数据不完整，请补充能源消费数据');
      expect(isError(result)).toBe(false);
      if (!isError(result)) {
        expect(result.status).toBe('returned');
        expect(result.returnReason).toBe('数据不完整，请补充能源消费数据');
      }
    });

    it('saves returnedBy when provided', () => {
      const record: DataRecord = {
        id: 'rec-2',
        status: 'submitted',
        returnReason: null,
        returnedBy: null,
        returnedAt: null,
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      const result = returnRecord(record, '格式不正确', 'user-manager-001');
      expect(isError(result)).toBe(false);
      if (!isError(result)) {
        expect(result.returnedBy).toBe('user-manager-001');
      }
    });

    it('sets returnedAt timestamp', () => {
      const record: DataRecord = {
        id: 'rec-3',
        status: 'submitted',
        returnReason: null,
        returnedBy: null,
        returnedAt: null,
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      const before = new Date();
      const result = returnRecord(record, '请重新填写');
      const after = new Date();

      expect(isError(result)).toBe(false);
      if (!isError(result)) {
        expect(result.returnedAt).not.toBeNull();
        expect(result.returnedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(result.returnedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
      }
    });

    it('sets returnedBy to null when not provided', () => {
      const record: DataRecord = {
        id: 'rec-4',
        status: 'submitted',
        returnReason: null,
        returnedBy: null,
        returnedAt: null,
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      const result = returnRecord(record, '数据有误');
      expect(isError(result)).toBe(false);
      if (!isError(result)) {
        expect(result.returnedBy).toBeNull();
      }
    });

    it('updates updatedAt timestamp', () => {
      const oldDate = new Date('2025-01-01');
      const record: DataRecord = {
        id: 'rec-5',
        status: 'submitted',
        returnReason: null,
        returnedBy: null,
        returnedAt: null,
        submittedAt: new Date(),
        updatedAt: oldDate,
      };

      const result = returnRecord(record, '需要修改');
      expect(isError(result)).toBe(false);
      if (!isError(result)) {
        expect(result.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
      }
    });
  });

  describe('return reason validation', () => {
    it('rejects empty return reason', () => {
      const record: DataRecord = {
        id: 'rec-6',
        status: 'submitted',
        returnReason: null,
        returnedBy: null,
        returnedAt: null,
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      const result = returnRecord(record, '');
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error).toBe('退回原因不能为空');
      }
    });

    it('rejects whitespace-only return reason', () => {
      const record: DataRecord = {
        id: 'rec-7',
        status: 'submitted',
        returnReason: null,
        returnedBy: null,
        returnedAt: null,
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      const result = returnRecord(record, '   ');
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error).toBe('退回原因不能为空');
      }
    });
  });

  describe('return state transitions', () => {
    it('allows return from submitted status', () => {
      expect(canTransition('submitted', 'returned')).toBe(true);
    });

    it('blocks return from draft status', () => {
      const record: DataRecord = {
        id: 'rec-8',
        status: 'draft',
        returnReason: null,
        returnedBy: null,
        returnedAt: null,
        submittedAt: null,
        updatedAt: new Date(),
      };

      const result = returnRecord(record, '无效操作');
      expect(isError(result)).toBe(true);
    });

    it('blocks return from saved status', () => {
      expect(canTransition('saved', 'returned')).toBe(false);
    });

    it('blocks return from already returned status', () => {
      expect(canTransition('returned', 'returned')).toBe(false);
    });

    it('blocks return from archived status', () => {
      expect(canTransition('archived', 'returned')).toBe(false);
    });

    it('allows re-edit after return (returned -> saved)', () => {
      expect(canTransition('returned', 'saved')).toBe(true);
    });

    it('allows reset after return (returned -> draft)', () => {
      expect(canTransition('returned', 'draft')).toBe(true);
    });
  });

  describe('return reason retrieval', () => {
    it('returned record contains full return info', () => {
      const record: DataRecord = {
        id: 'rec-9',
        status: 'submitted',
        returnReason: null,
        returnedBy: null,
        returnedAt: null,
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      const result = returnRecord(record, '碳排放数据需要重新核算', 'reviewer-001');
      expect(isError(result)).toBe(false);
      if (!isError(result)) {
        expect(result.returnReason).toBe('碳排放数据需要重新核算');
        expect(result.returnedBy).toBe('reviewer-001');
        expect(result.returnedAt).toBeInstanceOf(Date);
        expect(result.status).toBe('returned');
      }
    });

    it('preserves submittedAt after return', () => {
      const submittedDate = new Date('2025-06-15');
      const record: DataRecord = {
        id: 'rec-10',
        status: 'submitted',
        returnReason: null,
        returnedBy: null,
        returnedAt: null,
        submittedAt: submittedDate,
        updatedAt: new Date(),
      };

      const result = returnRecord(record, '请修改');
      expect(isError(result)).toBe(false);
      if (!isError(result)) {
        expect(result.submittedAt).toEqual(submittedDate);
      }
    });
  });
});

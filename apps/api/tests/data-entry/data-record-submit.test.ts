import { describe, expect, it } from 'vitest';

/**
 * Pure unit tests for data record state machine and submission logic.
 * Tests transition rules without any DB or NestJS involvement.
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
  submittedAt: Date | null;
}

interface ValidationResult {
  errors: Array<{ ruleCode: string; severity: string; message: string }>;
  warnings: Array<{ ruleCode: string; severity: string; message: string }>;
}

function canSaveWithWarnings(validation: ValidationResult): boolean {
  // Save is always allowed, even with warnings
  return true;
}

function canSubmit(validation: ValidationResult): boolean {
  // Submit is blocked when there are errors
  return validation.errors.length === 0;
}

function transitionToSubmitted(record: DataRecord): DataRecord | null {
  if (!canTransition(record.status, 'submitted')) return null;
  return {
    ...record,
    status: 'submitted',
    submittedAt: new Date(),
  };
}

function transitionToReturned(record: DataRecord, reason: string): DataRecord | null {
  if (!canTransition(record.status, 'returned')) return null;
  return {
    ...record,
    status: 'returned',
    returnReason: reason,
  };
}

function transitionToSaved(record: DataRecord): DataRecord | null {
  if (!canTransition(record.status, 'saved')) return null;
  return {
    ...record,
    status: 'saved',
  };
}

describe('data record submission', () => {
  describe('blocks submission when required field missing', () => {
    it('should block submission when validation has errors', () => {
      const validation: ValidationResult = {
        errors: [
          {
            ruleCode: 'required_enterprise_name',
            severity: 'error',
            message: '企业名称为必填项',
          },
        ],
        warnings: [],
      };

      expect(canSubmit(validation)).toBe(false);
    });

    it('should block submission with multiple required field errors', () => {
      const validation: ValidationResult = {
        errors: [
          { ruleCode: 'required_field1', severity: 'error', message: '字段1为必填项' },
          { ruleCode: 'required_field2', severity: 'error', message: '字段2为必填项' },
        ],
        warnings: [],
      };

      expect(canSubmit(validation)).toBe(false);
    });
  });

  describe('allows save with validation warnings', () => {
    it('should allow save when there are only warnings', () => {
      const validation: ValidationResult = {
        errors: [],
        warnings: [
          {
            ruleCode: 'energy_balance_check',
            severity: 'warning',
            message: '能源平衡差异较大',
          },
        ],
      };

      expect(canSaveWithWarnings(validation)).toBe(true);
    });

    it('should allow save even when there are errors', () => {
      const validation: ValidationResult = {
        errors: [
          { ruleCode: 'required_field', severity: 'error', message: '必填项缺失' },
        ],
        warnings: [],
      };

      expect(canSaveWithWarnings(validation)).toBe(true);
    });

    it('should allow submission when there are only warnings', () => {
      const validation: ValidationResult = {
        errors: [],
        warnings: [
          { ruleCode: 'warning_1', severity: 'warning', message: '提示信息' },
        ],
      };

      expect(canSubmit(validation)).toBe(true);
    });
  });

  describe('transitions draft -> saved -> submitted correctly', () => {
    it('should transition draft -> saved', () => {
      const record: DataRecord = {
        id: 'test-1',
        status: 'draft',
        returnReason: null,
        submittedAt: null,
      };

      const saved = transitionToSaved(record);
      expect(saved).not.toBeNull();
      expect(saved!.status).toBe('saved');
    });

    it('should transition saved -> submitted', () => {
      const record: DataRecord = {
        id: 'test-1',
        status: 'saved',
        returnReason: null,
        submittedAt: null,
      };

      const submitted = transitionToSubmitted(record);
      expect(submitted).not.toBeNull();
      expect(submitted!.status).toBe('submitted');
      expect(submitted!.submittedAt).toBeInstanceOf(Date);
    });

    it('should handle the full flow draft -> saved -> submitted', () => {
      let record: DataRecord = {
        id: 'test-1',
        status: 'draft',
        returnReason: null,
        submittedAt: null,
      };

      const saved = transitionToSaved(record);
      expect(saved).not.toBeNull();
      record = saved!;
      expect(record.status).toBe('saved');

      const submitted = transitionToSubmitted(record);
      expect(submitted).not.toBeNull();
      record = submitted!;
      expect(record.status).toBe('submitted');
    });
  });

  describe('blocks invalid state transitions', () => {
    it('should block draft -> submitted (must save first)', () => {
      expect(canTransition('draft', 'submitted')).toBe(false);
    });

    it('should block draft -> returned', () => {
      expect(canTransition('draft', 'returned')).toBe(false);
    });

    it('should block submitted -> saved', () => {
      expect(canTransition('submitted', 'saved')).toBe(false);
    });

    it('should block submitted -> submitted', () => {
      expect(canTransition('submitted', 'submitted')).toBe(false);
    });

    it('should block archived -> any transition', () => {
      expect(canTransition('archived', 'draft')).toBe(false);
      expect(canTransition('archived', 'saved')).toBe(false);
      expect(canTransition('archived', 'submitted')).toBe(false);
    });

    it('should return null for invalid transitions', () => {
      const record: DataRecord = {
        id: 'test-1',
        status: 'draft',
        returnReason: null,
        submittedAt: null,
      };

      const result = transitionToSubmitted(record);
      expect(result).toBeNull();
    });
  });

  describe('return action adds reason and transitions to returned', () => {
    it('should transition submitted -> returned with reason', () => {
      const record: DataRecord = {
        id: 'test-1',
        status: 'submitted',
        returnReason: null,
        submittedAt: new Date(),
      };

      const returned = transitionToReturned(record, '数据不完整，请补充');
      expect(returned).not.toBeNull();
      expect(returned!.status).toBe('returned');
      expect(returned!.returnReason).toBe('数据不完整，请补充');
    });

    it('should block return from draft status', () => {
      const record: DataRecord = {
        id: 'test-1',
        status: 'draft',
        returnReason: null,
        submittedAt: null,
      };

      const returned = transitionToReturned(record, '无效操作');
      expect(returned).toBeNull();
    });

    it('should allow returned -> saved (re-edit)', () => {
      expect(canTransition('returned', 'saved')).toBe(true);
    });

    it('should allow returned -> draft', () => {
      expect(canTransition('returned', 'draft')).toBe(true);
    });
  });
});

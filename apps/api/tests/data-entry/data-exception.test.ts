import { describe, expect, it } from 'vitest';

/**
 * Pure unit tests for the data exception / controlled exception mechanism.
 * Tests exception CRUD logic and approval flow without DB involvement.
 */

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface ValidationException {
  id: string;
  dataRecordId: string;
  validationResultId: string;
  explanation: string;
  submittedBy: string;
  approvedBy: string | null;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

// ==================== Pure functions under test ====================

function createException(
  dataRecordId: string,
  validationResultId: string,
  explanation: string,
  submittedBy: string,
): ValidationException {
  return {
    id: `ve_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    dataRecordId,
    validationResultId,
    explanation,
    submittedBy,
    approvedBy: null,
    approvalStatus: 'pending',
    rejectionReason: null,
    reviewedAt: null,
    createdAt: new Date(),
  };
}

function approveException(
  exception: ValidationException,
  approverId: string,
): ValidationException {
  if (exception.approvalStatus !== 'pending') {
    throw new Error(`Cannot approve exception with status: ${exception.approvalStatus}`);
  }
  return {
    ...exception,
    approvedBy: approverId,
    approvalStatus: 'approved',
    reviewedAt: new Date(),
  };
}

function rejectException(
  exception: ValidationException,
  approverId: string,
  reason?: string,
): ValidationException {
  if (exception.approvalStatus !== 'pending') {
    throw new Error(`Cannot reject exception with status: ${exception.approvalStatus}`);
  }
  return {
    ...exception,
    approvedBy: approverId,
    approvalStatus: 'rejected',
    rejectionReason: reason ?? null,
    reviewedAt: new Date(),
  };
}

function canSubmitWithExceptions(
  blockingValidationIds: string[],
  exceptions: ValidationException[],
): boolean {
  // All blocking validations must have approved exceptions
  return blockingValidationIds.every((vid) =>
    exceptions.some(
      (e) => e.validationResultId === vid && e.approvalStatus === 'approved',
    ),
  );
}

function getPendingExceptions(exceptions: ValidationException[]): ValidationException[] {
  return exceptions.filter((e) => e.approvalStatus === 'pending');
}

function getExceptionsByRecord(
  exceptions: ValidationException[],
  dataRecordId: string,
): ValidationException[] {
  return exceptions.filter((e) => e.dataRecordId === dataRecordId);
}

// ==================== Tests ====================

describe('data exception mechanism', () => {
  describe('createException', () => {
    it('should create a pending exception with proper fields', () => {
      const exception = createException('dr_001', 'vr_001', '数据来源为上年度报表', 'user_001');
      expect(exception.dataRecordId).toBe('dr_001');
      expect(exception.validationResultId).toBe('vr_001');
      expect(exception.explanation).toBe('数据来源为上年度报表');
      expect(exception.submittedBy).toBe('user_001');
      expect(exception.approvalStatus).toBe('pending');
      expect(exception.approvedBy).toBeNull();
      expect(exception.rejectionReason).toBeNull();
      expect(exception.reviewedAt).toBeNull();
      expect(exception.id).toMatch(/^ve_/);
    });

    it('should generate unique IDs for each exception', () => {
      const e1 = createException('dr_001', 'vr_001', '说明1', 'user_001');
      const e2 = createException('dr_001', 'vr_002', '说明2', 'user_001');
      expect(e1.id).not.toBe(e2.id);
    });
  });

  describe('approveException', () => {
    it('should approve a pending exception', () => {
      const exception = createException('dr_001', 'vr_001', '说明', 'user_001');
      const approved = approveException(exception, 'manager_001');
      expect(approved.approvalStatus).toBe('approved');
      expect(approved.approvedBy).toBe('manager_001');
      expect(approved.reviewedAt).toBeInstanceOf(Date);
    });

    it('should throw if exception is already approved', () => {
      const exception = createException('dr_001', 'vr_001', '说明', 'user_001');
      const approved = approveException(exception, 'manager_001');
      expect(() => approveException(approved, 'manager_002')).toThrow(
        'Cannot approve exception with status: approved',
      );
    });

    it('should throw if exception is already rejected', () => {
      const exception = createException('dr_001', 'vr_001', '说明', 'user_001');
      const rejected = rejectException(exception, 'manager_001', '原因');
      expect(() => approveException(rejected, 'manager_002')).toThrow(
        'Cannot approve exception with status: rejected',
      );
    });
  });

  describe('rejectException', () => {
    it('should reject a pending exception with reason', () => {
      const exception = createException('dr_001', 'vr_001', '说明', 'user_001');
      const rejected = rejectException(exception, 'manager_001', '数据不合理');
      expect(rejected.approvalStatus).toBe('rejected');
      expect(rejected.approvedBy).toBe('manager_001');
      expect(rejected.rejectionReason).toBe('数据不合理');
      expect(rejected.reviewedAt).toBeInstanceOf(Date);
    });

    it('should reject without reason', () => {
      const exception = createException('dr_001', 'vr_001', '说明', 'user_001');
      const rejected = rejectException(exception, 'manager_001');
      expect(rejected.approvalStatus).toBe('rejected');
      expect(rejected.rejectionReason).toBeNull();
    });

    it('should throw if exception is already rejected', () => {
      const exception = createException('dr_001', 'vr_001', '说明', 'user_001');
      const rejected = rejectException(exception, 'manager_001');
      expect(() => rejectException(rejected, 'manager_002')).toThrow(
        'Cannot reject exception with status: rejected',
      );
    });
  });

  describe('canSubmitWithExceptions', () => {
    it('should allow submission when all blocking validations have approved exceptions', () => {
      const exceptions = [
        { ...createException('dr_001', 'vr_001', '说明1', 'u1'), approvalStatus: 'approved' as ApprovalStatus },
        { ...createException('dr_001', 'vr_002', '说明2', 'u1'), approvalStatus: 'approved' as ApprovalStatus },
      ];
      expect(canSubmitWithExceptions(['vr_001', 'vr_002'], exceptions)).toBe(true);
    });

    it('should block submission when some blocking validations have pending exceptions', () => {
      const exceptions = [
        { ...createException('dr_001', 'vr_001', '说明1', 'u1'), approvalStatus: 'approved' as ApprovalStatus },
        { ...createException('dr_001', 'vr_002', '说明2', 'u1'), approvalStatus: 'pending' as ApprovalStatus },
      ];
      expect(canSubmitWithExceptions(['vr_001', 'vr_002'], exceptions)).toBe(false);
    });

    it('should block submission when some blocking validations have no exceptions', () => {
      const exceptions = [
        { ...createException('dr_001', 'vr_001', '说明1', 'u1'), approvalStatus: 'approved' as ApprovalStatus },
      ];
      expect(canSubmitWithExceptions(['vr_001', 'vr_002'], exceptions)).toBe(false);
    });

    it('should allow submission when no blocking validations exist', () => {
      expect(canSubmitWithExceptions([], [])).toBe(true);
    });

    it('should block submission when exception is rejected', () => {
      const exceptions = [
        { ...createException('dr_001', 'vr_001', '说明1', 'u1'), approvalStatus: 'rejected' as ApprovalStatus },
      ];
      expect(canSubmitWithExceptions(['vr_001'], exceptions)).toBe(false);
    });
  });

  describe('getPendingExceptions', () => {
    it('should filter only pending exceptions', () => {
      const exceptions = [
        { ...createException('dr_001', 'vr_001', '说明1', 'u1'), approvalStatus: 'pending' as ApprovalStatus },
        { ...createException('dr_001', 'vr_002', '说明2', 'u1'), approvalStatus: 'approved' as ApprovalStatus },
        { ...createException('dr_001', 'vr_003', '说明3', 'u1'), approvalStatus: 'rejected' as ApprovalStatus },
        { ...createException('dr_002', 'vr_004', '说明4', 'u2'), approvalStatus: 'pending' as ApprovalStatus },
      ];
      const pending = getPendingExceptions(exceptions);
      expect(pending).toHaveLength(2);
      expect(pending.every((e) => e.approvalStatus === 'pending')).toBe(true);
    });

    it('should return empty array when no pending exceptions', () => {
      const exceptions = [
        { ...createException('dr_001', 'vr_001', '说明1', 'u1'), approvalStatus: 'approved' as ApprovalStatus },
      ];
      expect(getPendingExceptions(exceptions)).toHaveLength(0);
    });
  });

  describe('getExceptionsByRecord', () => {
    it('should filter exceptions by data record ID', () => {
      const exceptions = [
        createException('dr_001', 'vr_001', '说明1', 'u1'),
        createException('dr_001', 'vr_002', '说明2', 'u1'),
        createException('dr_002', 'vr_003', '说明3', 'u2'),
      ];
      const dr001Exceptions = getExceptionsByRecord(exceptions, 'dr_001');
      expect(dr001Exceptions).toHaveLength(2);
      expect(dr001Exceptions.every((e) => e.dataRecordId === 'dr_001')).toBe(true);
    });

    it('should return empty array when no matching records', () => {
      const exceptions = [
        createException('dr_001', 'vr_001', '说明1', 'u1'),
      ];
      expect(getExceptionsByRecord(exceptions, 'dr_999')).toHaveLength(0);
    });
  });
});

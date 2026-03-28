import { describe, expect, it } from 'vitest';

/**
 * Pure unit tests for admission state machine logic.
 * Tests the transition rules without any DB or NestJS involvement.
 */

type AdmissionStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'locked'
  | 'expired';

type AdmissionAction =
  | 'approve'
  | 'reject'
  | 'suspend'
  | 'restore'
  | 'lock'
  | 'expire'
  | 'reapply';

const VALID_TRANSITIONS: Record<string, Record<string, AdmissionStatus>> = {
  pending_review: {
    approve: 'approved',
    reject: 'rejected',
  },
  approved: {
    suspend: 'suspended',
    lock: 'locked',
    expire: 'expired',
  },
  rejected: {
    reapply: 'pending_review',
  },
  suspended: {
    restore: 'approved',
  },
};

function canTransition(currentStatus: AdmissionStatus, action: AdmissionAction): boolean {
  const transitions = VALID_TRANSITIONS[currentStatus];
  return !!transitions && action in transitions;
}

function getNextStatus(currentStatus: AdmissionStatus, action: AdmissionAction): AdmissionStatus | null {
  const transitions = VALID_TRANSITIONS[currentStatus];
  if (!transitions || !transitions[action]) return null;
  return transitions[action];
}

function getValidActions(currentStatus: AdmissionStatus): AdmissionAction[] {
  const transitions = VALID_TRANSITIONS[currentStatus];
  if (!transitions) return [];
  return Object.keys(transitions) as AdmissionAction[];
}

describe('admission state machine', () => {
  describe('valid transitions', () => {
    it('pending_review → approved via approve', () => {
      expect(canTransition('pending_review', 'approve')).toBe(true);
      expect(getNextStatus('pending_review', 'approve')).toBe('approved');
    });

    it('pending_review → rejected via reject', () => {
      expect(canTransition('pending_review', 'reject')).toBe(true);
      expect(getNextStatus('pending_review', 'reject')).toBe('rejected');
    });

    it('approved → suspended via suspend', () => {
      expect(canTransition('approved', 'suspend')).toBe(true);
      expect(getNextStatus('approved', 'suspend')).toBe('suspended');
    });

    it('approved → locked via lock', () => {
      expect(canTransition('approved', 'lock')).toBe(true);
      expect(getNextStatus('approved', 'lock')).toBe('locked');
    });

    it('approved → expired via expire', () => {
      expect(canTransition('approved', 'expire')).toBe(true);
      expect(getNextStatus('approved', 'expire')).toBe('expired');
    });

    it('rejected → pending_review via reapply', () => {
      expect(canTransition('rejected', 'reapply')).toBe(true);
      expect(getNextStatus('rejected', 'reapply')).toBe('pending_review');
    });

    it('suspended → approved via restore', () => {
      expect(canTransition('suspended', 'restore')).toBe(true);
      expect(getNextStatus('suspended', 'restore')).toBe('approved');
    });
  });

  describe('invalid transitions', () => {
    it('rejects approve from approved state', () => {
      expect(canTransition('approved', 'approve')).toBe(false);
      expect(getNextStatus('approved', 'approve')).toBeNull();
    });

    it('rejects reject from approved state', () => {
      expect(canTransition('approved', 'reject')).toBe(false);
    });

    it('rejects any action from locked state', () => {
      expect(canTransition('locked', 'approve')).toBe(false);
      expect(canTransition('locked', 'restore')).toBe(false);
      expect(canTransition('locked', 'suspend')).toBe(false);
    });

    it('rejects any action from expired state', () => {
      expect(canTransition('expired', 'approve')).toBe(false);
      expect(canTransition('expired', 'reapply')).toBe(false);
    });

    it('rejects suspend from pending_review', () => {
      expect(canTransition('pending_review', 'suspend')).toBe(false);
    });

    it('rejects reapply from approved', () => {
      expect(canTransition('approved', 'reapply')).toBe(false);
    });
  });

  describe('getValidActions', () => {
    it('returns approve and reject for pending_review', () => {
      const actions = getValidActions('pending_review');
      expect(actions).toContain('approve');
      expect(actions).toContain('reject');
      expect(actions).toHaveLength(2);
    });

    it('returns suspend, lock, expire for approved', () => {
      const actions = getValidActions('approved');
      expect(actions).toContain('suspend');
      expect(actions).toContain('lock');
      expect(actions).toContain('expire');
      expect(actions).toHaveLength(3);
    });

    it('returns reapply for rejected', () => {
      const actions = getValidActions('rejected');
      expect(actions).toEqual(['reapply']);
    });

    it('returns restore for suspended', () => {
      const actions = getValidActions('suspended');
      expect(actions).toEqual(['restore']);
    });

    it('returns empty array for locked (terminal state)', () => {
      expect(getValidActions('locked')).toEqual([]);
    });

    it('returns empty array for expired (terminal state)', () => {
      expect(getValidActions('expired')).toEqual([]);
    });
  });

  describe('full workflow scenarios', () => {
    it('normal approval flow: pending → approved → suspended → restored', () => {
      let status: AdmissionStatus = 'pending_review';

      status = getNextStatus(status, 'approve')!;
      expect(status).toBe('approved');

      status = getNextStatus(status, 'suspend')!;
      expect(status).toBe('suspended');

      status = getNextStatus(status, 'restore')!;
      expect(status).toBe('approved');
    });

    it('rejection and reapply flow: pending → rejected → pending → approved', () => {
      let status: AdmissionStatus = 'pending_review';

      status = getNextStatus(status, 'reject')!;
      expect(status).toBe('rejected');

      status = getNextStatus(status, 'reapply')!;
      expect(status).toBe('pending_review');

      status = getNextStatus(status, 'approve')!;
      expect(status).toBe('approved');
    });
  });
});

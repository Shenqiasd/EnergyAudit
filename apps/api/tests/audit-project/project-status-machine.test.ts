import { describe, expect, it } from 'vitest';

/**
 * Pure unit tests for project status machine logic.
 * Tests the transition rules without any DB or NestJS involvement.
 */

type AuditProjectStatus =
  | 'pending_start'
  | 'configuring'
  | 'filing'
  | 'pending_submit'
  | 'pending_report'
  | 'report_processing'
  | 'pending_review'
  | 'in_review'
  | 'pending_rectification'
  | 'in_rectification'
  | 'completed'
  | 'closed';

const TRANSITIONS: Record<string, string[]> = {
  pending_start: ['configuring'],
  configuring: ['filing'],
  filing: ['pending_submit'],
  pending_submit: ['pending_report'],
  pending_report: ['report_processing'],
  report_processing: ['pending_review'],
  pending_review: ['in_review'],
  in_review: ['pending_rectification', 'completed'],
  pending_rectification: ['in_rectification'],
  in_rectification: ['pending_review'],
  completed: ['closed'],
};

interface PreconditionContext {
  configComplete?: boolean;
  hasContact?: boolean;
  hasFiller?: boolean;
}

interface TransitionPrecondition {
  check: (context: PreconditionContext) => boolean;
  message: string;
}

const PRECONDITIONS: Record<string, Record<string, TransitionPrecondition>> = {
  configuring: {
    filing: {
      check: (ctx) => ctx.configComplete === true,
      message: '配置尚未完成，无法进入填报阶段',
    },
  },
  filing: {
    pending_submit: {
      check: (ctx) => ctx.hasContact === true && ctx.hasFiller === true,
      message: '至少需要一名企业联系人和一名填报人',
    },
  },
};

function canTransition(from: string, to: string): boolean {
  const validTargets = TRANSITIONS[from];
  return !!validTargets && validTargets.includes(to);
}

function getValidNextStates(current: string): string[] {
  return TRANSITIONS[current] ?? [];
}

function checkPreconditions(
  from: string,
  to: string,
  context: PreconditionContext,
): { allowed: boolean; message?: string } {
  const fromPreconditions = PRECONDITIONS[from];
  if (!fromPreconditions) return { allowed: true };

  const precondition = fromPreconditions[to];
  if (!precondition) return { allowed: true };

  if (!precondition.check(context)) {
    return { allowed: false, message: precondition.message };
  }

  return { allowed: true };
}

describe('project status machine', () => {
  describe('valid transitions', () => {
    it('待启动 → 配置中', () => {
      expect(canTransition('pending_start', 'configuring')).toBe(true);
    });

    it('配置中 → 填报中', () => {
      expect(canTransition('configuring', 'filing')).toBe(true);
    });

    it('填报中 → 待提交', () => {
      expect(canTransition('filing', 'pending_submit')).toBe(true);
    });

    it('待提交 → 待生成报告', () => {
      expect(canTransition('pending_submit', 'pending_report')).toBe(true);
    });

    it('待生成报告 → 报告处理中', () => {
      expect(canTransition('pending_report', 'report_processing')).toBe(true);
    });

    it('报告处理中 → 待审核', () => {
      expect(canTransition('report_processing', 'pending_review')).toBe(true);
    });

    it('待审核 → 审核中', () => {
      expect(canTransition('pending_review', 'in_review')).toBe(true);
    });

    it('审核中 → 待整改 (issues found)', () => {
      expect(canTransition('in_review', 'pending_rectification')).toBe(true);
    });

    it('审核中 → 已完成 (no issues)', () => {
      expect(canTransition('in_review', 'completed')).toBe(true);
    });

    it('待整改 → 整改中', () => {
      expect(canTransition('pending_rectification', 'in_rectification')).toBe(true);
    });

    it('整改中 → 待审核 (re-review)', () => {
      expect(canTransition('in_rectification', 'pending_review')).toBe(true);
    });

    it('已完成 → 已关闭', () => {
      expect(canTransition('completed', 'closed')).toBe(true);
    });
  });

  describe('invalid transitions', () => {
    it('rejects 填报中 → 已完成 (skipping steps)', () => {
      expect(canTransition('filing', 'completed')).toBe(false);
    });

    it('rejects 待启动 → 填报中 (skipping configuring)', () => {
      expect(canTransition('pending_start', 'filing')).toBe(false);
    });

    it('rejects 已关闭 → any state (terminal)', () => {
      expect(canTransition('closed', 'pending_start')).toBe(false);
      expect(canTransition('closed', 'configuring')).toBe(false);
    });

    it('rejects 待审核 → 已完成 (must go through in_review)', () => {
      expect(canTransition('pending_review', 'completed')).toBe(false);
    });

    it('rejects 配置中 → 待提交 (skipping filing)', () => {
      expect(canTransition('configuring', 'pending_submit')).toBe(false);
    });

    it('rejects backward transition 填报中 → 配置中', () => {
      expect(canTransition('filing', 'configuring')).toBe(false);
    });
  });

  describe('getValidNextStates', () => {
    it('returns configuring for pending_start', () => {
      expect(getValidNextStates('pending_start')).toEqual(['configuring']);
    });

    it('returns pending_rectification and completed for in_review', () => {
      const states = getValidNextStates('in_review');
      expect(states).toContain('pending_rectification');
      expect(states).toContain('completed');
      expect(states).toHaveLength(2);
    });

    it('returns closed for completed', () => {
      expect(getValidNextStates('completed')).toEqual(['closed']);
    });

    it('returns empty array for closed (terminal state)', () => {
      expect(getValidNextStates('closed')).toEqual([]);
    });

    it('returns pending_review for in_rectification (re-review cycle)', () => {
      expect(getValidNextStates('in_rectification')).toEqual(['pending_review']);
    });
  });

  describe('precondition checks', () => {
    it('blocks 配置中 → 填报中 when config is incomplete', () => {
      const result = checkPreconditions('configuring', 'filing', {
        configComplete: false,
      });
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('配置尚未完成');
    });

    it('allows 配置中 → 填报中 when config is complete', () => {
      const result = checkPreconditions('configuring', 'filing', {
        configComplete: true,
      });
      expect(result.allowed).toBe(true);
    });

    it('blocks 填报中 → 待提交 when no contact or filler', () => {
      const result = checkPreconditions('filing', 'pending_submit', {
        hasContact: false,
        hasFiller: false,
      });
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('企业联系人');
    });

    it('blocks 填报中 → 待提交 when no filler', () => {
      const result = checkPreconditions('filing', 'pending_submit', {
        hasContact: true,
        hasFiller: false,
      });
      expect(result.allowed).toBe(false);
    });

    it('allows 填报中 → 待提交 when both contact and filler exist', () => {
      const result = checkPreconditions('filing', 'pending_submit', {
        hasContact: true,
        hasFiller: true,
      });
      expect(result.allowed).toBe(true);
    });

    it('allows transitions without preconditions', () => {
      const result = checkPreconditions('pending_start', 'configuring', {});
      expect(result.allowed).toBe(true);
    });
  });

  describe('full workflow scenarios', () => {
    it('normal flow: pending_start → completed', () => {
      let status: AuditProjectStatus = 'pending_start';

      const flow: AuditProjectStatus[] = [
        'configuring',
        'filing',
        'pending_submit',
        'pending_report',
        'report_processing',
        'pending_review',
        'in_review',
        'completed',
      ];

      for (const next of flow) {
        expect(canTransition(status, next)).toBe(true);
        status = next;
      }
      expect(status).toBe('completed');
    });

    it('rectification cycle: in_review → pending_rectification → ... → completed', () => {
      let status: AuditProjectStatus = 'in_review';

      status = 'pending_rectification';
      expect(canTransition('in_review', status)).toBe(true);

      status = 'in_rectification';
      expect(canTransition('pending_rectification', status)).toBe(true);

      status = 'pending_review';
      expect(canTransition('in_rectification', status)).toBe(true);

      status = 'in_review';
      expect(canTransition('pending_review', status)).toBe(true);

      expect(canTransition(status, 'completed')).toBe(true);
    });

    it('close after completion: completed → closed', () => {
      expect(canTransition('completed', 'closed')).toBe(true);
      expect(getValidNextStates('closed')).toEqual([]);
    });
  });
});

import type { AuditProjectStatus } from './audit-project.types';

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

export interface TransitionPrecondition {
  check: (context: PreconditionContext) => boolean;
  message: string;
}

export interface PreconditionContext {
  configComplete?: boolean;
  hasContact?: boolean;
  hasFiller?: boolean;
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

export function canTransition(from: string, to: string): boolean {
  const validTargets = TRANSITIONS[from];
  return !!validTargets && validTargets.includes(to);
}

export function getValidNextStates(current: string): string[] {
  return TRANSITIONS[current] ?? [];
}

export function checkPreconditions(
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

export const STATUS_LABELS: Record<AuditProjectStatus, string> = {
  pending_start: '待启动',
  configuring: '配置中',
  filing: '填报中',
  pending_submit: '待提交',
  pending_report: '待生成报告',
  report_processing: '报告处理中',
  pending_review: '待审核',
  in_review: '审核中',
  pending_rectification: '待整改',
  in_rectification: '整改中',
  completed: '已完成',
  closed: '已关闭',
};

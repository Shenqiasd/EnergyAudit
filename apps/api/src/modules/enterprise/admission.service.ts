import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

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

@Injectable()
export class AdmissionService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  getValidTransitions(): Record<string, Record<string, AdmissionStatus>> {
    return VALID_TRANSITIONS;
  }

  async transition(
    enterpriseId: string,
    action: AdmissionAction,
    operatedBy: string,
    reason?: string,
  ) {
    const [enterprise] = await this.db
      .select()
      .from(schema.enterprises)
      .where(eq(schema.enterprises.id, enterpriseId))
      .limit(1);

    if (!enterprise) {
      throw new HttpException('企业不存在', HttpStatus.NOT_FOUND);
    }

    const currentStatus = enterprise.admissionStatus;
    const transitions = VALID_TRANSITIONS[currentStatus];

    if (!transitions || !transitions[action]) {
      throw new HttpException(
        `无法从状态 "${currentStatus}" 执行操作 "${action}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const toStatus = transitions[action];

    await this.db
      .update(schema.enterprises)
      .set({
        admissionStatus: toStatus,
        updatedAt: new Date(),
      })
      .where(eq(schema.enterprises.id, enterpriseId));

    const applicationId = `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await this.db.insert(schema.enterpriseApplications).values({
      id: applicationId,
      enterpriseId,
      action,
      fromStatus: currentStatus,
      toStatus,
      reason: reason ?? null,
      operatedBy,
    });

    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await this.db.insert(schema.auditLogs).values({
      id: logId,
      userId: operatedBy,
      userRole: 'manager',
      action: `admission_${action}`,
      targetType: 'enterprise',
      targetId: enterpriseId,
      detail: JSON.stringify({
        fromStatus: currentStatus,
        toStatus,
        reason,
      }),
    });

    return {
      enterpriseId,
      fromStatus: currentStatus,
      toStatus,
      action,
    };
  }

  async getHistory(enterpriseId: string) {
    const applications = await this.db
      .select()
      .from(schema.enterpriseApplications)
      .where(eq(schema.enterpriseApplications.enterpriseId, enterpriseId))
      .orderBy(schema.enterpriseApplications.createdAt);

    return applications;
  }
}

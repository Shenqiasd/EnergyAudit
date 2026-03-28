import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { and, count, desc, eq, sql } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { IEnterpriseInfoAdapter, SyncResult } from '@energy-audit/integrations';
import { ENTERPRISE_INFO_ADAPTER } from '@energy-audit/integrations';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export interface SyncJobStatus {
  enterpriseId: string;
  status: string;
  retryCount: number;
  nextRetryAt: string | null;
  lastSnapshot: string | null;
  error: string | null;
  lastSyncedAt: string | null;
}

export interface SyncHistoryItem {
  id: string;
  syncType: string;
  status: string;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

@Injectable()
export class SyncJobService {
  private readonly logger = new Logger(SyncJobService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    @Inject(ENTERPRISE_INFO_ADAPTER) private readonly enterpriseInfoAdapter: IEnterpriseInfoAdapter,
  ) {}

  async triggerSync(enterpriseId: string): Promise<SyncJobStatus> {
    const [enterprise] = await this.db
      .select()
      .from(schema.enterprises)
      .where(eq(schema.enterprises.id, enterpriseId))
      .limit(1);

    if (!enterprise) {
      throw new HttpException('企业不存在', HttpStatus.NOT_FOUND);
    }

    const [binding] = await this.db
      .select()
      .from(schema.enterpriseExternalBindings)
      .where(eq(schema.enterpriseExternalBindings.enterpriseId, enterpriseId))
      .limit(1);

    if (!binding) {
      throw new HttpException('企业未配置外部绑定', HttpStatus.BAD_REQUEST);
    }

    const syncLogId = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await this.db.insert(schema.syncLogs).values({
      id: syncLogId,
      enterpriseId,
      bindingId: binding.id,
      syncType: 'manual',
      status: 'processing',
      startedAt: new Date(),
    });

    let result: SyncResult;
    let retryCount = 0;

    while (retryCount <= MAX_RETRIES) {
      try {
        result = await this.enterpriseInfoAdapter.syncEnterprise(enterpriseId);

        if (result.status === 'success') {
          await this.db
            .update(schema.enterpriseExternalBindings)
            .set({
              syncStatus: 'synced',
              lastSyncedAt: new Date(),
              lastSuccessfulSnapshot: JSON.stringify(result.data),
              updatedAt: new Date(),
            })
            .where(eq(schema.enterpriseExternalBindings.id, binding.id));

          await this.db
            .update(schema.syncLogs)
            .set({
              status: 'completed',
              responsePayload: JSON.stringify(result.data),
              completedAt: new Date(),
            })
            .where(eq(schema.syncLogs.id, syncLogId));

          return {
            enterpriseId,
            status: 'synced',
            retryCount,
            nextRetryAt: null,
            lastSnapshot: JSON.stringify(result.data),
            error: null,
            lastSyncedAt: new Date().toISOString(),
          };
        }

        throw new Error(result.error ?? '同步返回失败状态');
      } catch (error) {
        retryCount++;
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        this.logger.warn(`同步失败 (${retryCount}/${MAX_RETRIES}): ${errorMessage}`);

        if (retryCount <= MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, retryCount - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          const degraded = binding.lastSuccessfulSnapshot !== null;
          const finalStatus = degraded ? 'degraded' : 'failed';

          await this.db
            .update(schema.enterpriseExternalBindings)
            .set({
              syncStatus: finalStatus,
              updatedAt: new Date(),
            })
            .where(eq(schema.enterpriseExternalBindings.id, binding.id));

          await this.db
            .update(schema.syncLogs)
            .set({
              status: 'failed',
              errorMessage,
              completedAt: new Date(),
            })
            .where(eq(schema.syncLogs.id, syncLogId));

          return {
            enterpriseId,
            status: finalStatus,
            retryCount: retryCount - 1,
            nextRetryAt: null,
            lastSnapshot: binding.lastSuccessfulSnapshot,
            error: errorMessage,
            lastSyncedAt: binding.lastSyncedAt?.toISOString() ?? null,
          };
        }
      }
    }

    return {
      enterpriseId,
      status: 'failed',
      retryCount: MAX_RETRIES,
      nextRetryAt: null,
      lastSnapshot: null,
      error: '超过最大重试次数',
      lastSyncedAt: null,
    };
  }

  async getSyncStatus(enterpriseId: string): Promise<SyncJobStatus> {
    const [binding] = await this.db
      .select()
      .from(schema.enterpriseExternalBindings)
      .where(eq(schema.enterpriseExternalBindings.enterpriseId, enterpriseId))
      .limit(1);

    if (!binding) {
      return {
        enterpriseId,
        status: 'not_configured',
        retryCount: 0,
        nextRetryAt: null,
        lastSnapshot: null,
        error: null,
        lastSyncedAt: null,
      };
    }

    const [latestLog] = await this.db
      .select()
      .from(schema.syncLogs)
      .where(eq(schema.syncLogs.enterpriseId, enterpriseId))
      .orderBy(desc(schema.syncLogs.startedAt))
      .limit(1);

    return {
      enterpriseId,
      status: binding.syncStatus,
      retryCount: 0,
      nextRetryAt: null,
      lastSnapshot: binding.lastSuccessfulSnapshot,
      error: latestLog?.errorMessage ?? null,
      lastSyncedAt: binding.lastSyncedAt?.toISOString() ?? null,
    };
  }

  async getSyncHistory(enterpriseId: string, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    const [items, totalResult] = await Promise.all([
      this.db
        .select({
          id: schema.syncLogs.id,
          syncType: schema.syncLogs.syncType,
          status: schema.syncLogs.status,
          errorMessage: schema.syncLogs.errorMessage,
          startedAt: schema.syncLogs.startedAt,
          completedAt: schema.syncLogs.completedAt,
        })
        .from(schema.syncLogs)
        .where(eq(schema.syncLogs.enterpriseId, enterpriseId))
        .orderBy(desc(schema.syncLogs.startedAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(schema.syncLogs)
        .where(eq(schema.syncLogs.enterpriseId, enterpriseId)),
    ]);

    return {
      items,
      total: totalResult[0]?.total ?? 0,
      page,
      pageSize,
    };
  }
}

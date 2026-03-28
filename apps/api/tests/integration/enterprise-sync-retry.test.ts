import { describe, expect, it } from 'vitest';

import { SyncJobService } from '../../src/modules/integration/sync-job.service';
import { ENTERPRISE_INFO_ADAPTER } from '@energy-audit/integrations';
import type { IEnterpriseInfoAdapter, EnterpriseInfoDTO, SyncResult } from '@energy-audit/integrations';
import * as schema from '../../src/db/schema';

class SuccessAdapter implements IEnterpriseInfoAdapter {
  async fetchEnterpriseInfo(_creditCode: string): Promise<EnterpriseInfoDTO> {
    return {
      creditCode: '91110000MA01TEST01',
      name: '测试企业',
      legalRepresentative: '张三',
      registeredCapital: '5000万元',
      establishDate: '2010-03-15',
      businessScope: '测试',
      registeredAddress: '测试地址',
      industryCode: 'D4430',
      industryName: '热力生产和供应',
      contactPhone: '010-88886666',
      contactEmail: 'test@example.com',
      status: 'active',
    };
  }

  async syncEnterprise(_enterpriseId: string): Promise<SyncResult> {
    return {
      status: 'success',
      data: await this.fetchEnterpriseInfo(''),
      error: null,
      syncedAt: new Date().toISOString(),
    };
  }

  async checkConnection(): Promise<boolean> {
    return true;
  }
}

class FailingAdapter implements IEnterpriseInfoAdapter {
  private callCount = 0;

  async fetchEnterpriseInfo(_creditCode: string): Promise<EnterpriseInfoDTO> {
    throw new Error('外部系统不可用');
  }

  async syncEnterprise(_enterpriseId: string): Promise<SyncResult> {
    this.callCount++;
    return {
      status: 'failed',
      data: null,
      error: `同步失败 (第${this.callCount}次)`,
      syncedAt: new Date().toISOString(),
    };
  }

  async checkConnection(): Promise<boolean> {
    return false;
  }

  getCallCount() {
    return this.callCount;
  }
}

function chainTerminal(value: unknown) {
  return {
    limit: () => Promise.resolve(value),
    offset: () => Promise.resolve(value),
    orderBy: () => ({
      limit: () => Promise.resolve(value),
      offset: () => Promise.resolve(value),
    }),
  };
}

function createMockDb(opts: {
  enterpriseRows: unknown[];
  bindingRows: unknown[];
}) {
  let bindingRows = [...opts.bindingRows];

  return {
    select: (..._args: unknown[]) => ({
      from: (table: unknown) => ({
        where: (..._whereArgs: unknown[]) => {
          if (table === schema.enterprises) {
            return chainTerminal(opts.enterpriseRows);
          }
          if (table === schema.enterpriseExternalBindings) {
            return chainTerminal(bindingRows);
          }
          if (table === schema.syncLogs) {
            return chainTerminal([]);
          }
          return chainTerminal([]);
        },
        orderBy: () => ({
          limit: () => Promise.resolve([]),
          offset: () => Promise.resolve([]),
        }),
      }),
    }),
    insert: () => ({
      values: (val: Record<string, unknown>) => ({
        returning: () => Promise.resolve([{ ...val, id: val.id ?? 'sync_log_001' }]),
      }),
    }),
    update: () => ({
      set: (val: Record<string, unknown>) => ({
        where: () => {
          if (val.syncStatus && bindingRows.length > 0) {
            bindingRows = bindingRows.map((b) => ({ ...(b as object), ...val }));
          }
          return { returning: () => Promise.resolve([val]) };
        },
      }),
    }),
  };
}

describe('enterprise sync retry', () => {
  it('triggerSync returns synced status on success', async () => {
    const mockDb = createMockDb({
      enterpriseRows: [{ id: 'ent_test_001', name: '测试企业' }],
      bindingRows: [{
        id: 'bind_001', enterpriseId: 'ent_test_001',
        syncStatus: 'pending', lastSyncedAt: null, lastSuccessfulSnapshot: null,
      }],
    });

    const service = new SyncJobService(mockDb as any, new SuccessAdapter());
    const result = await service.triggerSync('ent_test_001');

    expect(result.enterpriseId).toBe('ent_test_001');
    expect(result.status).toBe('synced');
    expect(result.retryCount).toBe(0);
    expect(result.error).toBeNull();
  });

  it('triggerSync throws 404 when enterprise not found', async () => {
    const mockDb = createMockDb({
      enterpriseRows: [],
      bindingRows: [],
    });

    const service = new SyncJobService(mockDb as any, new SuccessAdapter());

    await expect(service.triggerSync('non_existent')).rejects.toThrow('企业不存在');
  });

  it('triggerSync enters degraded mode after max retries with existing snapshot', async () => {
    const mockDb = createMockDb({
      enterpriseRows: [{ id: 'ent_test_001', name: '测试企业' }],
      bindingRows: [{
        id: 'bind_001', enterpriseId: 'ent_test_001',
        syncStatus: 'pending', lastSyncedAt: null,
        lastSuccessfulSnapshot: JSON.stringify({ name: '旧快照数据' }),
      }],
    });

    const failAdapter = new FailingAdapter();
    const service = new SyncJobService(mockDb as any, failAdapter);
    const result = await service.triggerSync('ent_test_001');

    expect(result.status).toBe('degraded');
    expect(result.lastSnapshot).toBeDefined();
    expect(result.retryCount).toBe(3);
    expect(failAdapter.getCallCount()).toBeGreaterThanOrEqual(1);
  }, 30000);

  it('triggerSync returns failed status after max retries without snapshot', async () => {
    const mockDb = createMockDb({
      enterpriseRows: [{ id: 'ent_test_001', name: '测试企业' }],
      bindingRows: [{
        id: 'bind_001', enterpriseId: 'ent_test_001',
        syncStatus: 'pending', lastSyncedAt: null, lastSuccessfulSnapshot: null,
      }],
    });

    const failAdapter = new FailingAdapter();
    const service = new SyncJobService(mockDb as any, failAdapter);
    const result = await service.triggerSync('ent_test_001');

    expect(result.status).toBe('failed');
    expect(result.error).toBeDefined();
    expect(result.retryCount).toBe(3);
  }, 30000);

  it('getSyncStatus returns not_configured when no binding exists', async () => {
    const mockDb = createMockDb({
      enterpriseRows: [{ id: 'ent_test_001', name: '测试企业' }],
      bindingRows: [],
    });

    const service = new SyncJobService(mockDb as any, new SuccessAdapter());
    const result = await service.getSyncStatus('ent_test_001');

    expect(result.enterpriseId).toBe('ent_test_001');
    expect(result.status).toBe('not_configured');
  });
});

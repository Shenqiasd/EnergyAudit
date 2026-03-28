import { describe, expect, it } from 'vitest';

/**
 * Pure unit tests for external binding logic.
 * Tests sync status transitions and degraded mode without DB involvement.
 */

type SyncStatus = 'pending' | 'synced' | 'failed' | 'degraded';

interface Binding {
  id: string;
  enterpriseId: string;
  externalSystem: string;
  externalId: string | null;
  syncStatus: SyncStatus;
  lastSuccessfulSnapshot: string | null;
  lastSyncedAt: Date | null;
}

function createBinding(enterpriseId: string, externalSystem: string, creditCode: string): Binding {
  return {
    id: `bind_${Date.now()}`,
    enterpriseId,
    externalSystem,
    externalId: `ext_${creditCode}`,
    syncStatus: 'pending',
    lastSuccessfulSnapshot: null,
    lastSyncedAt: null,
  };
}

function syncBinding(binding: Binding, success: boolean): Binding {
  if (success) {
    const snapshot = JSON.stringify({
      syncedAt: new Date().toISOString(),
      enterpriseId: binding.enterpriseId,
      bindingId: binding.id,
      externalId: binding.externalId,
    });
    return {
      ...binding,
      syncStatus: 'synced',
      lastSuccessfulSnapshot: snapshot,
      lastSyncedAt: new Date(),
    };
  }

  // Failed sync - enter degraded mode if we have a previous snapshot
  return {
    ...binding,
    syncStatus: binding.lastSuccessfulSnapshot ? 'degraded' : 'failed',
  };
}

function canSync(binding: Binding): boolean {
  return binding.syncStatus !== 'synced' || binding.externalId !== null;
}

describe('external binding', () => {
  describe('binding creation', () => {
    it('creates a binding with pending status', () => {
      const binding = createBinding('ent_1', 'enterprise-info', '91110000MA001TEST1');

      expect(binding.enterpriseId).toBe('ent_1');
      expect(binding.externalSystem).toBe('enterprise-info');
      expect(binding.externalId).toBe('ext_91110000MA001TEST1');
      expect(binding.syncStatus).toBe('pending');
      expect(binding.lastSuccessfulSnapshot).toBeNull();
    });

    it('auto-matches external ID from credit code', () => {
      const binding = createBinding('ent_2', 'enterprise-info', '91440300MA5FKJ2X3B');

      expect(binding.externalId).toBe('ext_91440300MA5FKJ2X3B');
    });
  });

  describe('sync status transitions', () => {
    it('transitions pending → synced on successful sync', () => {
      const binding = createBinding('ent_1', 'enterprise-info', '91110000MA001TEST1');
      expect(binding.syncStatus).toBe('pending');

      const synced = syncBinding(binding, true);
      expect(synced.syncStatus).toBe('synced');
      expect(synced.lastSuccessfulSnapshot).not.toBeNull();
      expect(synced.lastSyncedAt).not.toBeNull();
    });

    it('transitions pending → failed on first failed sync (no snapshot)', () => {
      const binding = createBinding('ent_1', 'enterprise-info', '91110000MA001TEST1');
      expect(binding.lastSuccessfulSnapshot).toBeNull();

      const failed = syncBinding(binding, false);
      expect(failed.syncStatus).toBe('failed');
    });

    it('transitions synced → degraded on failed sync (has snapshot)', () => {
      let binding = createBinding('ent_1', 'enterprise-info', '91110000MA001TEST1');
      binding = syncBinding(binding, true);
      expect(binding.syncStatus).toBe('synced');
      expect(binding.lastSuccessfulSnapshot).not.toBeNull();

      const degraded = syncBinding(binding, false);
      expect(degraded.syncStatus).toBe('degraded');
    });

    it('preserves last successful snapshot in degraded mode', () => {
      let binding = createBinding('ent_1', 'enterprise-info', '91110000MA001TEST1');
      binding = syncBinding(binding, true);
      const snapshot = binding.lastSuccessfulSnapshot;

      const degraded = syncBinding(binding, false);
      expect(degraded.syncStatus).toBe('degraded');
      expect(degraded.lastSuccessfulSnapshot).toBe(snapshot);
    });

    it('recovers from degraded → synced on successful resync', () => {
      let binding = createBinding('ent_1', 'enterprise-info', '91110000MA001TEST1');
      binding = syncBinding(binding, true);
      binding = syncBinding(binding, false);
      expect(binding.syncStatus).toBe('degraded');

      const recovered = syncBinding(binding, true);
      expect(recovered.syncStatus).toBe('synced');
      expect(recovered.lastSuccessfulSnapshot).not.toBeNull();
    });

    it('recovers from failed → synced on successful resync', () => {
      let binding = createBinding('ent_1', 'enterprise-info', '91110000MA001TEST1');
      binding = syncBinding(binding, false);
      expect(binding.syncStatus).toBe('failed');

      const recovered = syncBinding(binding, true);
      expect(recovered.syncStatus).toBe('synced');
    });
  });

  describe('sync eligibility', () => {
    it('allows sync for pending bindings', () => {
      const binding = createBinding('ent_1', 'enterprise-info', '91110000MA001TEST1');
      expect(canSync(binding)).toBe(true);
    });

    it('allows resync for synced bindings with external ID', () => {
      let binding = createBinding('ent_1', 'enterprise-info', '91110000MA001TEST1');
      binding = syncBinding(binding, true);
      expect(canSync(binding)).toBe(true);
    });

    it('allows sync for failed bindings', () => {
      let binding = createBinding('ent_1', 'enterprise-info', '91110000MA001TEST1');
      binding = syncBinding(binding, false);
      expect(canSync(binding)).toBe(true);
    });

    it('allows sync for degraded bindings', () => {
      let binding = createBinding('ent_1', 'enterprise-info', '91110000MA001TEST1');
      binding = syncBinding(binding, true);
      binding = syncBinding(binding, false);
      expect(canSync(binding)).toBe(true);
    });
  });
});

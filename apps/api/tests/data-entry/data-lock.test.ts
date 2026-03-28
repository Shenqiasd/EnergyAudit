import { describe, expect, it } from 'vitest';

/**
 * Pure unit tests for collaborative lock logic.
 * Tests lock acquisition, release, and expiry without DB involvement.
 */

const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface DataLock {
  id: string;
  recordId: string;
  userId: string;
  lockedAt: Date;
  expiresAt: Date;
}

function isLockExpired(lock: DataLock, now: Date = new Date()): boolean {
  return lock.expiresAt.getTime() <= now.getTime();
}

function createLock(recordId: string, userId: string): DataLock {
  const now = new Date();
  return {
    id: `lk_${Date.now()}`,
    recordId,
    userId,
    lockedAt: now,
    expiresAt: new Date(now.getTime() + LOCK_DURATION_MS),
  };
}

class LockManager {
  private locks: Map<string, DataLock> = new Map();

  acquireLock(recordId: string, userId: string): DataLock | { error: string } {
    // Clean expired locks first
    this.releaseExpiredLocks();

    const existing = this.locks.get(recordId);
    if (existing) {
      if (existing.userId === userId) {
        // Refresh lock
        const now = new Date();
        existing.lockedAt = now;
        existing.expiresAt = new Date(now.getTime() + LOCK_DURATION_MS);
        return existing;
      }
      return { error: `该记录已被其他用户锁定 (用户: ${existing.userId})` };
    }

    const lock = createLock(recordId, userId);
    this.locks.set(recordId, lock);
    return lock;
  }

  releaseLock(recordId: string, userId: string): { released: boolean; error?: string } {
    const lock = this.locks.get(recordId);
    if (!lock) {
      return { released: true };
    }
    if (lock.userId !== userId) {
      return { released: false, error: '只能释放自己持有的锁' };
    }
    this.locks.delete(recordId);
    return { released: true };
  }

  getLockStatus(recordId: string): { locked: boolean; userId?: string; expiresAt?: Date } {
    this.releaseExpiredLocks();
    const lock = this.locks.get(recordId);
    if (!lock) return { locked: false };
    return { locked: true, userId: lock.userId, expiresAt: lock.expiresAt };
  }

  releaseExpiredLocks(): number {
    const now = new Date();
    let released = 0;
    for (const [recordId, lock] of this.locks) {
      if (isLockExpired(lock, now)) {
        this.locks.delete(recordId);
        released++;
      }
    }
    return released;
  }

  // Test helper
  setLock(lock: DataLock): void {
    this.locks.set(lock.recordId, lock);
  }
}

describe('data lock', () => {
  describe('acquires lock successfully', () => {
    it('should acquire lock on unlocked record', () => {
      const manager = new LockManager();
      const result = manager.acquireLock('record-1', 'user-1');

      expect('error' in result).toBe(false);
      const lock = result as DataLock;
      expect(lock.recordId).toBe('record-1');
      expect(lock.userId).toBe('user-1');
      expect(lock.expiresAt.getTime()).toBeGreaterThan(lock.lockedAt.getTime());
    });

    it('should set 30-minute expiry', () => {
      const manager = new LockManager();
      const result = manager.acquireLock('record-1', 'user-1') as DataLock;

      const expectedDuration = LOCK_DURATION_MS;
      const actualDuration = result.expiresAt.getTime() - result.lockedAt.getTime();
      expect(actualDuration).toBe(expectedDuration);
    });

    it('should allow same user to refresh lock', () => {
      const manager = new LockManager();
      manager.acquireLock('record-1', 'user-1');
      const result = manager.acquireLock('record-1', 'user-1');

      expect('error' in result).toBe(false);
      const lock = result as DataLock;
      expect(lock.userId).toBe('user-1');
    });
  });

  describe('blocks second lock attempt on same record', () => {
    it('should block different user from acquiring lock', () => {
      const manager = new LockManager();
      manager.acquireLock('record-1', 'user-1');
      const result = manager.acquireLock('record-1', 'user-2');

      expect('error' in result).toBe(true);
      const error = result as { error: string };
      expect(error.error).toContain('已被其他用户锁定');
      expect(error.error).toContain('user-1');
    });

    it('should block third user too', () => {
      const manager = new LockManager();
      manager.acquireLock('record-1', 'user-1');
      const result = manager.acquireLock('record-1', 'user-3');

      expect('error' in result).toBe(true);
    });
  });

  describe('releases lock', () => {
    it('should release lock held by user', () => {
      const manager = new LockManager();
      manager.acquireLock('record-1', 'user-1');
      const result = manager.releaseLock('record-1', 'user-1');

      expect(result.released).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow new lock after release', () => {
      const manager = new LockManager();
      manager.acquireLock('record-1', 'user-1');
      manager.releaseLock('record-1', 'user-1');

      const newLock = manager.acquireLock('record-1', 'user-2');
      expect('error' in newLock).toBe(false);
      expect((newLock as DataLock).userId).toBe('user-2');
    });

    it('should succeed when releasing non-existent lock', () => {
      const manager = new LockManager();
      const result = manager.releaseLock('record-99', 'user-1');
      expect(result.released).toBe(true);
    });

    it('should block releasing lock held by another user', () => {
      const manager = new LockManager();
      manager.acquireLock('record-1', 'user-1');
      const result = manager.releaseLock('record-1', 'user-2');

      expect(result.released).toBe(false);
      expect(result.error).toBe('只能释放自己持有的锁');
    });
  });

  describe('auto-releases expired locks (30 min)', () => {
    it('should auto-release expired lock', () => {
      const manager = new LockManager();

      // Create a lock that expired 1 minute ago
      const expiredLock: DataLock = {
        id: 'lk_expired',
        recordId: 'record-1',
        userId: 'user-1',
        lockedAt: new Date(Date.now() - LOCK_DURATION_MS - 60000),
        expiresAt: new Date(Date.now() - 60000),
      };

      manager.setLock(expiredLock);
      const released = manager.releaseExpiredLocks();
      expect(released).toBe(1);

      // Should be unlocked now
      const status = manager.getLockStatus('record-1');
      expect(status.locked).toBe(false);
    });

    it('should not release valid lock', () => {
      const manager = new LockManager();
      manager.acquireLock('record-1', 'user-1');

      const released = manager.releaseExpiredLocks();
      expect(released).toBe(0);

      const status = manager.getLockStatus('record-1');
      expect(status.locked).toBe(true);
    });

    it('should allow new lock after expired lock is cleaned', () => {
      const manager = new LockManager();

      // Create an expired lock
      const expiredLock: DataLock = {
        id: 'lk_expired',
        recordId: 'record-1',
        userId: 'user-1',
        lockedAt: new Date(Date.now() - LOCK_DURATION_MS - 60000),
        expiresAt: new Date(Date.now() - 60000),
      };

      manager.setLock(expiredLock);

      // Different user should be able to acquire after cleanup
      const newLock = manager.acquireLock('record-1', 'user-2');
      expect('error' in newLock).toBe(false);
      expect((newLock as DataLock).userId).toBe('user-2');
    });

    it('should clean multiple expired locks at once', () => {
      const manager = new LockManager();

      for (let i = 0; i < 5; i++) {
        manager.setLock({
          id: `lk_${i}`,
          recordId: `record-${i}`,
          userId: `user-${i}`,
          lockedAt: new Date(Date.now() - LOCK_DURATION_MS - 60000),
          expiresAt: new Date(Date.now() - 60000),
        });
      }

      const released = manager.releaseExpiredLocks();
      expect(released).toBe(5);
    });

    it('should report correct lock status', () => {
      const manager = new LockManager();
      manager.acquireLock('record-1', 'user-1');

      const status = manager.getLockStatus('record-1');
      expect(status.locked).toBe(true);
      expect(status.userId).toBe('user-1');
      expect(status.expiresAt).toBeDefined();

      const unlocked = manager.getLockStatus('record-99');
      expect(unlocked.locked).toBe(false);
    });
  });
});

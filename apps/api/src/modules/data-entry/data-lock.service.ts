import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq, lt } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class DataLockService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async acquireLock(recordId: string, userId: string) {
    // Clean expired locks first
    await this.releaseExpiredLocks();

    // Check for existing lock
    const [existingLock] = await this.db
      .select()
      .from(schema.dataLocks)
      .where(eq(schema.dataLocks.recordId, recordId))
      .limit(1);

    if (existingLock) {
      if (existingLock.userId === userId) {
        // Refresh lock
        const newExpiry = new Date(Date.now() + LOCK_DURATION_MS);
        const [updated] = await this.db
          .update(schema.dataLocks)
          .set({ expiresAt: newExpiry, lockedAt: new Date() })
          .where(eq(schema.dataLocks.id, existingLock.id))
          .returning();
        return updated;
      }

      throw new HttpException(
        `该记录已被其他用户锁定 (用户: ${existingLock.userId})`,
        HttpStatus.CONFLICT,
      );
    }

    const lockId = `lk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const expiresAt = new Date(Date.now() + LOCK_DURATION_MS);

    const [lock] = await this.db
      .insert(schema.dataLocks)
      .values({
        id: lockId,
        recordId,
        userId,
        lockedAt: new Date(),
        expiresAt,
      })
      .returning();

    return lock;
  }

  async releaseLock(recordId: string, userId: string) {
    const [lock] = await this.db
      .select()
      .from(schema.dataLocks)
      .where(eq(schema.dataLocks.recordId, recordId))
      .limit(1);

    if (!lock) {
      return { released: true };
    }

    if (lock.userId !== userId) {
      throw new HttpException(
        '只能释放自己持有的锁',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.db
      .delete(schema.dataLocks)
      .where(eq(schema.dataLocks.id, lock.id));

    return { released: true };
  }

  async getLockStatus(recordId: string) {
    await this.releaseExpiredLocks();

    const [lock] = await this.db
      .select()
      .from(schema.dataLocks)
      .where(eq(schema.dataLocks.recordId, recordId))
      .limit(1);

    if (!lock) {
      return { locked: false };
    }

    return {
      locked: true,
      userId: lock.userId,
      lockedAt: lock.lockedAt,
      expiresAt: lock.expiresAt,
    };
  }

  async releaseExpiredLocks() {
    const now = new Date();
    await this.db
      .delete(schema.dataLocks)
      .where(lt(schema.dataLocks.expiresAt, now));
  }
}

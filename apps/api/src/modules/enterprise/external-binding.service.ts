import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

@Injectable()
export class ExternalBindingService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async bindByCredictCode(enterpriseId: string, externalSystem: string) {
    const [enterprise] = await this.db
      .select()
      .from(schema.enterprises)
      .where(eq(schema.enterprises.id, enterpriseId))
      .limit(1);

    if (!enterprise) {
      throw new HttpException('企业不存在', HttpStatus.NOT_FOUND);
    }

    const existingBinding = await this.db
      .select()
      .from(schema.enterpriseExternalBindings)
      .where(
        and(
          eq(schema.enterpriseExternalBindings.enterpriseId, enterpriseId),
          eq(schema.enterpriseExternalBindings.externalSystem, externalSystem),
        ),
      )
      .limit(1);

    if (existingBinding.length > 0) {
      return existingBinding[0];
    }

    const externalId = `ext_${enterprise.unifiedSocialCreditCode}`;
    const bindingId = `bind_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const [binding] = await this.db
      .insert(schema.enterpriseExternalBindings)
      .values({
        id: bindingId,
        enterpriseId,
        externalSystem,
        externalId,
        syncStatus: 'pending',
      })
      .returning();

    return binding;
  }

  async getBinding(enterpriseId: string) {
    const bindings = await this.db
      .select()
      .from(schema.enterpriseExternalBindings)
      .where(eq(schema.enterpriseExternalBindings.enterpriseId, enterpriseId));

    return bindings;
  }

  async syncEnterprise(enterpriseId: string) {
    const bindings = await this.db
      .select()
      .from(schema.enterpriseExternalBindings)
      .where(eq(schema.enterpriseExternalBindings.enterpriseId, enterpriseId));

    if (bindings.length === 0) {
      throw new HttpException('企业未绑定外部系统', HttpStatus.NOT_FOUND);
    }

    const results = [];

    for (const binding of bindings) {
      const logId = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date();

      try {
        const snapshot = JSON.stringify({
          syncedAt: now.toISOString(),
          enterpriseId,
          bindingId: binding.id,
          externalId: binding.externalId,
        });

        await this.db
          .update(schema.enterpriseExternalBindings)
          .set({
            syncStatus: 'synced',
            lastSyncedAt: now,
            lastSuccessfulSnapshot: snapshot,
            updatedAt: now,
          })
          .where(eq(schema.enterpriseExternalBindings.id, binding.id));

        await this.db.insert(schema.syncLogs).values({
          id: logId,
          enterpriseId,
          bindingId: binding.id,
          syncType: 'manual',
          status: 'success',
          responsePayload: snapshot,
          startedAt: now,
          completedAt: new Date(),
        });

        results.push({
          bindingId: binding.id,
          status: 'synced',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (binding.lastSuccessfulSnapshot) {
          await this.db
            .update(schema.enterpriseExternalBindings)
            .set({
              syncStatus: 'degraded',
              updatedAt: now,
            })
            .where(eq(schema.enterpriseExternalBindings.id, binding.id));
        } else {
          await this.db
            .update(schema.enterpriseExternalBindings)
            .set({
              syncStatus: 'failed',
              updatedAt: now,
            })
            .where(eq(schema.enterpriseExternalBindings.id, binding.id));
        }

        await this.db.insert(schema.syncLogs).values({
          id: logId,
          enterpriseId,
          bindingId: binding.id,
          syncType: 'manual',
          status: 'failed',
          errorMessage,
          startedAt: now,
          completedAt: new Date(),
        });

        results.push({
          bindingId: binding.id,
          status: binding.lastSuccessfulSnapshot ? 'degraded' : 'failed',
          error: errorMessage,
        });
      }
    }

    return results;
  }
}

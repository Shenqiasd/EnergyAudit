import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import {
  resolveModuleConfig,
  resolveFieldConfig,
  resolveValidationRules,
} from '@energy-audit/config-engine';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { ConfigOverrideRecord, ResolutionContext } from '@energy-audit/config-engine';

export interface SetOverrideDto {
  scopeType: string;
  scopeId?: string | null;
  targetType: string;
  targetCode: string;
  configJson: Record<string, unknown>;
  createdBy?: string;
}

@Injectable()
export class ConfigOverrideService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getOverrides(scopeType: string, scopeId?: string | null, targetType?: string) {
    const conditions = [eq(schema.configOverrides.scopeType, scopeType)];

    if (scopeId !== undefined && scopeId !== null) {
      conditions.push(eq(schema.configOverrides.scopeId, scopeId));
    }

    if (targetType) {
      conditions.push(eq(schema.configOverrides.targetType, targetType));
    }

    return this.db
      .select()
      .from(schema.configOverrides)
      .where(and(...conditions));
  }

  async setOverride(dto: SetOverrideDto) {
    const id = `co_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Try to find existing override
    const conditions = [
      eq(schema.configOverrides.scopeType, dto.scopeType),
      eq(schema.configOverrides.targetType, dto.targetType),
      eq(schema.configOverrides.targetCode, dto.targetCode),
    ];

    if (dto.scopeId) {
      conditions.push(eq(schema.configOverrides.scopeId, dto.scopeId));
    }

    const existing = await this.db
      .select()
      .from(schema.configOverrides)
      .where(and(...conditions))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await this.db
        .update(schema.configOverrides)
        .set({
          configJson: dto.configJson,
          updatedAt: new Date(),
        })
        .where(eq(schema.configOverrides.id, existing[0].id));

      return { ...existing[0], configJson: dto.configJson };
    }

    // Create new
    const newOverride = {
      id,
      scopeType: dto.scopeType,
      scopeId: dto.scopeId ?? null,
      targetType: dto.targetType,
      targetCode: dto.targetCode,
      configJson: dto.configJson,
      isActive: true,
      createdBy: dto.createdBy ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.insert(schema.configOverrides).values(newOverride);
    return newOverride;
  }

  async deleteOverride(id: string) {
    await this.db
      .delete(schema.configOverrides)
      .where(eq(schema.configOverrides.id, id));
    return { deleted: true };
  }

  async getEffectiveConfig(moduleCode: string, context: ResolutionContext) {
    // Load all active overrides that could be relevant
    const allOverrides = await this.db
      .select()
      .from(schema.configOverrides)
      .where(eq(schema.configOverrides.isActive, true));

    const overrideRecords: ConfigOverrideRecord[] = allOverrides.map((o) => ({
      id: o.id,
      scopeType: o.scopeType as ConfigOverrideRecord['scopeType'],
      scopeId: o.scopeId,
      targetType: o.targetType as ConfigOverrideRecord['targetType'],
      targetCode: o.targetCode,
      configJson: o.configJson as Record<string, unknown>,
      isActive: o.isActive,
    }));

    // Load base module config
    const [baseModule] = await this.db
      .select()
      .from(schema.dataModules)
      .where(eq(schema.dataModules.code, moduleCode))
      .limit(1);

    if (!baseModule) {
      return { error: 'Module not found', moduleCode };
    }

    const mergedModule = resolveModuleConfig(baseModule, overrideRecords, context);

    // Load base fields
    const baseFields = await this.db
      .select()
      .from(schema.dataFields)
      .where(eq(schema.dataFields.moduleId, baseModule.id));

    const mergedFields = baseFields.map((f) =>
      resolveFieldConfig(
        {
          code: f.code,
          name: f.name,
          fieldType: f.fieldType,
          constraints: f.constraints,
          displayRules: f.displayRules,
          sortOrder: f.sortOrder,
        },
        moduleCode,
        overrideRecords,
        context,
      ),
    );

    // Load base validation rules
    const baseRules = await this.db
      .select()
      .from(schema.validationRules)
      .where(eq(schema.validationRules.moduleCode, moduleCode));

    const mergedRules = resolveValidationRules(baseRules, overrideRecords, context);

    return {
      module: mergedModule,
      fields: mergedFields,
      validationRules: mergedRules,
    };
  }
}

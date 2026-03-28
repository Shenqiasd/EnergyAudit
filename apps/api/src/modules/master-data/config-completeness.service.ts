import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface ConfigCompletenessResult {
  isComplete: boolean;
  energyDefinitions: { count: number; required: number; complete: boolean };
  productDefinitions: { count: number; required: number; complete: boolean };
  unitDefinitions: { count: number; required: number; complete: boolean };
  missingItems: string[];
}

@Injectable()
export class ConfigCompletenessService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async check(enterpriseId: string): Promise<ConfigCompletenessResult> {
    const [energyCount, productCount, unitCount] = await Promise.all([
      this.countActive(schema.energyDefinitions, enterpriseId),
      this.countActive(schema.productDefinitions, enterpriseId),
      this.countActive(schema.unitDefinitions, enterpriseId),
    ]);

    const missingItems: string[] = [];

    if (energyCount === 0) {
      missingItems.push('至少需要配置1个能源品种定义');
    }
    if (productCount === 0) {
      missingItems.push('至少需要配置1个产品定义');
    }
    if (unitCount === 0) {
      missingItems.push('至少需要配置1个单元定义');
    }

    return {
      isComplete: missingItems.length === 0,
      energyDefinitions: {
        count: energyCount,
        required: 1,
        complete: energyCount >= 1,
      },
      productDefinitions: {
        count: productCount,
        required: 1,
        complete: productCount >= 1,
      },
      unitDefinitions: {
        count: unitCount,
        required: 1,
        complete: unitCount >= 1,
      },
      missingItems,
    };
  }

  private async countActive(
    table: typeof schema.energyDefinitions | typeof schema.productDefinitions | typeof schema.unitDefinitions,
    enterpriseId: string,
  ): Promise<number> {
    const items = await this.db
      .select()
      .from(table)
      .where(
        and(
          eq(table.enterpriseId, enterpriseId),
          eq(table.isActive, true),
        ),
      );
    return items.length;
  }
}

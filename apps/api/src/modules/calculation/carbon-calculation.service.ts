import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CarbonEmissionItem {
  energyCode: string;
  energyName: string;
  activityData: number;
  emissionFactor: number;
  oxidationRate: number;
  emission: number;
  measurementUnit: string;
}

export interface CarbonEmissionResult {
  items: CarbonEmissionItem[];
  totalEmission: number;
}

@Injectable()
export class CarbonCalculationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async calculateCarbonEmissions(
    dataItems: Array<{ fieldCode: string; finalValue: string | null; rawValue: string | null }>,
    year?: number,
  ): Promise<CarbonEmissionResult> {
    const factors = await this.db
      .select()
      .from(schema.carbonEmissionFactors)
      .where(eq(schema.carbonEmissionFactors.isActive, true));

    const items: CarbonEmissionItem[] = [];
    let totalEmission = 0;

    for (const factor of factors) {
      const consumptionField = `${factor.energyCode}_consumption`;
      const item = dataItems.find((i) => i.fieldCode === consumptionField);
      if (!item) continue;

      const rawVal = item.finalValue ?? item.rawValue;
      if (rawVal === null || rawVal === '') continue;

      const activityData = Number(rawVal);
      if (!isFinite(activityData) || activityData === 0) continue;

      const emissionFactor = Number(factor.emissionFactor);
      const oxidationRate = Number(factor.oxidationRate);

      if (!isFinite(emissionFactor) || !isFinite(oxidationRate)) continue;

      // Formula: Activity Data x Emission Factor x Oxidation Rate
      const emission = activityData * emissionFactor * oxidationRate;
      totalEmission += emission;

      items.push({
        energyCode: factor.energyCode,
        energyName: factor.name,
        activityData,
        emissionFactor,
        oxidationRate,
        emission,
        measurementUnit: factor.measurementUnit,
      });
    }

    return { items, totalEmission };
  }

  async getEmissionFactors(): Promise<Array<typeof schema.carbonEmissionFactors.$inferSelect>> {
    return this.db
      .select()
      .from(schema.carbonEmissionFactors)
      .where(eq(schema.carbonEmissionFactors.isActive, true));
  }
}

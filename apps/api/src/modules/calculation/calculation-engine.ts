import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface ConversionResult {
  energyCode: string;
  energyName: string;
  physicalAmount: number;
  conversionFactor: number;
  tce: number;
  measurementUnit: string;
}

export interface ComprehensiveEnergyResult {
  items: ConversionResult[];
  totalTce: number;
  equivalentValue: number;
  equalValue: number;
}

export interface EnergyIntensityResult {
  totalTce: number;
  outputValue: number;
  intensityPerOutput: number;
}

export interface ProductEnergyResult {
  productCode: string;
  productName: string;
  totalEnergy: number;
  totalOutput: number;
  unitEnergy: number;
  measurementUnit: string;
}

export interface EnergySavingResult {
  baselineTce: number;
  currentTce: number;
  savingAmount: number;
  savingRate: number;
}

@Injectable()
export class CalculationEngine {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async calculateComprehensiveEnergy(
    enterpriseId: string,
    dataItems: Array<{ fieldCode: string; finalValue: string | null; rawValue: string | null }>,
  ): Promise<ComprehensiveEnergyResult> {
    const energyDefs = await this.db
      .select()
      .from(schema.energyDefinitions)
      .where(eq(schema.energyDefinitions.enterpriseId, enterpriseId));

    const items: ConversionResult[] = [];
    let totalTce = 0;

    for (const def of energyDefs) {
      if (!def.isActive) continue;

      const consumptionField = `${def.energyCode}_consumption`;
      const item = dataItems.find((i) => i.fieldCode === consumptionField);
      if (!item) continue;

      const rawVal = item.finalValue ?? item.rawValue;
      if (rawVal === null || rawVal === '') continue;

      const physicalAmount = Number(rawVal);
      if (!isFinite(physicalAmount) || physicalAmount === 0) continue;

      const conversionFactor = Number(def.conversionFactor);
      if (!isFinite(conversionFactor)) continue;

      const tce = physicalAmount * conversionFactor;
      totalTce += tce;

      items.push({
        energyCode: def.energyCode,
        energyName: def.name,
        physicalAmount,
        conversionFactor,
        tce,
        measurementUnit: def.measurementUnit,
      });
    }

    return {
      items,
      totalTce,
      equivalentValue: totalTce,
      equalValue: totalTce,
    };
  }

  calculateEnergyIntensity(
    totalTce: number,
    outputValue: number,
  ): EnergyIntensityResult {
    const intensityPerOutput = outputValue > 0 ? totalTce / outputValue : 0;
    return {
      totalTce,
      outputValue,
      intensityPerOutput,
    };
  }

  calculateProductEnergy(
    products: Array<{
      productCode: string;
      productName: string;
      energyConsumption: number;
      outputQuantity: number;
      measurementUnit: string;
    }>,
  ): ProductEnergyResult[] {
    return products.map((p) => ({
      productCode: p.productCode,
      productName: p.productName,
      totalEnergy: p.energyConsumption,
      totalOutput: p.outputQuantity,
      unitEnergy: p.outputQuantity > 0 ? p.energyConsumption / p.outputQuantity : 0,
      measurementUnit: p.measurementUnit,
    }));
  }

  calculateEnergySaving(
    baselineTce: number,
    currentTce: number,
  ): EnergySavingResult {
    const savingAmount = baselineTce - currentTce;
    const savingRate = baselineTce > 0 ? savingAmount / baselineTce : 0;
    return {
      baselineTce,
      currentTce,
      savingAmount,
      savingRate,
    };
  }
}

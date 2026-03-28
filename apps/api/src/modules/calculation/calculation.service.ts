import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import { CalculationEngine } from './calculation-engine';
import { CarbonCalculationService } from './carbon-calculation.service';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CalculationRunResult {
  snapshotId: string;
  comprehensiveEnergy: {
    totalTce: number;
    items: Array<{
      energyCode: string;
      energyName: string;
      physicalAmount: number;
      tce: number;
    }>;
  };
  carbonEmission: {
    totalEmission: number;
    items: Array<{
      energyCode: string;
      energyName: string;
      emission: number;
    }>;
  };
  energyIntensity: {
    totalTce: number;
    outputValue: number;
    intensityPerOutput: number;
  };
  productEnergy: Array<{
    productCode: string;
    productName: string;
    unitEnergy: number;
  }>;
}

export interface BenchmarkComparison {
  indicatorCode: string;
  currentValue: number;
  benchmarkValue: number;
  difference: number;
  status: 'above' | 'below' | 'equal';
}

@Injectable()
export class CalculationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly engine: CalculationEngine,
    private readonly carbonService: CarbonCalculationService,
  ) {}

  async runCalculations(projectId: string): Promise<CalculationRunResult> {
    const [project] = await this.db
      .select()
      .from(schema.auditProjects)
      .where(eq(schema.auditProjects.id, projectId))
      .limit(1);

    if (!project) {
      throw new Error('项目不存在');
    }

    // Fetch all data items for the project
    const records = await this.db
      .select()
      .from(schema.dataRecords)
      .where(eq(schema.dataRecords.auditProjectId, projectId));

    const allItems: Array<{ fieldCode: string; finalValue: string | null; rawValue: string | null }> = [];
    for (const record of records) {
      const items = await this.db
        .select()
        .from(schema.dataItems)
        .where(eq(schema.dataItems.dataRecordId, record.id));
      allItems.push(...items.map((i) => ({
        fieldCode: i.fieldCode,
        finalValue: i.finalValue,
        rawValue: i.rawValue,
      })));
    }

    // Run comprehensive energy calculation
    const comprehensiveEnergy = await this.engine.calculateComprehensiveEnergy(
      project.enterpriseId,
      allItems,
    );

    // Run carbon emission calculation
    const carbonEmission = await this.carbonService.calculateCarbonEmissions(allItems);

    // Calculate energy intensity
    const outputItem = allItems.find((i) => i.fieldCode === 'total_output_value');
    const outputValue = outputItem
      ? Number(outputItem.finalValue ?? outputItem.rawValue ?? '0') || 0
      : 0;
    const energyIntensity = this.engine.calculateEnergyIntensity(
      comprehensiveEnergy.totalTce,
      outputValue,
    );

    // Calculate product energy
    const productDefs = await this.db
      .select()
      .from(schema.productDefinitions)
      .where(eq(schema.productDefinitions.enterpriseId, project.enterpriseId));

    const productInputs = productDefs
      .filter((p) => p.isActive)
      .map((p) => {
        const energyItem = allItems.find((i) => i.fieldCode === `product_${p.productCode}_energy`);
        const outputItem = allItems.find((i) => i.fieldCode === `product_${p.productCode}_output`);
        return {
          productCode: p.productCode,
          productName: p.name,
          energyConsumption: Number(energyItem?.finalValue ?? energyItem?.rawValue ?? '0') || 0,
          outputQuantity: Number(outputItem?.finalValue ?? outputItem?.rawValue ?? '0') || 0,
          measurementUnit: p.measurementUnit,
        };
      });

    const productEnergy = this.engine.calculateProductEnergy(productInputs);

    // Mark previous snapshots as not latest
    await this.db
      .update(schema.calculationSnapshots)
      .set({ isLatest: false })
      .where(
        and(
          eq(schema.calculationSnapshots.auditProjectId, projectId),
          eq(schema.calculationSnapshots.isLatest, true),
        ),
      );

    // Create snapshot
    const snapshotId = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const result = {
      comprehensiveEnergy,
      carbonEmission,
      energyIntensity,
      productEnergy,
    };

    await this.db.insert(schema.calculationSnapshots).values({
      id: snapshotId,
      auditProjectId: projectId,
      calculationType: 'full',
      result: JSON.stringify(result),
      parametersSnapshot: JSON.stringify({ itemCount: allItems.length }),
      isLatest: true,
    });

    return {
      snapshotId,
      comprehensiveEnergy: {
        totalTce: comprehensiveEnergy.totalTce,
        items: comprehensiveEnergy.items.map((i) => ({
          energyCode: i.energyCode,
          energyName: i.energyName,
          physicalAmount: i.physicalAmount,
          tce: i.tce,
        })),
      },
      carbonEmission: {
        totalEmission: carbonEmission.totalEmission,
        items: carbonEmission.items.map((i) => ({
          energyCode: i.energyCode,
          energyName: i.energyName,
          emission: i.emission,
        })),
      },
      energyIntensity,
      productEnergy: productEnergy.map((p) => ({
        productCode: p.productCode,
        productName: p.productName,
        unitEnergy: p.unitEnergy,
      })),
    };
  }

  async getSnapshots(projectId: string) {
    return this.db
      .select()
      .from(schema.calculationSnapshots)
      .where(eq(schema.calculationSnapshots.auditProjectId, projectId))
      .orderBy(schema.calculationSnapshots.calculatedAt);
  }

  async getSnapshotById(snapshotId: string) {
    const [snapshot] = await this.db
      .select()
      .from(schema.calculationSnapshots)
      .where(eq(schema.calculationSnapshots.id, snapshotId))
      .limit(1);

    if (!snapshot) {
      throw new Error('计算快照不存在');
    }

    return {
      ...snapshot,
      result: JSON.parse(snapshot.result) as Record<string, unknown>,
      parametersSnapshot: snapshot.parametersSnapshot
        ? (JSON.parse(snapshot.parametersSnapshot) as Record<string, unknown>)
        : null,
    };
  }

  async getBenchmarkComparison(projectId: string): Promise<BenchmarkComparison[]> {
    const [project] = await this.db
      .select()
      .from(schema.auditProjects)
      .where(eq(schema.auditProjects.id, projectId))
      .limit(1);

    if (!project) {
      throw new Error('项目不存在');
    }

    const [enterprise] = await this.db
      .select()
      .from(schema.enterprises)
      .where(eq(schema.enterprises.id, project.enterpriseId))
      .limit(1);

    if (!enterprise?.industryCode) {
      return [];
    }

    const benchmarks = await this.db
      .select()
      .from(schema.benchmarkValues)
      .where(eq(schema.benchmarkValues.industryCode, enterprise.industryCode));

    // Get the latest snapshot
    const [latestSnapshot] = await this.db
      .select()
      .from(schema.calculationSnapshots)
      .where(
        and(
          eq(schema.calculationSnapshots.auditProjectId, projectId),
          eq(schema.calculationSnapshots.isLatest, true),
        ),
      )
      .limit(1);

    if (!latestSnapshot) {
      return benchmarks.map((b) => ({
        indicatorCode: b.indicatorCode,
        currentValue: 0,
        benchmarkValue: Number(b.benchmarkValue),
        difference: -Number(b.benchmarkValue),
        status: 'below' as const,
      }));
    }

    const snapshotResult = JSON.parse(latestSnapshot.result) as Record<string, unknown>;

    return benchmarks.map((b) => {
      let currentValue = 0;
      if (b.indicatorCode === 'comprehensive_energy_intensity') {
        const intensity = snapshotResult['energyIntensity'] as { intensityPerOutput?: number } | undefined;
        currentValue = intensity?.intensityPerOutput ?? 0;
      } else if (b.indicatorCode === 'total_carbon_emission') {
        const carbon = snapshotResult['carbonEmission'] as { totalEmission?: number } | undefined;
        currentValue = carbon?.totalEmission ?? 0;
      }

      const benchmarkVal = Number(b.benchmarkValue);
      const difference = currentValue - benchmarkVal;
      let status: 'above' | 'below' | 'equal' = 'equal';
      if (difference > 0) status = 'above';
      else if (difference < 0) status = 'below';

      return {
        indicatorCode: b.indicatorCode,
        currentValue,
        benchmarkValue: benchmarkVal,
        difference,
        status,
      };
    });
  }
}

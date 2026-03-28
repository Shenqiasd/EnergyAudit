import { Inject, Injectable } from '@nestjs/common';
import { eq, sql, and, desc } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CarbonEmissionSummary {
  totalEmissions: number;
  byEnergyType: Array<{ energyType: string; emissions: number }>;
  byEnterprise: Array<{
    enterpriseId: string;
    enterpriseName: string;
    emissions: number;
  }>;
}

export interface CarbonTrendItem {
  year: number;
  totalEmissions: number;
}

export interface CarbonStatisticsQuery {
  batchId?: string;
  year?: string;
}

@Injectable()
export class CarbonStatisticsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getCarbonEmissions(
    query: CarbonStatisticsQuery,
  ): Promise<CarbonEmissionSummary> {
    const conditions = [
      eq(schema.calculationSnapshots.calculationType, 'carbon_emission'),
      eq(schema.calculationSnapshots.isLatest, true),
    ];

    if (query.batchId) {
      conditions.push(eq(schema.auditProjects.batchId, query.batchId));
    }

    const snapshots = await this.db
      .select({
        result: schema.calculationSnapshots.result,
        enterpriseId: schema.auditProjects.enterpriseId,
      })
      .from(schema.calculationSnapshots)
      .innerJoin(
        schema.auditProjects,
        eq(
          schema.calculationSnapshots.auditProjectId,
          schema.auditProjects.id,
        ),
      )
      .where(and(...conditions));

    let totalEmissions = 0;
    const energyTypeMap = new Map<string, number>();
    const enterpriseEmissions = new Map<string, number>();

    for (const snap of snapshots) {
      try {
        const result = JSON.parse(snap.result) as {
          totalEmissions?: number;
          byEnergyType?: Array<{ type: string; emissions: number }>;
        };
        const emissions = result.totalEmissions ?? 0;
        totalEmissions += emissions;

        enterpriseEmissions.set(
          snap.enterpriseId,
          (enterpriseEmissions.get(snap.enterpriseId) ?? 0) + emissions,
        );

        if (result.byEnergyType) {
          for (const item of result.byEnergyType) {
            energyTypeMap.set(
              item.type,
              (energyTypeMap.get(item.type) ?? 0) + item.emissions,
            );
          }
        }
      } catch {
        // skip invalid JSON
      }
    }

    // Get enterprise names
    const enterpriseIds = Array.from(enterpriseEmissions.keys());
    const enterprises =
      enterpriseIds.length > 0
        ? await this.db
            .select({ id: schema.enterprises.id, name: schema.enterprises.name })
            .from(schema.enterprises)
            .where(
              sql`${schema.enterprises.id} IN ${enterpriseIds}`,
            )
        : [];

    const enterpriseNameMap = new Map(enterprises.map((e) => [e.id, e.name]));

    return {
      totalEmissions,
      byEnergyType: Array.from(energyTypeMap.entries()).map(
        ([energyType, emissions]) => ({
          energyType,
          emissions,
        }),
      ),
      byEnterprise: Array.from(enterpriseEmissions.entries())
        .map(([enterpriseId, emissions]) => ({
          enterpriseId,
          enterpriseName: enterpriseNameMap.get(enterpriseId) ?? 'Unknown',
          emissions,
        }))
        .sort((a, b) => b.emissions - a.emissions),
    };
  }

  async getCarbonEmissionTrends(): Promise<CarbonTrendItem[]> {
    const snapshots = await this.db
      .select({
        year: schema.auditBatches.year,
        result: schema.calculationSnapshots.result,
      })
      .from(schema.calculationSnapshots)
      .innerJoin(
        schema.auditProjects,
        eq(
          schema.calculationSnapshots.auditProjectId,
          schema.auditProjects.id,
        ),
      )
      .innerJoin(
        schema.auditBatches,
        eq(schema.auditProjects.batchId, schema.auditBatches.id),
      )
      .where(
        and(
          eq(schema.calculationSnapshots.calculationType, 'carbon_emission'),
          eq(schema.calculationSnapshots.isLatest, true),
        ),
      );

    const yearMap = new Map<number, number>();
    for (const snap of snapshots) {
      try {
        const result = JSON.parse(snap.result) as {
          totalEmissions?: number;
        };
        const emissions = result.totalEmissions ?? 0;
        yearMap.set(snap.year, (yearMap.get(snap.year) ?? 0) + emissions);
      } catch {
        // skip invalid JSON
      }
    }

    return Array.from(yearMap.entries())
      .map(([year, totalEmissions]) => ({ year, totalEmissions }))
      .sort((a, b) => a.year - b.year);
  }

  async getEnterpriseRankings(query: CarbonStatisticsQuery) {
    const summary = await this.getCarbonEmissions(query);
    return summary.byEnterprise.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
  }
}

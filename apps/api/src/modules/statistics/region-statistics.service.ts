import { Inject, Injectable } from '@nestjs/common';
import { eq, sql, and } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface RegionDistributionItem {
  regionCode: string;
  regionName: string;
  enterpriseCount: number;
  totalEnergyConsumption: number;
}

export interface RegionEnergyRankingItem {
  rank: number;
  regionCode: string;
  regionName: string;
  enterpriseCount: number;
  totalEnergyConsumption: number;
}

export interface ProvinceBreakdownItem {
  province: string;
  city: string | null;
  enterpriseCount: number;
  totalEnergyConsumption: number;
}

export interface RegionComplianceItem {
  regionCode: string;
  regionName: string;
  totalProjects: number;
  completedProjects: number;
  complianceRate: number;
}

@Injectable()
export class RegionStatisticsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getRegionDistribution(batchId?: string): Promise<RegionDistributionItem[]> {
    const conditions = [];
    if (batchId) {
      conditions.push(eq(schema.auditProjects.batchId, batchId));
    }

    // Get enterprises grouped by region
    const results = await this.db
      .select({
        regionCode: schema.enterprises.regionCode,
        regionName: schema.enterprises.regionName,
        enterpriseCount: sql<number>`count(distinct ${schema.enterprises.id})`.as('enterprise_count'),
      })
      .from(schema.enterprises)
      .innerJoin(
        schema.auditProjects,
        eq(schema.enterprises.id, schema.auditProjects.enterpriseId),
      )
      .where(
        conditions.length > 0
          ? and(
              ...conditions,
              sql`${schema.enterprises.regionCode} IS NOT NULL`,
            )
          : sql`${schema.enterprises.regionCode} IS NOT NULL`,
      )
      .groupBy(schema.enterprises.regionCode, schema.enterprises.regionName);

    return results.map((r) => ({
      regionCode: r.regionCode ?? 'unknown',
      regionName: r.regionName ?? '未知区域',
      enterpriseCount: Number(r.enterpriseCount),
      totalEnergyConsumption: 0,
    }));
  }

  async getRegionEnergyRanking(
    batchId?: string,
    limit = 10,
  ): Promise<RegionEnergyRankingItem[]> {
    const conditions = [];
    if (batchId) {
      conditions.push(eq(schema.auditProjects.batchId, batchId));
    }

    const results = await this.db
      .select({
        regionCode: schema.enterprises.regionCode,
        regionName: schema.enterprises.regionName,
        enterpriseCount: sql<number>`count(distinct ${schema.enterprises.id})`.as('enterprise_count'),
      })
      .from(schema.enterprises)
      .innerJoin(
        schema.auditProjects,
        eq(schema.enterprises.id, schema.auditProjects.enterpriseId),
      )
      .where(
        conditions.length > 0
          ? and(
              ...conditions,
              sql`${schema.enterprises.regionCode} IS NOT NULL`,
            )
          : sql`${schema.enterprises.regionCode} IS NOT NULL`,
      )
      .groupBy(schema.enterprises.regionCode, schema.enterprises.regionName)
      .orderBy(sql`count(distinct ${schema.enterprises.id}) desc`)
      .limit(limit);

    return results.map((r, index) => ({
      rank: index + 1,
      regionCode: r.regionCode ?? 'unknown',
      regionName: r.regionName ?? '未知区域',
      enterpriseCount: Number(r.enterpriseCount),
      totalEnergyConsumption: 0,
    }));
  }

  async getProvinceBreakdown(
    regionCode: string,
    batchId?: string,
  ): Promise<ProvinceBreakdownItem[]> {
    const conditions = [
      eq(schema.enterprises.regionCode, regionCode),
    ];
    if (batchId) {
      conditions.push(eq(schema.auditProjects.batchId, batchId));
    }

    const results = await this.db
      .select({
        province: schema.enterprises.province,
        city: schema.enterprises.city,
        enterpriseCount: sql<number>`count(distinct ${schema.enterprises.id})`.as('enterprise_count'),
      })
      .from(schema.enterprises)
      .innerJoin(
        schema.auditProjects,
        eq(schema.enterprises.id, schema.auditProjects.enterpriseId),
      )
      .where(and(...conditions))
      .groupBy(schema.enterprises.province, schema.enterprises.city);

    return results.map((r) => ({
      province: r.province ?? '未知省份',
      city: r.city ?? null,
      enterpriseCount: Number(r.enterpriseCount),
      totalEnergyConsumption: 0,
    }));
  }

  async getRegionComplianceRate(batchId?: string): Promise<RegionComplianceItem[]> {
    const conditions = [];
    if (batchId) {
      conditions.push(eq(schema.auditProjects.batchId, batchId));
    }

    const projects = await this.db
      .select({
        regionCode: schema.enterprises.regionCode,
        regionName: schema.enterprises.regionName,
        status: schema.auditProjects.status,
      })
      .from(schema.auditProjects)
      .innerJoin(
        schema.enterprises,
        eq(schema.auditProjects.enterpriseId, schema.enterprises.id),
      )
      .where(
        conditions.length > 0
          ? and(
              ...conditions,
              sql`${schema.enterprises.regionCode} IS NOT NULL`,
            )
          : sql`${schema.enterprises.regionCode} IS NOT NULL`,
      );

    const regionMap = new Map<
      string,
      { name: string; total: number; completed: number }
    >();

    for (const p of projects) {
      const code = p.regionCode ?? 'unknown';
      const existing = regionMap.get(code) ?? {
        name: p.regionName ?? '未知区域',
        total: 0,
        completed: 0,
      };
      existing.total += 1;
      if (p.status === 'closed' || p.status === 'completed') {
        existing.completed += 1;
      }
      regionMap.set(code, existing);
    }

    return Array.from(regionMap.entries()).map(([regionCode, stats]) => ({
      regionCode,
      regionName: stats.name,
      totalProjects: stats.total,
      completedProjects: stats.completed,
      complianceRate: stats.total > 0 ? stats.completed / stats.total : 0,
    }));
  }
}

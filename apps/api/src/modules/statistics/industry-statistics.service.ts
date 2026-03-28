import { Inject, Injectable } from '@nestjs/common';
import { eq, sql, and } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface IndustryEnergyDistribution {
  industryCode: string;
  totalConsumption: number;
  enterpriseCount: number;
}

export interface IndustryComplianceItem {
  industryCode: string;
  totalEnterprises: number;
  compliantEnterprises: number;
  complianceRate: number;
}

export interface IndustryStatisticsQuery {
  batchId?: string;
  year?: string;
}

@Injectable()
export class IndustryStatisticsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getEnergyDistributionByIndustry(
    query: IndustryStatisticsQuery,
  ): Promise<IndustryEnergyDistribution[]> {
    const conditions = [];
    if (query.batchId) {
      conditions.push(eq(schema.auditProjects.batchId, query.batchId));
    }
    if (query.year) {
      conditions.push(eq(schema.auditBatches.year, Number(query.year)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await this.db
      .select({
        industryCode: schema.enterprises.industryCode,
        enterpriseCount: sql<number>`count(distinct ${schema.enterprises.id})`.as('enterprise_count'),
      })
      .from(schema.enterprises)
      .innerJoin(
        schema.auditProjects,
        eq(schema.enterprises.id, schema.auditProjects.enterpriseId),
      )
      .innerJoin(
        schema.auditBatches,
        eq(schema.auditProjects.batchId, schema.auditBatches.id),
      )
      .where(whereClause)
      .groupBy(schema.enterprises.industryCode);

    return results.map((r) => ({
      industryCode: r.industryCode ?? 'unknown',
      totalConsumption: 0,
      enterpriseCount: Number(r.enterpriseCount),
    }));
  }

  async getIndustryComplianceRate(
    query: IndustryStatisticsQuery,
  ): Promise<IndustryComplianceItem[]> {
    const conditions = [];
    if (query.batchId) {
      conditions.push(eq(schema.auditProjects.batchId, query.batchId));
    }
    if (query.year) {
      conditions.push(eq(schema.auditBatches.year, Number(query.year)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const projects = await this.db
      .select({
        industryCode: schema.enterprises.industryCode,
        status: schema.auditProjects.status,
      })
      .from(schema.auditProjects)
      .innerJoin(
        schema.enterprises,
        eq(schema.auditProjects.enterpriseId, schema.enterprises.id),
      )
      .innerJoin(
        schema.auditBatches,
        eq(schema.auditProjects.batchId, schema.auditBatches.id),
      )
      .where(whereClause);

    const industryMap = new Map<
      string,
      { total: number; compliant: number }
    >();
    for (const p of projects) {
      const code = p.industryCode ?? 'unknown';
      const existing = industryMap.get(code) ?? { total: 0, compliant: 0 };
      existing.total += 1;
      if (p.status === 'closed' || p.status === 'completed') {
        existing.compliant += 1;
      }
      industryMap.set(code, existing);
    }

    return Array.from(industryMap.entries()).map(([industryCode, stats]) => ({
      industryCode,
      totalEnterprises: stats.total,
      compliantEnterprises: stats.compliant,
      complianceRate: stats.total > 0 ? stats.compliant / stats.total : 0,
    }));
  }

  async getIndustryEnergyIntensityRanking(
    query: IndustryStatisticsQuery,
  ) {
    const conditions = [];
    if (query.batchId) {
      conditions.push(eq(schema.auditProjects.batchId, query.batchId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await this.db
      .select({
        industryCode: schema.enterprises.industryCode,
        enterpriseCount: sql<number>`count(distinct ${schema.enterprises.id})`.as('enterprise_count'),
      })
      .from(schema.enterprises)
      .innerJoin(
        schema.auditProjects,
        eq(schema.enterprises.id, schema.auditProjects.enterpriseId),
      )
      .where(whereClause)
      .groupBy(schema.enterprises.industryCode)
      .orderBy(sql`count(distinct ${schema.enterprises.id}) desc`);

    return results.map((r, index) => ({
      rank: index + 1,
      industryCode: r.industryCode ?? 'unknown',
      enterpriseCount: Number(r.enterpriseCount),
    }));
  }
}

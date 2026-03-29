import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CreateBenchmarkDto {
  industryCode: string;
  indicatorCode: string;
  indicatorName: string;
  benchmarkValue: string;
  unit?: string;
  source?: string;
  applicableYear?: number;
}

export interface UpdateBenchmarkDto {
  indicatorName?: string;
  benchmarkValue?: string;
  unit?: string;
  source?: string;
  applicableYear?: number;
}

export interface BenchmarkListQuery {
  industryCode?: string;
  indicatorCode?: string;
  applicableYear?: number;
}

export interface BenchmarkComparisonItem {
  indicatorName: string;
  actualValue: number;
  benchmarkValue: number;
  unit: string;
  gapPercent: number;
  status: 'above' | 'below' | 'equal';
}

@Injectable()
export class BenchmarkService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(dto: CreateBenchmarkDto) {
    const id = `bv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const [result] = await this.db
      .insert(schema.benchmarkValues)
      .values({
        id,
        industryCode: dto.industryCode,
        indicatorCode: dto.indicatorCode,
        indicatorName: dto.indicatorName,
        benchmarkValue: dto.benchmarkValue,
        unit: dto.unit ?? null,
        source: dto.source ?? null,
        applicableYear: dto.applicableYear ?? null,
      })
      .returning();

    return result;
  }

  async update(id: string, dto: UpdateBenchmarkDto) {
    const [existing] = await this.db
      .select()
      .from(schema.benchmarkValues)
      .where(eq(schema.benchmarkValues.id, id))
      .limit(1);

    if (!existing) {
      throw new HttpException('对标值不存在', HttpStatus.NOT_FOUND);
    }

    const updateData: Record<string, unknown> = {};
    if (dto.indicatorName !== undefined) updateData.indicatorName = dto.indicatorName;
    if (dto.benchmarkValue !== undefined) updateData.benchmarkValue = dto.benchmarkValue;
    if (dto.unit !== undefined) updateData.unit = dto.unit;
    if (dto.source !== undefined) updateData.source = dto.source;
    if (dto.applicableYear !== undefined) updateData.applicableYear = dto.applicableYear;

    const [result] = await this.db
      .update(schema.benchmarkValues)
      .set(updateData)
      .where(eq(schema.benchmarkValues.id, id))
      .returning();

    return result;
  }

  async delete(id: string) {
    const [existing] = await this.db
      .select()
      .from(schema.benchmarkValues)
      .where(eq(schema.benchmarkValues.id, id))
      .limit(1);

    if (!existing) {
      throw new HttpException('对标值不存在', HttpStatus.NOT_FOUND);
    }

    await this.db
      .delete(schema.benchmarkValues)
      .where(eq(schema.benchmarkValues.id, id));

    return { success: true };
  }

  async findAll(query: BenchmarkListQuery) {
    const conditions = [];
    if (query.industryCode) {
      conditions.push(eq(schema.benchmarkValues.industryCode, query.industryCode));
    }
    if (query.indicatorCode) {
      conditions.push(eq(schema.benchmarkValues.indicatorCode, query.indicatorCode));
    }
    if (query.applicableYear) {
      conditions.push(eq(schema.benchmarkValues.applicableYear, query.applicableYear));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select()
      .from(schema.benchmarkValues)
      .where(whereClause)
      .orderBy(schema.benchmarkValues.industryCode, schema.benchmarkValues.indicatorCode);
  }

  async findByIndustry(industryCode: string, applicableYear?: number) {
    const conditions = [eq(schema.benchmarkValues.industryCode, industryCode)];
    if (applicableYear) {
      conditions.push(eq(schema.benchmarkValues.applicableYear, applicableYear));
    }

    return this.db
      .select()
      .from(schema.benchmarkValues)
      .where(and(...conditions))
      .orderBy(schema.benchmarkValues.indicatorCode);
  }

  async compareEnterprise(
    enterpriseId: string,
    auditProjectId: string,
  ): Promise<BenchmarkComparisonItem[]> {
    // Get enterprise info
    const [enterprise] = await this.db
      .select()
      .from(schema.enterprises)
      .where(eq(schema.enterprises.id, enterpriseId))
      .limit(1);

    if (!enterprise) {
      throw new HttpException('企业不存在', HttpStatus.NOT_FOUND);
    }

    if (!enterprise.industryCode) {
      return [];
    }

    // Get benchmarks for the enterprise's industry
    const benchmarks = await this.db
      .select()
      .from(schema.benchmarkValues)
      .where(eq(schema.benchmarkValues.industryCode, enterprise.industryCode));

    if (benchmarks.length === 0) {
      return [];
    }

    // Get latest calculation snapshot
    const [latestSnapshot] = await this.db
      .select()
      .from(schema.calculationSnapshots)
      .where(
        and(
          eq(schema.calculationSnapshots.auditProjectId, auditProjectId),
          eq(schema.calculationSnapshots.isLatest, true),
        ),
      )
      .limit(1);

    const snapshotResult = latestSnapshot
      ? (JSON.parse(latestSnapshot.result) as Record<string, unknown>)
      : null;

    return benchmarks.map((b) => {
      let actualValue = 0;

      if (snapshotResult) {
        if (b.indicatorCode === 'comprehensive_energy_intensity') {
          const intensity = snapshotResult['energyIntensity'] as
            | { intensityPerOutput?: number }
            | undefined;
          actualValue = intensity?.intensityPerOutput ?? 0;
        } else if (b.indicatorCode === 'product_unit_energy') {
          const products = snapshotResult['productEnergy'] as
            | Array<{ unitEnergy?: number }>
            | undefined;
          actualValue =
            products && products.length > 0
              ? products.reduce((sum, p) => sum + (p.unitEnergy ?? 0), 0) / products.length
              : 0;
        } else if (b.indicatorCode === 'equipment_efficiency') {
          actualValue = 0;
        } else if (b.indicatorCode === 'total_carbon_emission') {
          const carbon = snapshotResult['carbonEmission'] as
            | { totalEmission?: number }
            | undefined;
          actualValue = carbon?.totalEmission ?? 0;
        }
      }

      const benchmarkVal = Number(b.benchmarkValue);
      const gapPercent =
        benchmarkVal !== 0
          ? ((actualValue - benchmarkVal) / benchmarkVal) * 100
          : 0;

      let status: 'above' | 'below' | 'equal' = 'equal';
      if (actualValue > benchmarkVal) status = 'above';
      else if (actualValue < benchmarkVal) status = 'below';

      return {
        indicatorName: b.indicatorName,
        actualValue,
        benchmarkValue: benchmarkVal,
        unit: b.unit ?? '',
        gapPercent: Math.round(gapPercent * 100) / 100,
        status,
      };
    });
  }
}

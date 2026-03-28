import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CreateCarbonEmissionFactorDto {
  energyCode: string;
  name: string;
  emissionFactor: string;
  oxidationRate?: string;
  standardSource?: string;
  applicableYear?: number;
  measurementUnit: string;
  isDefault?: boolean;
}

export interface UpdateCarbonEmissionFactorDto {
  name?: string;
  emissionFactor?: string;
  oxidationRate?: string;
  standardSource?: string;
  applicableYear?: number;
  measurementUnit?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

@Injectable()
export class CarbonEmissionFactorService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async findAll(year?: number) {
    if (year !== undefined) {
      return this.db
        .select()
        .from(schema.carbonEmissionFactors)
        .where(eq(schema.carbonEmissionFactors.applicableYear, year))
        .orderBy(schema.carbonEmissionFactors.energyCode);
    }

    return this.db
      .select()
      .from(schema.carbonEmissionFactors)
      .orderBy(schema.carbonEmissionFactors.energyCode);
  }

  async create(dto: CreateCarbonEmissionFactorDto) {
    this.validateFactor(dto.emissionFactor);
    if (dto.oxidationRate) {
      this.validateOxidationRate(dto.oxidationRate);
    }

    const id = `cef-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const [result] = await this.db
      .insert(schema.carbonEmissionFactors)
      .values({
        id,
        energyCode: dto.energyCode,
        name: dto.name,
        emissionFactor: dto.emissionFactor,
        oxidationRate: dto.oxidationRate ?? '1.0',
        standardSource: dto.standardSource ?? null,
        applicableYear: dto.applicableYear ?? null,
        measurementUnit: dto.measurementUnit,
        isDefault: dto.isDefault ?? false,
      })
      .returning();

    return result;
  }

  async update(id: string, dto: UpdateCarbonEmissionFactorDto) {
    if (dto.emissionFactor !== undefined) {
      this.validateFactor(dto.emissionFactor);
    }
    if (dto.oxidationRate !== undefined) {
      this.validateOxidationRate(dto.oxidationRate);
    }

    const existing = await this.db
      .select()
      .from(schema.carbonEmissionFactors)
      .where(eq(schema.carbonEmissionFactors.id, id));

    if (existing.length === 0) {
      throw new HttpException('碳排放因子不存在', HttpStatus.NOT_FOUND);
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.emissionFactor !== undefined) updateData.emissionFactor = dto.emissionFactor;
    if (dto.oxidationRate !== undefined) updateData.oxidationRate = dto.oxidationRate;
    if (dto.standardSource !== undefined) updateData.standardSource = dto.standardSource;
    if (dto.applicableYear !== undefined) updateData.applicableYear = dto.applicableYear;
    if (dto.measurementUnit !== undefined) updateData.measurementUnit = dto.measurementUnit;
    if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    updateData.updatedAt = new Date();

    const [result] = await this.db
      .update(schema.carbonEmissionFactors)
      .set(updateData)
      .where(eq(schema.carbonEmissionFactors.id, id))
      .returning();

    return result;
  }

  async findDefaults(year?: number) {
    const conditions = [eq(schema.carbonEmissionFactors.isDefault, true)];
    if (year !== undefined) {
      conditions.push(eq(schema.carbonEmissionFactors.applicableYear, year));
    }

    return this.db
      .select()
      .from(schema.carbonEmissionFactors)
      .where(and(...conditions))
      .orderBy(schema.carbonEmissionFactors.energyCode);
  }

  async findByEnergyCode(energyCode: string, year?: number) {
    const conditions = [eq(schema.carbonEmissionFactors.energyCode, energyCode)];
    if (year !== undefined) {
      conditions.push(eq(schema.carbonEmissionFactors.applicableYear, year));
    }

    return this.db
      .select()
      .from(schema.carbonEmissionFactors)
      .where(and(...conditions))
      .orderBy(schema.carbonEmissionFactors.applicableYear);
  }

  private validateFactor(factor: string) {
    const num = parseFloat(factor);
    if (isNaN(num) || num <= 0) {
      throw new HttpException(
        '排放因子必须为正数',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateOxidationRate(rate: string) {
    const num = parseFloat(rate);
    if (isNaN(num) || num < 0 || num > 1) {
      throw new HttpException(
        '氧化率必须在0到1之间',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

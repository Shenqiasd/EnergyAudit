import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CreateEnergyDefinitionDto {
  energyCode: string;
  name: string;
  energyType: string;
  conversionFactor: string;
  measurementUnit: string;
  sortOrder?: number;
}

export interface UpdateEnergyDefinitionDto {
  name?: string;
  energyType?: string;
  conversionFactor?: string;
  measurementUnit?: string;
  isActive?: boolean;
  sortOrder?: number;
}

@Injectable()
export class EnergyDefinitionService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async findByEnterprise(enterpriseId: string) {
    return this.db
      .select()
      .from(schema.energyDefinitions)
      .where(eq(schema.energyDefinitions.enterpriseId, enterpriseId))
      .orderBy(schema.energyDefinitions.sortOrder);
  }

  async create(enterpriseId: string, dto: CreateEnergyDefinitionDto) {
    this.validateConversionFactor(dto.conversionFactor);

    const existing = await this.db
      .select()
      .from(schema.energyDefinitions)
      .where(
        and(
          eq(schema.energyDefinitions.enterpriseId, enterpriseId),
          eq(schema.energyDefinitions.energyCode, dto.energyCode),
        ),
      );

    if (existing.length > 0) {
      throw new HttpException(
        `能源编码 "${dto.energyCode}" 已存在`,
        HttpStatus.CONFLICT,
      );
    }

    const id = `edef-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const [result] = await this.db
      .insert(schema.energyDefinitions)
      .values({
        id,
        enterpriseId,
        energyCode: dto.energyCode,
        name: dto.name,
        energyType: dto.energyType,
        conversionFactor: dto.conversionFactor,
        measurementUnit: dto.measurementUnit,
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning();

    return result;
  }

  async update(enterpriseId: string, id: string, dto: UpdateEnergyDefinitionDto) {
    if (dto.conversionFactor !== undefined) {
      this.validateConversionFactor(dto.conversionFactor);
    }

    const existing = await this.db
      .select()
      .from(schema.energyDefinitions)
      .where(
        and(
          eq(schema.energyDefinitions.id, id),
          eq(schema.energyDefinitions.enterpriseId, enterpriseId),
        ),
      );

    if (existing.length === 0) {
      throw new HttpException('能源定义不存在', HttpStatus.NOT_FOUND);
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.energyType !== undefined) updateData.energyType = dto.energyType;
    if (dto.conversionFactor !== undefined) updateData.conversionFactor = dto.conversionFactor;
    if (dto.measurementUnit !== undefined) updateData.measurementUnit = dto.measurementUnit;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    const [result] = await this.db
      .update(schema.energyDefinitions)
      .set(updateData)
      .where(eq(schema.energyDefinitions.id, id))
      .returning();

    return result;
  }

  async delete(enterpriseId: string, id: string) {
    const existing = await this.db
      .select()
      .from(schema.energyDefinitions)
      .where(
        and(
          eq(schema.energyDefinitions.id, id),
          eq(schema.energyDefinitions.enterpriseId, enterpriseId),
        ),
      );

    if (existing.length === 0) {
      throw new HttpException('能源定义不存在', HttpStatus.NOT_FOUND);
    }

    await this.db
      .delete(schema.energyDefinitions)
      .where(eq(schema.energyDefinitions.id, id));

    return { success: true };
  }

  async countByEnterprise(enterpriseId: string): Promise<number> {
    const items = await this.db
      .select()
      .from(schema.energyDefinitions)
      .where(
        and(
          eq(schema.energyDefinitions.enterpriseId, enterpriseId),
          eq(schema.energyDefinitions.isActive, true),
        ),
      );
    return items.length;
  }

  private validateConversionFactor(factor: string) {
    const num = parseFloat(factor);
    if (isNaN(num) || num <= 0) {
      throw new HttpException(
        '折标系数必须为正数',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

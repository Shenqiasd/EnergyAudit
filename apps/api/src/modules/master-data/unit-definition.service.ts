import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CreateUnitDefinitionDto {
  unitCode: string;
  name: string;
  unitType: string;
  energyBoundaryDescription?: string;
  associatedEnergyCodes?: string;
  sortOrder?: number;
}

export interface UpdateUnitDefinitionDto {
  name?: string;
  unitType?: string;
  energyBoundaryDescription?: string;
  associatedEnergyCodes?: string;
  isActive?: boolean;
  sortOrder?: number;
}

@Injectable()
export class UnitDefinitionService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async findByEnterprise(enterpriseId: string) {
    return this.db
      .select()
      .from(schema.unitDefinitions)
      .where(eq(schema.unitDefinitions.enterpriseId, enterpriseId))
      .orderBy(schema.unitDefinitions.sortOrder);
  }

  async create(enterpriseId: string, dto: CreateUnitDefinitionDto) {
    const existing = await this.db
      .select()
      .from(schema.unitDefinitions)
      .where(
        and(
          eq(schema.unitDefinitions.enterpriseId, enterpriseId),
          eq(schema.unitDefinitions.unitCode, dto.unitCode),
        ),
      );

    if (existing.length > 0) {
      throw new HttpException(
        `单元编码 "${dto.unitCode}" 已存在`,
        HttpStatus.CONFLICT,
      );
    }

    const id = `udef-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const [result] = await this.db
      .insert(schema.unitDefinitions)
      .values({
        id,
        enterpriseId,
        unitCode: dto.unitCode,
        name: dto.name,
        unitType: dto.unitType,
        energyBoundaryDescription: dto.energyBoundaryDescription ?? null,
        associatedEnergyCodes: dto.associatedEnergyCodes ?? null,
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning();

    return result;
  }

  async update(enterpriseId: string, id: string, dto: UpdateUnitDefinitionDto) {
    const existing = await this.db
      .select()
      .from(schema.unitDefinitions)
      .where(
        and(
          eq(schema.unitDefinitions.id, id),
          eq(schema.unitDefinitions.enterpriseId, enterpriseId),
        ),
      );

    if (existing.length === 0) {
      throw new HttpException('单元定义不存在', HttpStatus.NOT_FOUND);
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.unitType !== undefined) updateData.unitType = dto.unitType;
    if (dto.energyBoundaryDescription !== undefined) updateData.energyBoundaryDescription = dto.energyBoundaryDescription;
    if (dto.associatedEnergyCodes !== undefined) updateData.associatedEnergyCodes = dto.associatedEnergyCodes;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    const [result] = await this.db
      .update(schema.unitDefinitions)
      .set(updateData)
      .where(eq(schema.unitDefinitions.id, id))
      .returning();

    return result;
  }

  async delete(enterpriseId: string, id: string) {
    const existing = await this.db
      .select()
      .from(schema.unitDefinitions)
      .where(
        and(
          eq(schema.unitDefinitions.id, id),
          eq(schema.unitDefinitions.enterpriseId, enterpriseId),
        ),
      );

    if (existing.length === 0) {
      throw new HttpException('单元定义不存在', HttpStatus.NOT_FOUND);
    }

    await this.db
      .delete(schema.unitDefinitions)
      .where(eq(schema.unitDefinitions.id, id));

    return { success: true };
  }

  async countByEnterprise(enterpriseId: string): Promise<number> {
    const items = await this.db
      .select()
      .from(schema.unitDefinitions)
      .where(
        and(
          eq(schema.unitDefinitions.enterpriseId, enterpriseId),
          eq(schema.unitDefinitions.isActive, true),
        ),
      );
    return items.length;
  }
}

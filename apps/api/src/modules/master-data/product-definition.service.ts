import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CreateProductDefinitionDto {
  productCode: string;
  name: string;
  measurementUnit: string;
  unitDefinitionId?: string;
  processDescription?: string;
  sortOrder?: number;
}

export interface UpdateProductDefinitionDto {
  name?: string;
  measurementUnit?: string;
  unitDefinitionId?: string;
  processDescription?: string;
  isActive?: boolean;
  sortOrder?: number;
}

@Injectable()
export class ProductDefinitionService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async findByEnterprise(enterpriseId: string) {
    return this.db
      .select()
      .from(schema.productDefinitions)
      .where(eq(schema.productDefinitions.enterpriseId, enterpriseId))
      .orderBy(schema.productDefinitions.sortOrder);
  }

  async create(enterpriseId: string, dto: CreateProductDefinitionDto) {
    const existing = await this.db
      .select()
      .from(schema.productDefinitions)
      .where(
        and(
          eq(schema.productDefinitions.enterpriseId, enterpriseId),
          eq(schema.productDefinitions.productCode, dto.productCode),
        ),
      );

    if (existing.length > 0) {
      throw new HttpException(
        `产品编码 "${dto.productCode}" 已存在`,
        HttpStatus.CONFLICT,
      );
    }

    if (dto.unitDefinitionId) {
      await this.validateUnitExists(enterpriseId, dto.unitDefinitionId);
    }

    const id = `pdef-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const [result] = await this.db
      .insert(schema.productDefinitions)
      .values({
        id,
        enterpriseId,
        productCode: dto.productCode,
        name: dto.name,
        measurementUnit: dto.measurementUnit,
        unitDefinitionId: dto.unitDefinitionId ?? null,
        processDescription: dto.processDescription ?? null,
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning();

    return result;
  }

  async update(enterpriseId: string, id: string, dto: UpdateProductDefinitionDto) {
    const existing = await this.db
      .select()
      .from(schema.productDefinitions)
      .where(
        and(
          eq(schema.productDefinitions.id, id),
          eq(schema.productDefinitions.enterpriseId, enterpriseId),
        ),
      );

    if (existing.length === 0) {
      throw new HttpException('产品定义不存在', HttpStatus.NOT_FOUND);
    }

    if (dto.unitDefinitionId) {
      await this.validateUnitExists(enterpriseId, dto.unitDefinitionId);
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.measurementUnit !== undefined) updateData.measurementUnit = dto.measurementUnit;
    if (dto.unitDefinitionId !== undefined) updateData.unitDefinitionId = dto.unitDefinitionId;
    if (dto.processDescription !== undefined) updateData.processDescription = dto.processDescription;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    const [result] = await this.db
      .update(schema.productDefinitions)
      .set(updateData)
      .where(eq(schema.productDefinitions.id, id))
      .returning();

    return result;
  }

  async delete(enterpriseId: string, id: string) {
    const existing = await this.db
      .select()
      .from(schema.productDefinitions)
      .where(
        and(
          eq(schema.productDefinitions.id, id),
          eq(schema.productDefinitions.enterpriseId, enterpriseId),
        ),
      );

    if (existing.length === 0) {
      throw new HttpException('产品定义不存在', HttpStatus.NOT_FOUND);
    }

    await this.db
      .delete(schema.productDefinitions)
      .where(eq(schema.productDefinitions.id, id));

    return { success: true };
  }

  async countByEnterprise(enterpriseId: string): Promise<number> {
    const items = await this.db
      .select()
      .from(schema.productDefinitions)
      .where(
        and(
          eq(schema.productDefinitions.enterpriseId, enterpriseId),
          eq(schema.productDefinitions.isActive, true),
        ),
      );
    return items.length;
  }

  private async validateUnitExists(enterpriseId: string, unitDefinitionId: string) {
    const unit = await this.db
      .select()
      .from(schema.unitDefinitions)
      .where(
        and(
          eq(schema.unitDefinitions.id, unitDefinitionId),
          eq(schema.unitDefinitions.enterpriseId, enterpriseId),
        ),
      );

    if (unit.length === 0) {
      throw new HttpException(
        '关联的单元定义不存在',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

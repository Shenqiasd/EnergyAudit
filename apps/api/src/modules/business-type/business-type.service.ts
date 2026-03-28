import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CreateBusinessTypeDto {
  businessType: string;
  label: string;
  description?: string;
  defaultTemplateId?: string;
  reportTemplateId?: string;
}

export interface UpdateBusinessTypeDto {
  label?: string;
  description?: string;
  defaultTemplateId?: string;
  reportTemplateId?: string;
  isActive?: boolean;
}

export interface ModuleVisibilityDto {
  moduleCode: string;
  isVisible: boolean;
  isRequired: boolean;
  sortOrder: number;
}

@Injectable()
export class BusinessTypeService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getBusinessTypes() {
    return this.db
      .select()
      .from(schema.businessTypeConfig)
      .orderBy(schema.businessTypeConfig.createdAt);
  }

  async getBusinessType(type: string) {
    const [config] = await this.db
      .select()
      .from(schema.businessTypeConfig)
      .where(eq(schema.businessTypeConfig.businessType, type))
      .limit(1);

    if (!config) {
      throw new HttpException('业务类型不存在', HttpStatus.NOT_FOUND);
    }

    return config;
  }

  async createBusinessType(dto: CreateBusinessTypeDto) {
    const id = `bt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const [existing] = await this.db
      .select()
      .from(schema.businessTypeConfig)
      .where(eq(schema.businessTypeConfig.businessType, dto.businessType))
      .limit(1);

    if (existing) {
      throw new HttpException('业务类型已存在', HttpStatus.CONFLICT);
    }

    const [config] = await this.db
      .insert(schema.businessTypeConfig)
      .values({
        id,
        businessType: dto.businessType,
        label: dto.label,
        description: dto.description ?? null,
        defaultTemplateId: dto.defaultTemplateId ?? null,
        reportTemplateId: dto.reportTemplateId ?? null,
      })
      .returning();

    return config;
  }

  async updateBusinessType(type: string, dto: UpdateBusinessTypeDto) {
    const [existing] = await this.db
      .select()
      .from(schema.businessTypeConfig)
      .where(eq(schema.businessTypeConfig.businessType, type))
      .limit(1);

    if (!existing) {
      throw new HttpException('业务类型不存在', HttpStatus.NOT_FOUND);
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.label !== undefined) updateData.label = dto.label;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.defaultTemplateId !== undefined) updateData.defaultTemplateId = dto.defaultTemplateId;
    if (dto.reportTemplateId !== undefined) updateData.reportTemplateId = dto.reportTemplateId;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const [updated] = await this.db
      .update(schema.businessTypeConfig)
      .set(updateData)
      .where(eq(schema.businessTypeConfig.businessType, type))
      .returning();

    return updated;
  }

  async getModuleVisibility(businessType: string) {
    return this.db
      .select()
      .from(schema.moduleVisibility)
      .where(eq(schema.moduleVisibility.businessType, businessType))
      .orderBy(schema.moduleVisibility.sortOrder);
  }

  async setModuleVisibility(businessType: string, modules: ModuleVisibilityDto[]) {
    // Verify business type exists
    const [config] = await this.db
      .select()
      .from(schema.businessTypeConfig)
      .where(eq(schema.businessTypeConfig.businessType, businessType))
      .limit(1);

    if (!config) {
      throw new HttpException('业务类型不存在', HttpStatus.NOT_FOUND);
    }

    // Delete existing visibility records for this business type
    await this.db
      .delete(schema.moduleVisibility)
      .where(eq(schema.moduleVisibility.businessType, businessType));

    // Insert new visibility records
    if (modules.length > 0) {
      const values = modules.map((m, idx) => ({
        id: `mv_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 8)}`,
        businessType,
        moduleCode: m.moduleCode,
        isVisible: m.isVisible,
        isRequired: m.isRequired,
        sortOrder: m.sortOrder,
      }));

      await this.db.insert(schema.moduleVisibility).values(values);
    }

    return this.getModuleVisibility(businessType);
  }

  async getTemplateForBusinessType(businessType: string) {
    const [config] = await this.db
      .select()
      .from(schema.businessTypeConfig)
      .where(
        and(
          eq(schema.businessTypeConfig.businessType, businessType),
          eq(schema.businessTypeConfig.isActive, true),
        ),
      )
      .limit(1);

    if (!config) {
      return null;
    }

    return config.defaultTemplateId;
  }

  async getReportTemplateForBusinessType(businessType: string) {
    const [config] = await this.db
      .select()
      .from(schema.businessTypeConfig)
      .where(
        and(
          eq(schema.businessTypeConfig.businessType, businessType),
          eq(schema.businessTypeConfig.isActive, true),
        ),
      )
      .limit(1);

    if (!config) {
      return null;
    }

    return config.reportTemplateId;
  }
}

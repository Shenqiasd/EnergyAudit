import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, count, eq, ilike, sql } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CreateEnterpriseDto {
  name: string;
  unifiedSocialCreditCode: string;
  industryCode?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  notes?: string;
  regionCode?: string;
  regionName?: string;
  province?: string;
  city?: string;
}

export interface UpdateEnterpriseDto {
  name?: string;
  industryCode?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  notes?: string;
  regionCode?: string;
  regionName?: string;
  province?: string;
  city?: string;
}

export interface EnterpriseListQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  creditCode?: string;
  admissionStatus?: string;
  regionCode?: string;
}

@Injectable()
export class EnterpriseService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(dto: CreateEnterpriseDto) {
    const id = `ent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const existing = await this.db
      .select()
      .from(schema.enterprises)
      .where(eq(schema.enterprises.unifiedSocialCreditCode, dto.unifiedSocialCreditCode))
      .limit(1);

    if (existing.length > 0) {
      throw new HttpException('统一社会信用代码已存在', HttpStatus.CONFLICT);
    }

    const [enterprise] = await this.db
      .insert(schema.enterprises)
      .values({
        id,
        name: dto.name,
        unifiedSocialCreditCode: dto.unifiedSocialCreditCode,
        admissionStatus: 'pending_review',
        industryCode: dto.industryCode ?? null,
        contactPerson: dto.contactPerson ?? null,
        contactPhone: dto.contactPhone ?? null,
        contactEmail: dto.contactEmail ?? null,
        address: dto.address ?? null,
        notes: dto.notes ?? null,
        regionCode: dto.regionCode ?? null,
        regionName: dto.regionName ?? null,
        province: dto.province ?? null,
        city: dto.city ?? null,
      })
      .returning();

    return enterprise;
  }

  async findAll(query: EnterpriseListQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.name) {
      conditions.push(ilike(schema.enterprises.name, `%${query.name}%`));
    }
    if (query.creditCode) {
      conditions.push(
        ilike(schema.enterprises.unifiedSocialCreditCode, `%${query.creditCode}%`),
      );
    }
    if (query.admissionStatus) {
      conditions.push(eq(schema.enterprises.admissionStatus, query.admissionStatus));
    }
    if (query.regionCode) {
      conditions.push(eq(schema.enterprises.regionCode, query.regionCode));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      this.db
        .select()
        .from(schema.enterprises)
        .where(whereClause)
        .orderBy(sql`${schema.enterprises.createdAt} desc`)
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(schema.enterprises)
        .where(whereClause),
    ]);

    return {
      items,
      total: totalResult[0]?.total ?? 0,
      page,
      pageSize,
    };
  }

  async findById(id: string) {
    const [enterprise] = await this.db
      .select()
      .from(schema.enterprises)
      .where(eq(schema.enterprises.id, id))
      .limit(1);

    if (!enterprise) {
      throw new HttpException('企业不存在', HttpStatus.NOT_FOUND);
    }

    const bindings = await this.db
      .select()
      .from(schema.enterpriseExternalBindings)
      .where(eq(schema.enterpriseExternalBindings.enterpriseId, id));

    return { ...enterprise, bindings };
  }

  async update(id: string, dto: UpdateEnterpriseDto) {
    const [existing] = await this.db
      .select()
      .from(schema.enterprises)
      .where(eq(schema.enterprises.id, id))
      .limit(1);

    if (!existing) {
      throw new HttpException('企业不存在', HttpStatus.NOT_FOUND);
    }

    const [updated] = await this.db
      .update(schema.enterprises)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(schema.enterprises.id, id))
      .returning();

    return updated;
  }
}

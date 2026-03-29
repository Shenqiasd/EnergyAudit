import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export type DataRecordStatus =
  | 'draft'
  | 'saved'
  | 'validation_failed'
  | 'ready_to_submit'
  | 'submitted'
  | 'returned'
  | 'archived';

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['saved'],
  saved: ['saved', 'validation_failed', 'ready_to_submit', 'submitted'],
  validation_failed: ['saved', 'validation_failed', 'ready_to_submit'],
  ready_to_submit: ['saved', 'submitted'],
  submitted: ['returned', 'archived'],
  returned: ['saved', 'draft'],
};

export function canTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}

export interface CreateRecordDto {
  auditProjectId: string;
  moduleCode: string;
}

export interface SaveRecordDto {
  items: Array<{
    fieldCode: string;
    rawValue: string | null;
    unit?: string;
  }>;
}

export interface RecordListQuery {
  projectId?: string;
  moduleCode?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class DataRecordService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(dto: CreateRecordDto) {
    const id = `dr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const existing = await this.db
      .select()
      .from(schema.dataRecords)
      .where(
        and(
          eq(schema.dataRecords.auditProjectId, dto.auditProjectId),
          eq(schema.dataRecords.moduleCode, dto.moduleCode),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new HttpException('该模块数据记录已存在', HttpStatus.CONFLICT);
    }

    const [record] = await this.db
      .insert(schema.dataRecords)
      .values({
        id,
        auditProjectId: dto.auditProjectId,
        moduleCode: dto.moduleCode,
        status: 'draft',
      })
      .returning();

    return record;
  }

  async findAll(query: RecordListQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.projectId) {
      conditions.push(eq(schema.dataRecords.auditProjectId, query.projectId));
    }
    if (query.moduleCode) {
      conditions.push(eq(schema.dataRecords.moduleCode, query.moduleCode));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      this.db
        .select()
        .from(schema.dataRecords)
        .where(whereClause)
        .orderBy(sql`${schema.dataRecords.createdAt} desc`)
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(schema.dataRecords)
        .where(whereClause),
    ]);

    return { items, total: totalResult[0]?.total ?? 0, page, pageSize };
  }

  async findById(id: string) {
    const [record] = await this.db
      .select()
      .from(schema.dataRecords)
      .where(eq(schema.dataRecords.id, id))
      .limit(1);

    if (!record) {
      throw new HttpException('数据记录不存在', HttpStatus.NOT_FOUND);
    }

    const items = await this.db
      .select()
      .from(schema.dataItems)
      .where(eq(schema.dataItems.dataRecordId, id));

    return { ...record, items };
  }

  async save(id: string, dto: SaveRecordDto) {
    const [record] = await this.db
      .select()
      .from(schema.dataRecords)
      .where(eq(schema.dataRecords.id, id))
      .limit(1);

    if (!record) {
      throw new HttpException('数据记录不存在', HttpStatus.NOT_FOUND);
    }

    if (!canTransition(record.status, 'saved')) {
      throw new HttpException(
        `当前状态 ${record.status} 不允许保存`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Upsert data items
    for (const item of dto.items) {
      const itemId = `di_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const existing = await this.db
        .select()
        .from(schema.dataItems)
        .where(
          and(
            eq(schema.dataItems.dataRecordId, id),
            eq(schema.dataItems.fieldCode, item.fieldCode),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        await this.db
          .update(schema.dataItems)
          .set({
            rawValue: item.rawValue,
            finalValue: item.rawValue,
            unit: item.unit ?? null,
          })
          .where(eq(schema.dataItems.id, existing[0].id));
      } else {
        await this.db.insert(schema.dataItems).values({
          id: itemId,
          dataRecordId: id,
          fieldCode: item.fieldCode,
          rawValue: item.rawValue,
          finalValue: item.rawValue,
          unit: item.unit ?? null,
        });
      }
    }

    const [updated] = await this.db
      .update(schema.dataRecords)
      .set({ status: 'saved', updatedAt: new Date() })
      .where(eq(schema.dataRecords.id, id))
      .returning();

    return updated;
  }

  async submit(id: string) {
    const [record] = await this.db
      .select()
      .from(schema.dataRecords)
      .where(eq(schema.dataRecords.id, id))
      .limit(1);

    if (!record) {
      throw new HttpException('数据记录不存在', HttpStatus.NOT_FOUND);
    }

    if (!canTransition(record.status, 'submitted')) {
      throw new HttpException(
        `当前状态 ${record.status} 不允许提交`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const [updated] = await this.db
      .update(schema.dataRecords)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.dataRecords.id, id))
      .returning();

    return updated;
  }

  async returnRecord(id: string, reason: string, returnedBy?: string) {
    const [record] = await this.db
      .select()
      .from(schema.dataRecords)
      .where(eq(schema.dataRecords.id, id))
      .limit(1);

    if (!record) {
      throw new HttpException('数据记录不存在', HttpStatus.NOT_FOUND);
    }

    if (!canTransition(record.status, 'returned')) {
      throw new HttpException(
        `当前状态 ${record.status} 不允许退回`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new HttpException('退回原因不能为空', HttpStatus.BAD_REQUEST);
    }

    const [updated] = await this.db
      .update(schema.dataRecords)
      .set({
        status: 'returned',
        returnReason: reason,
        returnedBy: returnedBy ?? null,
        returnedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.dataRecords.id, id))
      .returning();

    return updated;
  }

  async updateStatus(id: string, status: DataRecordStatus) {
    const [record] = await this.db
      .select()
      .from(schema.dataRecords)
      .where(eq(schema.dataRecords.id, id))
      .limit(1);

    if (!record) {
      throw new HttpException('数据记录不存在', HttpStatus.NOT_FOUND);
    }

    if (!canTransition(record.status, status)) {
      throw new HttpException(
        `不允许从 ${record.status} 转到 ${status}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const [updated] = await this.db
      .update(schema.dataRecords)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.dataRecords.id, id))
      .returning();

    return updated;
  }
}

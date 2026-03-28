import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CreateAuditLogDto {
  userId: string;
  userRole: string;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: string;
  ipAddress?: string;
}

export interface AuditLogQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  action?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(dto: CreateAuditLogDto) {
    const id = `alog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const [log] = await this.db
      .insert(schema.auditLogs)
      .values({
        id,
        userId: dto.userId,
        userRole: dto.userRole,
        action: dto.action,
        targetType: dto.targetType ?? null,
        targetId: dto.targetId ?? null,
        detail: dto.detail ?? null,
        ipAddress: dto.ipAddress ?? null,
      })
      .returning();

    return log;
  }

  async findAll(query: AuditLogQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.userId) {
      conditions.push(eq(schema.auditLogs.userId, query.userId));
    }
    if (query.action) {
      conditions.push(eq(schema.auditLogs.action, query.action));
    }
    if (query.targetType) {
      conditions.push(eq(schema.auditLogs.targetType, query.targetType));
    }
    if (query.startDate) {
      conditions.push(gte(schema.auditLogs.createdAt, new Date(query.startDate)));
    }
    if (query.endDate) {
      conditions.push(lte(schema.auditLogs.createdAt, new Date(query.endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      this.db
        .select()
        .from(schema.auditLogs)
        .where(whereClause)
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(schema.auditLogs)
        .where(whereClause),
    ]);

    return {
      items,
      total: totalResult[0]?.total ?? 0,
      page,
      pageSize,
    };
  }

  async findByEntity(entityType: string, entityId: string, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    const whereClause = and(
      eq(schema.auditLogs.targetType, entityType),
      eq(schema.auditLogs.targetId, entityId),
    );

    const [items, totalResult] = await Promise.all([
      this.db
        .select()
        .from(schema.auditLogs)
        .where(whereClause)
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(schema.auditLogs)
        .where(whereClause),
    ]);

    return {
      items,
      total: totalResult[0]?.total ?? 0,
      page,
      pageSize,
    };
  }
}

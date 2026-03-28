import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, count, eq, ilike, sql } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CreateUserDto {
  name: string;
  email: string;
  phone?: string;
  role: string;
  enterpriseId?: string;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  email?: string;
  status?: string;
}

export interface UpdateUserRolesDto {
  role: string;
}

export interface UserListQuery {
  page?: number;
  pageSize?: number;
  role?: string;
  enterpriseId?: string;
  name?: string;
}

@Injectable()
export class UserAccountService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(dto: CreateUserDto) {
    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const existing = await this.db
      .select()
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.email, dto.email))
      .limit(1);

    if (existing.length > 0) {
      throw new HttpException('邮箱已被使用', HttpStatus.CONFLICT);
    }

    if (dto.enterpriseId) {
      const [enterprise] = await this.db
        .select()
        .from(schema.enterprises)
        .where(eq(schema.enterprises.id, dto.enterpriseId))
        .limit(1);

      if (!enterprise) {
        throw new HttpException('关联企业不存在', HttpStatus.BAD_REQUEST);
      }
    }

    const [user] = await this.db
      .insert(schema.userAccounts)
      .values({
        id,
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? null,
        role: dto.role,
        enterpriseId: dto.enterpriseId ?? null,
      })
      .returning();

    return user;
  }

  async findAll(query: UserListQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.role) {
      conditions.push(eq(schema.userAccounts.role, query.role));
    }
    if (query.enterpriseId) {
      conditions.push(eq(schema.userAccounts.enterpriseId, query.enterpriseId));
    }
    if (query.name) {
      conditions.push(ilike(schema.userAccounts.name, `%${query.name}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      this.db
        .select()
        .from(schema.userAccounts)
        .where(whereClause)
        .orderBy(sql`${schema.userAccounts.createdAt} desc`)
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(schema.userAccounts)
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
    const [user] = await this.db
      .select()
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.id, id))
      .limit(1);

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const [existing] = await this.db
      .select()
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.id, id))
      .limit(1);

    if (!existing) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    const [updated] = await this.db
      .update(schema.userAccounts)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(schema.userAccounts.id, id))
      .returning();

    return updated;
  }

  async updateRoles(id: string, dto: UpdateUserRolesDto) {
    const [existing] = await this.db
      .select()
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.id, id))
      .limit(1);

    if (!existing) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    const validRoles = ['enterprise_user', 'enterprise_admin', 'manager', 'reviewer'];
    if (!validRoles.includes(dto.role)) {
      throw new HttpException(
        `无效的角色: ${dto.role}，有效角色: ${validRoles.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const [updated] = await this.db
      .update(schema.userAccounts)
      .set({
        role: dto.role,
        updatedAt: new Date(),
      })
      .where(eq(schema.userAccounts.id, id))
      .returning();

    return updated;
  }
}

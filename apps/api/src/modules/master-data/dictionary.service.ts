import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CreateDictionaryDto {
  category: string;
  code: string;
  name: string;
  parentCode?: string;
  sortOrder?: number;
  metadata?: string;
}

export interface UpdateDictionaryDto {
  name?: string;
  parentCode?: string;
  sortOrder?: number;
  isActive?: boolean;
  metadata?: string;
}

export interface DictionaryTreeNode {
  id: string;
  category: string;
  code: string;
  name: string;
  parentCode: string | null;
  sortOrder: number;
  isActive: boolean;
  metadata: string | null;
  children: DictionaryTreeNode[];
}

@Injectable()
export class DictionaryService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async findByCategory(category: string): Promise<DictionaryTreeNode[]> {
    const items = await this.db
      .select()
      .from(schema.dictionaries)
      .where(eq(schema.dictionaries.category, category))
      .orderBy(schema.dictionaries.sortOrder);

    return this.buildTree(items);
  }

  async create(dto: CreateDictionaryDto) {
    const id = `dict-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const existing = await this.db
      .select()
      .from(schema.dictionaries)
      .where(
        and(
          eq(schema.dictionaries.category, dto.category),
          eq(schema.dictionaries.code, dto.code),
        ),
      );

    if (existing.length > 0) {
      throw new HttpException(
        `字典项编码 "${dto.code}" 在分类 "${dto.category}" 中已存在`,
        HttpStatus.CONFLICT,
      );
    }

    const [result] = await this.db
      .insert(schema.dictionaries)
      .values({
        id,
        category: dto.category,
        code: dto.code,
        name: dto.name,
        parentCode: dto.parentCode ?? null,
        sortOrder: dto.sortOrder ?? 0,
        metadata: dto.metadata ?? null,
      })
      .returning();

    return result;
  }

  async update(id: string, dto: UpdateDictionaryDto) {
    const existing = await this.db
      .select()
      .from(schema.dictionaries)
      .where(eq(schema.dictionaries.id, id));

    if (existing.length === 0) {
      throw new HttpException('字典项不存在', HttpStatus.NOT_FOUND);
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.parentCode !== undefined) updateData.parentCode = dto.parentCode;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;

    const [result] = await this.db
      .update(schema.dictionaries)
      .set(updateData)
      .where(eq(schema.dictionaries.id, id))
      .returning();

    return result;
  }

  async delete(id: string) {
    const existing = await this.db
      .select()
      .from(schema.dictionaries)
      .where(eq(schema.dictionaries.id, id));

    if (existing.length === 0) {
      throw new HttpException('字典项不存在', HttpStatus.NOT_FOUND);
    }

    await this.db
      .delete(schema.dictionaries)
      .where(eq(schema.dictionaries.id, id));

    return { success: true };
  }

  private buildTree(
    items: (typeof schema.dictionaries.$inferSelect)[],
  ): DictionaryTreeNode[] {
    const map = new Map<string, DictionaryTreeNode>();
    const roots: DictionaryTreeNode[] = [];

    for (const item of items) {
      map.set(item.code, {
        ...item,
        children: [],
      });
    }

    for (const item of items) {
      const node = map.get(item.code)!;
      if (item.parentCode && map.has(item.parentCode)) {
        map.get(item.parentCode)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}

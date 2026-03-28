import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, sql } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CreateNotificationInput {
  recipientId: string;
  type: string;
  title: string;
  content: string;
  relatedType?: string;
  relatedId?: string;
}

export interface NotificationListQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(input: CreateNotificationInput) {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await this.db.insert(schema.notifications).values({
      id,
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      content: input.content,
      relatedType: input.relatedType ?? null,
      relatedId: input.relatedId ?? null,
    });

    return { id };
  }

  async createBulk(notifications: CreateNotificationInput[]) {
    const results: { id: string }[] = [];

    for (const input of notifications) {
      const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await this.db.insert(schema.notifications).values({
        id,
        recipientId: input.recipientId,
        type: input.type,
        title: input.title,
        content: input.content,
        relatedType: input.relatedType ?? null,
        relatedId: input.relatedId ?? null,
      });

      results.push({ id });
    }

    return results;
  }

  async findByRecipient(
    recipientId: string,
    query: NotificationListQuery = {},
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [eq(schema.notifications.recipientId, recipientId)];

    if (query.isRead !== undefined) {
      conditions.push(eq(schema.notifications.isRead, query.isRead));
    }
    if (query.type) {
      conditions.push(eq(schema.notifications.type, query.type));
    }

    const whereClause = and(...conditions);

    const [items, totalResult] = await Promise.all([
      this.db
        .select()
        .from(schema.notifications)
        .where(whereClause)
        .orderBy(desc(schema.notifications.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(schema.notifications)
        .where(whereClause),
    ]);

    return {
      items,
      total: totalResult[0]?.total ?? 0,
      page,
      limit,
    };
  }

  async getUnreadCount(recipientId: string) {
    const result = await this.db
      .select({ total: count() })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.recipientId, recipientId),
          eq(schema.notifications.isRead, false),
        ),
      );

    return { count: result[0]?.total ?? 0 };
  }

  async markAsRead(notificationId: string, recipientId: string) {
    const [notification] = await this.db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.recipientId, recipientId),
        ),
      )
      .limit(1);

    if (!notification) {
      throw new Error('通知不存在');
    }

    await this.db
      .update(schema.notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(schema.notifications.id, notificationId));

    return { ...notification, isRead: true, readAt: new Date() };
  }

  async markAllAsRead(recipientId: string) {
    const result = await this.db
      .update(schema.notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(schema.notifications.recipientId, recipientId),
          eq(schema.notifications.isRead, false),
        ),
      )
      .returning();

    return { updatedCount: result.length };
  }

  async delete(notificationId: string, recipientId: string) {
    const [notification] = await this.db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.recipientId, recipientId),
        ),
      )
      .limit(1);

    if (!notification) {
      throw new Error('通知不存在');
    }

    await this.db
      .delete(schema.notifications)
      .where(eq(schema.notifications.id, notificationId));

    return { deleted: true };
  }
}

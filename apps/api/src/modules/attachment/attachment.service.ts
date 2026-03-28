import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { IStorageAdapter } from '@energy-audit/integrations';
import { STORAGE_ADAPTER } from '@energy-audit/integrations';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface UploadAttachmentDto {
  ownerType: string;
  ownerId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  data: Buffer;
}

@Injectable()
export class AttachmentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    @Inject(STORAGE_ADAPTER) private readonly storageAdapter: IStorageAdapter,
  ) {}

  private sanitizePathSegment(segment: string): string {
    return segment.replace(/[\/\\]/g, '_').replace(/\.\./g, '_');
  }

  async upload(dto: UploadAttachmentDto) {
    const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const storageKey = `${this.sanitizePathSegment(dto.ownerType)}/${this.sanitizePathSegment(dto.ownerId)}/${id}_${this.sanitizePathSegment(dto.fileName)}`;

    const url = await this.storageAdapter.upload(storageKey, dto.data, dto.mimeType);

    const [attachment] = await this.db
      .insert(schema.attachments)
      .values({
        id,
        ownerType: dto.ownerType,
        ownerId: dto.ownerId,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        storagePath: storageKey,
        uploadedBy: dto.uploadedBy,
      })
      .returning();

    return { ...attachment, url };
  }

  async download(id: string) {
    const [attachment] = await this.db
      .select()
      .from(schema.attachments)
      .where(eq(schema.attachments.id, id))
      .limit(1);

    if (!attachment) {
      throw new HttpException('附件不存在', HttpStatus.NOT_FOUND);
    }

    const data = await this.storageAdapter.download(attachment.storagePath);
    return { attachment, data };
  }

  async listByEntity(entityType: string, entityId: string, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    const whereClause = and(
      eq(schema.attachments.ownerType, entityType),
      eq(schema.attachments.ownerId, entityId),
    );

    const [items, totalResult] = await Promise.all([
      this.db
        .select()
        .from(schema.attachments)
        .where(whereClause)
        .orderBy(desc(schema.attachments.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(schema.attachments)
        .where(whereClause),
    ]);

    return {
      items,
      total: totalResult[0]?.total ?? 0,
      page,
      pageSize,
    };
  }

  async delete(id: string) {
    const [attachment] = await this.db
      .select()
      .from(schema.attachments)
      .where(eq(schema.attachments.id, id))
      .limit(1);

    if (!attachment) {
      throw new HttpException('附件不存在', HttpStatus.NOT_FOUND);
    }

    await this.storageAdapter.delete(attachment.storagePath);

    await this.db
      .delete(schema.attachments)
      .where(eq(schema.attachments.id, id));

    return { deleted: true };
  }
}

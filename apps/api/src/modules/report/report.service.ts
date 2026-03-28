import { Inject, Injectable } from '@nestjs/common';
import { and, eq, desc, isNull } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';
import { NotificationTriggerService } from '../notification/notification-trigger.service';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export type ReportStatus =
  | 'not_generated'
  | 'system_draft'
  | 'enterprise_revision'
  | 'pending_final'
  | 'final_uploaded'
  | 'under_review'
  | 'archived'
  | 'voided';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  not_generated: ['system_draft'],
  system_draft: ['enterprise_revision', 'voided'],
  enterprise_revision: ['pending_final', 'voided'],
  pending_final: ['final_uploaded', 'enterprise_revision', 'voided'],
  final_uploaded: ['under_review', 'voided'],
  under_review: ['archived', 'enterprise_revision', 'voided'],
  archived: ['voided'],
};

export function canTransitionReport(from: string, to: string): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}

export interface ReportListQuery {
  projectId?: string;
  status?: string;
  page?: string;
  pageSize?: string;
}

@Injectable()
export class ReportService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly notificationTrigger: NotificationTriggerService,
  ) {}

  async findAll(query: ReportListQuery) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    let whereClause = undefined;
    if (query.projectId) {
      whereClause = eq(schema.reports.auditProjectId, query.projectId);
    }

    const items = await this.db
      .select()
      .from(schema.reports)
      .where(whereClause)
      .orderBy(desc(schema.reports.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { items, page, pageSize };
  }

  async findById(id: string) {
    const [report] = await this.db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, id))
      .limit(1);

    if (!report) {
      throw new Error('报告不存在');
    }

    const sections = await this.db
      .select()
      .from(schema.reportSections)
      .where(and(eq(schema.reportSections.reportId, id), isNull(schema.reportSections.reportVersionId)))
      .orderBy(schema.reportSections.sortOrder);

    return { ...report, sections };
  }

  async transitionStatus(id: string, newStatus: string) {
    const [report] = await this.db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, id))
      .limit(1);

    if (!report) {
      throw new Error('报告不存在');
    }

    if (!canTransitionReport(report.status, newStatus)) {
      throw new Error(`无法从 ${report.status} 转换到 ${newStatus}`);
    }

    const updates: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === 'archived') {
      updates['archivedAt'] = new Date();
    }

    await this.db
      .update(schema.reports)
      .set(updates)
      .where(eq(schema.reports.id, id));

    try {
      await this.notificationTrigger.onReportStatusChange(id, newStatus);
    } catch {
      // Non-critical
    }

    return { ...report, status: newStatus };
  }

  async getVersions(reportId: string) {
    return this.db
      .select()
      .from(schema.reportVersions)
      .where(eq(schema.reportVersions.reportId, reportId))
      .orderBy(desc(schema.reportVersions.createdAt));
  }

  async createVersion(
    reportId: string,
    versionType: string,
    fileUrl?: string,
    createdBy?: string,
  ) {
    const existingVersions = await this.db
      .select()
      .from(schema.reportVersions)
      .where(
        and(
          eq(schema.reportVersions.reportId, reportId),
          eq(schema.reportVersions.versionType, versionType),
        ),
      );

    const versionNumber = existingVersions.length + 1;
    const versionId = `rv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await this.db.insert(schema.reportVersions).values({
      id: versionId,
      reportId,
      versionType,
      versionNumber,
      fileUrl: fileUrl ?? null,
      createdBy: createdBy ?? null,
    });

    return { id: versionId, versionType, versionNumber };
  }
}

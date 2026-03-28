import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

interface SectionSnapshot {
  sectionCode: string;
  sectionName: string;
  sortOrder: number;
  content: string | null;
  charts: unknown;
}

interface VersionDiff {
  sectionCode: string;
  sectionName: string;
  v1Content: string | null;
  v2Content: string | null;
  changed: boolean;
}

@Injectable()
export class ReportVersionService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async createVersion(
    reportId: string,
    versionType: string,
    fileUrl?: string,
    createdBy?: string,
  ) {
    const [report] = await this.db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, reportId))
      .limit(1);

    if (!report) {
      throw new HttpException('报告不存在', HttpStatus.NOT_FOUND);
    }

    const versionId = `rv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await this.db.transaction(async (tx) => {
      // Get next version number inside transaction
      const existingVersions = await tx
        .select()
        .from(schema.reportVersions)
        .where(eq(schema.reportVersions.reportId, reportId));

      const versionNumber = existingVersions.length + 1;

      // Deactivate all existing versions
      await tx
        .update(schema.reportVersions)
        .set({ isActive: false })
        .where(eq(schema.reportVersions.reportId, reportId));

      // Create the new version
      await tx.insert(schema.reportVersions).values({
        id: versionId,
        reportId,
        versionType,
        versionNumber,
        isActive: true,
        fileUrl: fileUrl ?? null,
        createdBy: createdBy ?? null,
      });

      // Snapshot current report sections into this version
      const currentSections = await tx
        .select()
        .from(schema.reportSections)
        .where(
          and(
            eq(schema.reportSections.reportId, reportId),
            isNull(schema.reportSections.reportVersionId),
          ),
        )
        .orderBy(schema.reportSections.sortOrder);

      for (const section of currentSections) {
        const snapshotId = `rs_snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${section.sortOrder}`;
        await tx.insert(schema.reportSections).values({
          id: snapshotId,
          reportId,
          reportVersionId: versionId,
          sectionCode: section.sectionCode,
          sectionName: section.sectionName,
          sortOrder: section.sortOrder,
          content: section.content,
          charts: section.charts,
        });
      }
    });

    return { id: versionId, versionType, versionNumber, isActive: true };
  }

  async listVersions(reportId: string) {
    return this.db
      .select()
      .from(schema.reportVersions)
      .where(eq(schema.reportVersions.reportId, reportId))
      .orderBy(desc(schema.reportVersions.versionNumber));
  }

  async getVersion(versionId: string, reportId?: string) {
    const conditions = [eq(schema.reportVersions.id, versionId)];
    if (reportId) {
      conditions.push(eq(schema.reportVersions.reportId, reportId));
    }

    const [version] = await this.db
      .select()
      .from(schema.reportVersions)
      .where(and(...conditions))
      .limit(1);

    if (!version) {
      throw new HttpException('版本不存在或不属于该报告', HttpStatus.NOT_FOUND);
    }

    const sections = await this.db
      .select()
      .from(schema.reportSections)
      .where(eq(schema.reportSections.reportVersionId, versionId))
      .orderBy(schema.reportSections.sortOrder);

    return { ...version, sections };
  }

  async compareVersions(versionId1: string, versionId2: string, reportId?: string) {
    const [v1, v2] = await Promise.all([
      this.getVersion(versionId1, reportId),
      this.getVersion(versionId2, reportId),
    ]);

    const allSectionCodes = new Set([
      ...v1.sections.map((s) => s.sectionCode),
      ...v2.sections.map((s) => s.sectionCode),
    ]);

    const diffs: VersionDiff[] = [];

    for (const code of allSectionCodes) {
      const s1 = v1.sections.find((s) => s.sectionCode === code);
      const s2 = v2.sections.find((s) => s.sectionCode === code);

      diffs.push({
        sectionCode: code,
        sectionName: s1?.sectionName ?? s2?.sectionName ?? code,
        v1Content: s1?.content ?? null,
        v2Content: s2?.content ?? null,
        changed: (s1?.content ?? null) !== (s2?.content ?? null),
      });
    }

    return {
      version1: { id: v1.id, versionNumber: v1.versionNumber, versionType: v1.versionType },
      version2: { id: v2.id, versionNumber: v2.versionNumber, versionType: v2.versionType },
      diffs,
      totalSections: diffs.length,
      changedSections: diffs.filter((d) => d.changed).length,
    };
  }

  async setActiveVersion(reportId: string, versionId: string) {
    const [version] = await this.db
      .select()
      .from(schema.reportVersions)
      .where(
        and(
          eq(schema.reportVersions.id, versionId),
          eq(schema.reportVersions.reportId, reportId),
        ),
      )
      .limit(1);

    if (!version) {
      throw new HttpException('版本不存在或不属于该报告', HttpStatus.NOT_FOUND);
    }

    await this.db.transaction(async (tx) => {
      // Deactivate all versions for this report
      await tx
        .update(schema.reportVersions)
        .set({ isActive: false })
        .where(eq(schema.reportVersions.reportId, reportId));

      // Activate the specified version
      await tx
        .update(schema.reportVersions)
        .set({ isActive: true })
        .where(eq(schema.reportVersions.id, versionId));
    });

    return { reportId, versionId, isActive: true };
  }
}

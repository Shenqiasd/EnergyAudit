import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface ImportDataDto {
  auditProjectId: string;
  moduleCode: string;
  format: 'json' | 'csv';
  data: string;
  /** Optional import job ID to link this import to an existing job record */
  importJobId?: string;
}

interface ImportRow {
  fieldCode: string;
  rawValue: string | null;
  unit?: string;
}

interface SnapshotItem {
  id: string;
  dataRecordId: string;
  fieldCode: string;
  rawValue: string | null;
  calculatedValue: string | null;
  manualOverrideValue: string | null;
  finalValue: string | null;
  unit: string | null;
}

/** Default rollback time limit: 24 hours in milliseconds */
const ROLLBACK_TIME_LIMIT_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class DataImportService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async importData(dto: ImportDataDto) {
    let rows: ImportRow[];

    try {
      if (dto.format === 'json') {
        rows = JSON.parse(dto.data) as ImportRow[];
      } else {
        rows = this.parseCsv(dto.data);
      }
    } catch {
      throw new HttpException('数据格式解析失败', HttpStatus.BAD_REQUEST);
    }

    // Find or create the data record
    let [record] = await this.db
      .select()
      .from(schema.dataRecords)
      .where(
        eq(schema.dataRecords.auditProjectId, dto.auditProjectId),
      )
      .limit(1);

    if (!record) {
      const recordId = `dr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      [record] = await this.db
        .insert(schema.dataRecords)
        .values({
          id: recordId,
          auditProjectId: dto.auditProjectId,
          moduleCode: dto.moduleCode,
          status: 'draft',
        })
        .returning();
    }

    // Snapshot existing data items before import
    const existingItems = await this.db
      .select()
      .from(schema.dataItems)
      .where(eq(schema.dataItems.dataRecordId, record.id));

    const snapshot: SnapshotItem[] = existingItems.map((item) => ({
      id: item.id,
      dataRecordId: item.dataRecordId,
      fieldCode: item.fieldCode,
      rawValue: item.rawValue,
      calculatedValue: item.calculatedValue,
      manualOverrideValue: item.manualOverrideValue,
      finalValue: item.finalValue,
      unit: item.unit,
    }));

    let successRows = 0;
    let failedRows = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const itemId = `di_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const existing = await this.db
          .select()
          .from(schema.dataItems)
          .where(
            eq(schema.dataItems.dataRecordId, record.id),
          )
          .limit(1);

        const matchingItem = existing.find((e) => e.fieldCode === row.fieldCode);

        if (matchingItem) {
          await this.db
            .update(schema.dataItems)
            .set({
              rawValue: row.rawValue,
              finalValue: row.rawValue,
              unit: row.unit ?? null,
            })
            .where(eq(schema.dataItems.id, matchingItem.id));
        } else {
          await this.db.insert(schema.dataItems).values({
            id: itemId,
            dataRecordId: record.id,
            fieldCode: row.fieldCode,
            rawValue: row.rawValue,
            finalValue: row.rawValue,
            unit: row.unit ?? null,
          });
        }
        successRows++;
      } catch (err) {
        failedRows++;
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // If we have an importJobId, update the job with snapshot and results
    if (dto.importJobId) {
      await this.db
        .update(schema.importJobs)
        .set({
          preImportSnapshot: snapshot,
          totalRows: rows.length,
          successRows,
          failedRows,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
          status: failedRows > 0 ? 'partial' : 'completed',
          completedAt: new Date(),
        })
        .where(eq(schema.importJobs.id, dto.importJobId));
    }

    return {
      recordId: record.id,
      totalRows: rows.length,
      successRows,
      failedRows,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Check if a specific import job can be rolled back.
   */
  async canRollback(importJobId: string): Promise<{
    canRollback: boolean;
    reason?: string;
  }> {
    const [job] = await this.db
      .select()
      .from(schema.importJobs)
      .where(eq(schema.importJobs.id, importJobId))
      .limit(1);

    if (!job) {
      return { canRollback: false, reason: '导入任务不存在' };
    }

    if (job.isRolledBack) {
      return { canRollback: false, reason: '该导入已被回滚' };
    }

    if (!job.preImportSnapshot) {
      return { canRollback: false, reason: '无导入前快照数据' };
    }

    const completedAt = job.completedAt ?? job.createdAt;
    const elapsed = Date.now() - new Date(completedAt).getTime();
    if (elapsed > ROLLBACK_TIME_LIMIT_MS) {
      return { canRollback: false, reason: '已超过24小时回滚时限' };
    }

    return { canRollback: true };
  }

  /**
   * Rollback an import: restore data items from pre-import snapshot.
   */
  async rollbackImport(importJobId: string, userId: string) {
    const check = await this.canRollback(importJobId);
    if (!check.canRollback) {
      throw new HttpException(
        check.reason ?? '无法回滚',
        HttpStatus.BAD_REQUEST,
      );
    }

    const [job] = await this.db
      .select()
      .from(schema.importJobs)
      .where(eq(schema.importJobs.id, importJobId))
      .limit(1);

    if (!job) {
      throw new HttpException('导入任务不存在', HttpStatus.NOT_FOUND);
    }

    const snapshot = job.preImportSnapshot as SnapshotItem[] | null;

    // Find the data record for this import
    const [record] = await this.db
      .select()
      .from(schema.dataRecords)
      .where(
        and(
          eq(schema.dataRecords.auditProjectId, job.auditProjectId),
          eq(schema.dataRecords.moduleCode, job.moduleCode),
        ),
      )
      .limit(1);

    if (!record) {
      throw new HttpException('关联的数据记录不存在', HttpStatus.NOT_FOUND);
    }

    // 1. Delete all current data items for this record
    await this.db
      .delete(schema.dataItems)
      .where(eq(schema.dataItems.dataRecordId, record.id));

    // 2. Restore data items from snapshot
    if (snapshot && snapshot.length > 0) {
      await this.db.insert(schema.dataItems).values(
        snapshot.map((item) => ({
          id: item.id,
          dataRecordId: item.dataRecordId,
          fieldCode: item.fieldCode,
          rawValue: item.rawValue,
          calculatedValue: item.calculatedValue,
          manualOverrideValue: item.manualOverrideValue,
          finalValue: item.finalValue,
          unit: item.unit,
        })),
      );
    }

    // 3. Mark import job as rolled back
    await this.db
      .update(schema.importJobs)
      .set({
        isRolledBack: true,
        rolledBackAt: new Date(),
        rolledBackBy: userId,
      })
      .where(eq(schema.importJobs.id, importJobId));

    // 4. Create audit log entry
    const logId = `al_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await this.db.insert(schema.auditLogs).values({
      id: logId,
      userId,
      userRole: 'manager',
      action: 'import_rollback',
      targetType: 'import_job',
      targetId: importJobId,
      detail: JSON.stringify({
        auditProjectId: job.auditProjectId,
        moduleCode: job.moduleCode,
        restoredItemCount: snapshot?.length ?? 0,
      }),
    });

    return {
      success: true,
      importJobId,
      restoredItemCount: snapshot?.length ?? 0,
    };
  }

  private parseCsv(data: string): ImportRow[] {
    const lines = data.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const fieldCodeIdx = headers.indexOf('fieldCode');
    const rawValueIdx = headers.indexOf('rawValue');
    const unitIdx = headers.indexOf('unit');

    if (fieldCodeIdx === -1 || rawValueIdx === -1) {
      throw new Error('CSV must have fieldCode and rawValue columns');
    }

    return lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim());
      return {
        fieldCode: cols[fieldCodeIdx],
        rawValue: cols[rawValueIdx] || null,
        unit: unitIdx >= 0 ? cols[unitIdx] : undefined,
      };
    });
  }
}

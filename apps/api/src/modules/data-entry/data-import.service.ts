import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface ImportDataDto {
  auditProjectId: string;
  moduleCode: string;
  format: 'json' | 'csv';
  data: string;
}

interface ImportRow {
  fieldCode: string;
  rawValue: string | null;
  unit?: string;
}

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

    return {
      recordId: record.id,
      totalRows: rows.length,
      successRows,
      failedRows,
      errors: errors.length > 0 ? errors : undefined,
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

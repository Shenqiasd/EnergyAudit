import { Injectable } from '@nestjs/common';

export interface CsvColumn {
  key: string;
  header: string;
}

@Injectable()
export class ExcelExportService {
  generateCsv<T extends Record<string, unknown>>(
    data: T[],
    columns: CsvColumn[],
  ): string {
    const header = columns.map((c) => this.escapeCsvField(c.header)).join(',');
    const rows = data.map((row) =>
      columns
        .map((c) => {
          const value = row[c.key];
          return this.escapeCsvField(this.formatValue(value));
        })
        .join(','),
    );

    // Add BOM for Excel UTF-8 compatibility
    return '\uFEFF' + [header, ...rows].join('\n');
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return String(value);
  }

  private escapeCsvField(field: string): string {
    if (
      field.includes(',') ||
      field.includes('"') ||
      field.includes('\n') ||
      field.includes('\r')
    ) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}

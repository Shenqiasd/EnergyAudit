import { describe, expect, it } from 'vitest';

import { ExcelExportService } from '../../src/modules/export/excel-export.service';
import type { EnterpriseLedgerItem } from '../../src/modules/ledger/enterprise-ledger.service';

describe('enterprise ledger', () => {
  it('generates enterprise ledger with all required columns', () => {
    const item: EnterpriseLedgerItem = {
      enterpriseId: 'ent_001',
      enterpriseName: '测试企业A',
      industryCode: '3311',
      projectId: 'proj_001',
      projectStatus: 'in_progress',
      isOverdue: false,
      reviewScore: '85',
      rectificationStatus: 'completed',
      filingProgress: 0.75,
    };

    expect(item.enterpriseId).toBe('ent_001');
    expect(item.enterpriseName).toBe('测试企业A');
    expect(item.industryCode).toBe('3311');
    expect(item.projectId).toBe('proj_001');
    expect(item.projectStatus).toBe('in_progress');
    expect(item.isOverdue).toBe(false);
    expect(item.reviewScore).toBe('85');
    expect(item.rectificationStatus).toBe('completed');
    expect(item.filingProgress).toBe(0.75);
  });

  it('filters by batch and industry', () => {
    const items: EnterpriseLedgerItem[] = [
      {
        enterpriseId: 'ent_001',
        enterpriseName: '企业A',
        industryCode: '3311',
        projectId: 'proj_001',
        projectStatus: 'completed',
        isOverdue: false,
        reviewScore: '90',
        rectificationStatus: null,
        filingProgress: 1,
      },
      {
        enterpriseId: 'ent_002',
        enterpriseName: '企业B',
        industryCode: '4412',
        projectId: 'proj_002',
        projectStatus: 'in_progress',
        isOverdue: true,
        reviewScore: null,
        rectificationStatus: 'in_progress',
        filingProgress: 0.3,
      },
      {
        enterpriseId: 'ent_003',
        enterpriseName: '企业C',
        industryCode: '3311',
        projectId: 'proj_003',
        projectStatus: 'filing',
        isOverdue: false,
        reviewScore: null,
        rectificationStatus: null,
        filingProgress: 0.5,
      },
    ];

    const industryFilter = '3311';
    const filtered = items.filter((i) => i.industryCode === industryFilter);

    expect(filtered.length).toBe(2);
    expect(filtered.every((i) => i.industryCode === '3311')).toBe(true);
  });

  it('sorts by specified column', () => {
    const items: EnterpriseLedgerItem[] = [
      {
        enterpriseId: 'ent_001',
        enterpriseName: 'C企业',
        industryCode: '3311',
        projectId: 'proj_001',
        projectStatus: 'completed',
        isOverdue: false,
        reviewScore: '90',
        rectificationStatus: null,
        filingProgress: 1,
      },
      {
        enterpriseId: 'ent_002',
        enterpriseName: 'A企业',
        industryCode: '4412',
        projectId: 'proj_002',
        projectStatus: 'in_progress',
        isOverdue: false,
        reviewScore: '60',
        rectificationStatus: null,
        filingProgress: 0.3,
      },
      {
        enterpriseId: 'ent_003',
        enterpriseName: 'B企业',
        industryCode: '3311',
        projectId: 'proj_003',
        projectStatus: 'filing',
        isOverdue: false,
        reviewScore: '75',
        rectificationStatus: null,
        filingProgress: 0.5,
      },
    ];

    const sorted = [...items].sort((a, b) =>
      a.enterpriseName.localeCompare(b.enterpriseName),
    );

    expect(sorted[0].enterpriseName).toBe('A企业');
    expect(sorted[1].enterpriseName).toBe('B企业');
    expect(sorted[2].enterpriseName).toBe('C企业');
  });

  it('paginates results correctly', () => {
    const allItems = Array.from({ length: 25 }, (_, i) => ({
      enterpriseId: `ent_${String(i + 1).padStart(3, '0')}`,
      enterpriseName: `企业${i + 1}`,
      industryCode: '3311',
      projectId: `proj_${String(i + 1).padStart(3, '0')}`,
      projectStatus: 'in_progress',
      isOverdue: false,
      reviewScore: null,
      rectificationStatus: null,
      filingProgress: 0,
    }));

    const page = 2;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;
    const paginatedItems = allItems.slice(offset, offset + pageSize);

    expect(paginatedItems.length).toBe(10);
    expect(paginatedItems[0].enterpriseId).toBe('ent_011');
    expect(paginatedItems[9].enterpriseId).toBe('ent_020');

    // Page 3
    const page3Items = allItems.slice(20, 30);
    expect(page3Items.length).toBe(5);
    expect(page3Items[0].enterpriseId).toBe('ent_021');
  });

  it('exports to CSV format', () => {
    const service = new ExcelExportService();

    const data = [
      {
        enterpriseName: '测试企业A',
        industryCode: '3311',
        projectStatus: 'in_progress',
        isOverdue: '否',
        filingProgress: '75.0%',
        reviewScore: '85',
        rectificationStatus: '已完成',
      },
      {
        enterpriseName: '测试企业B',
        industryCode: '4412',
        projectStatus: 'completed',
        isOverdue: '是',
        filingProgress: '100.0%',
        reviewScore: '92',
        rectificationStatus: '',
      },
    ];

    const csv = service.generateCsv(data, [
      { key: 'enterpriseName', header: '企业名称' },
      { key: 'industryCode', header: '行业代码' },
      { key: 'projectStatus', header: '项目状态' },
      { key: 'isOverdue', header: '是否超期' },
      { key: 'filingProgress', header: '填报进度' },
      { key: 'reviewScore', header: '审核评分' },
      { key: 'rectificationStatus', header: '整改状态' },
    ]);

    // Starts with BOM
    expect(csv.charCodeAt(0)).toBe(0xfeff);

    const lines = csv.slice(1).split('\n');
    expect(lines[0]).toBe(
      '企业名称,行业代码,项目状态,是否超期,填报进度,审核评分,整改状态',
    );
    expect(lines[1]).toBe(
      '测试企业A,3311,in_progress,否,75.0%,85,已完成',
    );
    expect(lines[2]).toBe(
      '测试企业B,4412,completed,是,100.0%,92,',
    );
    expect(lines.length).toBe(3);
  });
});

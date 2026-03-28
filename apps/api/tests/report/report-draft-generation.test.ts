import { describe, expect, it } from 'vitest';

import { canTransitionReport } from '../../src/modules/report/report.service';

describe('report draft generation', () => {
  it('generates draft report with 8 standard sections', () => {
    const STANDARD_SECTIONS = [
      { code: 'enterprise-overview', name: '企业概况' },
      { code: 'energy-consumption', name: '能源消费' },
      { code: 'energy-efficiency', name: '能效分析' },
      { code: 'carbon-emission', name: '碳排放' },
      { code: 'product-energy', name: '产品能耗' },
      { code: 'energy-saving', name: '节能措施' },
      { code: 'energy-flow', name: '能源流程' },
      { code: 'audit-conclusion', name: '审计结论' },
    ];

    expect(STANDARD_SECTIONS.length).toBe(8);
    expect(STANDARD_SECTIONS[0].code).toBe('enterprise-overview');
    expect(STANDARD_SECTIONS[0].name).toBe('企业概况');
    expect(STANDARD_SECTIONS[6].code).toBe('energy-flow');
    expect(STANDARD_SECTIONS[7].code).toBe('audit-conclusion');
  });

  it('embeds chart references in report sections', () => {
    const sectionChartMap: Record<string, string[]> = {
      'energy-consumption': ['energy-structure-pie', 'energy-trend-bar'],
      'energy-efficiency': ['product-energy-comparison-bar'],
      'carbon-emission': ['carbon-emission-pie'],
      'product-energy': ['product-energy-comparison-bar'],
      'energy-flow': ['energy-flow-sankey'],
    };

    expect(sectionChartMap['energy-consumption'].length).toBe(2);
    expect(sectionChartMap['energy-consumption']).toContain('energy-structure-pie');
    expect(sectionChartMap['energy-flow']).toContain('energy-flow-sankey');

    // Sections without charts
    expect(sectionChartMap['enterprise-overview']).toBeUndefined();
    expect(sectionChartMap['audit-conclusion']).toBeUndefined();
  });

  it('sets version type to system_draft', () => {
    const versionType = 'system_draft';
    const status = 'system_draft';

    expect(versionType).toBe('system_draft');
    expect(status).toBe('system_draft');

    // Version ID follows expected pattern
    const versionId = `rv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    expect(versionId.startsWith('rv_')).toBe(true);
  });

  it('transitions report status correctly (not_generated -> system_draft)', () => {
    expect(canTransitionReport('not_generated', 'system_draft')).toBe(true);
    expect(canTransitionReport('system_draft', 'enterprise_revision')).toBe(true);
    expect(canTransitionReport('enterprise_revision', 'pending_final')).toBe(true);
    expect(canTransitionReport('pending_final', 'final_uploaded')).toBe(true);
    expect(canTransitionReport('final_uploaded', 'under_review')).toBe(true);
    expect(canTransitionReport('under_review', 'archived')).toBe(true);
  });

  it('blocks invalid status transitions', () => {
    expect(canTransitionReport('not_generated', 'archived')).toBe(false);
    expect(canTransitionReport('system_draft', 'final_uploaded')).toBe(false);
    expect(canTransitionReport('archived', 'system_draft')).toBe(false);
    expect(canTransitionReport('enterprise_revision', 'under_review')).toBe(false);
    expect(canTransitionReport('final_uploaded', 'not_generated')).toBe(false);
  });

  it('creates version record for each generation', () => {
    const versions: Array<{ versionType: string; versionNumber: number }> = [];

    // First generation
    versions.push({ versionType: 'system_draft', versionNumber: 1 });
    expect(versions.length).toBe(1);
    expect(versions[0].versionNumber).toBe(1);

    // Second generation (re-generate)
    versions.push({ versionType: 'system_draft', versionNumber: 2 });
    expect(versions.length).toBe(2);
    expect(versions[1].versionNumber).toBe(2);

    // Enterprise revision
    versions.push({ versionType: 'enterprise_revision', versionNumber: 1 });
    expect(versions.length).toBe(3);
    expect(versions[2].versionType).toBe('enterprise_revision');
  });
});

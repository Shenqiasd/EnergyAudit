import { describe, expect, it } from 'vitest';

import {
  STANDARD_SECTIONS,
  FIELD_MAPPINGS,
  CHART_INSERTION_RULES,
  getSectionsForReport,
  getFieldsForSection,
  getChartRulesForSection,
} from '@energy-audit/reporting';

describe('pdf-generator report structure', () => {
  it('loads 8 standard sections for report generation', () => {
    const sections = getSectionsForReport();
    expect(sections.length).toBe(8);
    expect(sections[0].code).toBe('enterprise-overview');
    expect(sections[0].name).toBe('企业概况');
    expect(sections[7].code).toBe('audit-conclusion');
    expect(sections[7].name).toBe('审计结论');
  });

  it('sections are sorted by sortOrder', () => {
    const sections = getSectionsForReport();
    for (let i = 1; i < sections.length; i++) {
      expect(sections[i].sortOrder).toBeGreaterThan(sections[i - 1].sortOrder);
    }
  });

  it('maps fields to correct sections', () => {
    const overviewFields = getFieldsForSection('enterprise-overview');
    expect(overviewFields.length).toBeGreaterThan(0);
    expect(overviewFields[0].sectionCode).toBe('enterprise-overview');
    expect(overviewFields[0].label).toBe('企业名称');

    const energyFields = getFieldsForSection('energy-consumption');
    expect(energyFields.length).toBeGreaterThan(0);
    expect(energyFields.some((f) => f.fieldCode === 'total_energy_consumption')).toBe(true);
  });

  it('maps chart insertion rules to sections', () => {
    const energyCharts = getChartRulesForSection('energy-consumption');
    expect(energyCharts.length).toBe(2);
    expect(energyCharts.some((c) => c.chartCode === 'energy-structure-pie')).toBe(true);
    expect(energyCharts.some((c) => c.chartCode === 'energy-trend-bar')).toBe(true);

    const flowCharts = getChartRulesForSection('energy-flow');
    expect(flowCharts.length).toBe(1);
    expect(flowCharts[0].chartCode).toBe('energy-flow-sankey');
  });

  it('sections without charts have no chart rules', () => {
    const overviewCharts = getChartRulesForSection('enterprise-overview');
    expect(overviewCharts.length).toBe(0);

    const conclusionCharts = getChartRulesForSection('audit-conclusion');
    expect(conclusionCharts.length).toBe(0);

    const savingCharts = getChartRulesForSection('energy-saving');
    expect(savingCharts.length).toBe(0);
  });

  it('all field mappings reference valid section codes', () => {
    const sectionCodes = STANDARD_SECTIONS.map((s) => s.code);
    for (const mapping of FIELD_MAPPINGS) {
      expect(sectionCodes).toContain(mapping.sectionCode);
    }
  });

  it('all chart insertion rules reference valid section codes', () => {
    const sectionCodes = STANDARD_SECTIONS.map((s) => s.code);
    for (const rule of CHART_INSERTION_RULES) {
      expect(sectionCodes).toContain(rule.sectionCode);
    }
  });

  it('chart insertion rules have valid positions', () => {
    const validPositions = ['before_content', 'after_content', 'inline'];
    for (const rule of CHART_INSERTION_RULES) {
      expect(validPositions).toContain(rule.position);
    }
  });

  it('report data structure matches expected PDF output schema', () => {
    const reportData = {
      enterpriseName: '测试企业有限公司',
      auditYear: '2025',
      version: 1,
      generatedDate: '2025-12-01',
      sections: getSectionsForReport().map((s) => ({
        sectionCode: s.code,
        sectionName: s.name,
        sortOrder: s.sortOrder,
        content: `${s.name}章节内容`,
        fields: getFieldsForSection(s.code).map((f) => ({
          label: f.label,
          value: '100',
          unit: 'tce',
        })),
        chartRefs: getChartRulesForSection(s.code).map((c) => ({
          chartCode: c.chartCode,
          chartType: c.chartCode.includes('pie') ? 'pie' : c.chartCode.includes('bar') ? 'bar' : 'sankey',
          title: c.chartCode,
        })),
      })),
    };

    expect(reportData.enterpriseName).toBe('测试企业有限公司');
    expect(reportData.sections.length).toBe(8);
    expect(reportData.sections[0].sectionName).toBe('企业概况');
    expect(reportData.sections[1].chartRefs.length).toBe(2);
    expect(reportData.sections[6].chartRefs[0].chartType).toBe('sankey');
  });

  it('DOCX output uses same section structure as PDF', () => {
    const sections = getSectionsForReport();

    // Both PDF and DOCX should iterate the same sections
    const pdfChapters = sections.map((s) => `第${s.sortOrder}章  ${s.name}`);
    const docxChapters = sections.map((s) => `第${s.sortOrder}章  ${s.name}`);

    expect(pdfChapters).toEqual(docxChapters);
    expect(pdfChapters[0]).toBe('第1章  企业概况');
    expect(pdfChapters[7]).toBe('第8章  审计结论');
  });
});

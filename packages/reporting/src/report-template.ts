export interface ReportSection {
  code: string;
  name: string;
  sortOrder: number;
  description: string;
  chartCodes: string[];
  dataModules: string[];
}

export const STANDARD_SECTIONS: ReportSection[] = [
  {
    code: 'enterprise-overview',
    name: '企业概况',
    sortOrder: 1,
    description: '企业基本信息、主要产品、生产工艺概述',
    chartCodes: [],
    dataModules: ['enterprise-info', 'production-overview'],
  },
  {
    code: 'energy-consumption',
    name: '能源消费',
    sortOrder: 2,
    description: '企业能源消费总量、各类能源消费构成',
    chartCodes: ['energy-structure-pie', 'energy-trend-bar'],
    dataModules: ['energy-balance', 'energy-purchase'],
  },
  {
    code: 'energy-efficiency',
    name: '能效分析',
    sortOrder: 3,
    description: '综合能耗、能效指标、与行业标杆对比',
    chartCodes: ['product-energy-comparison-bar'],
    dataModules: ['energy-balance', 'production-output'],
  },
  {
    code: 'carbon-emission',
    name: '碳排放',
    sortOrder: 4,
    description: '碳排放核算、各能源品种碳排放量',
    chartCodes: ['carbon-emission-pie'],
    dataModules: ['energy-balance', 'carbon-emission'],
  },
  {
    code: 'product-energy',
    name: '产品能耗',
    sortOrder: 5,
    description: '主要产品单位能耗分析',
    chartCodes: ['product-energy-comparison-bar'],
    dataModules: ['product-energy', 'production-output'],
  },
  {
    code: 'energy-saving',
    name: '节能措施',
    sortOrder: 6,
    description: '节能潜力分析、节能措施建议',
    chartCodes: [],
    dataModules: ['energy-saving'],
  },
  {
    code: 'energy-flow',
    name: '能源流程',
    sortOrder: 7,
    description: '能源从输入到终端使用的流向图',
    chartCodes: ['energy-flow-sankey'],
    dataModules: ['energy-flow', 'energy-balance'],
  },
  {
    code: 'audit-conclusion',
    name: '审计结论',
    sortOrder: 8,
    description: '审计总结与建议',
    chartCodes: [],
    dataModules: [],
  },
];

export interface FieldMapping {
  sectionCode: string;
  moduleCode: string;
  fieldCode: string;
  label: string;
}

export const FIELD_MAPPINGS: FieldMapping[] = [
  { sectionCode: 'enterprise-overview', moduleCode: 'enterprise-info', fieldCode: 'enterprise_name', label: '企业名称' },
  { sectionCode: 'enterprise-overview', moduleCode: 'enterprise-info', fieldCode: 'industry_code', label: '行业代码' },
  { sectionCode: 'enterprise-overview', moduleCode: 'enterprise-info', fieldCode: 'address', label: '企业地址' },
  { sectionCode: 'energy-consumption', moduleCode: 'energy-balance', fieldCode: 'total_energy_consumption', label: '能源消费总量' },
  { sectionCode: 'energy-consumption', moduleCode: 'energy-balance', fieldCode: 'coal_consumption', label: '煤炭消费量' },
  { sectionCode: 'energy-consumption', moduleCode: 'energy-balance', fieldCode: 'electricity_consumption', label: '电力消费量' },
  { sectionCode: 'energy-consumption', moduleCode: 'energy-balance', fieldCode: 'natural_gas_consumption', label: '天然气消费量' },
  { sectionCode: 'carbon-emission', moduleCode: 'carbon-emission', fieldCode: 'total_carbon_emission', label: '碳排放总量' },
  { sectionCode: 'product-energy', moduleCode: 'product-energy', fieldCode: 'product_unit_energy', label: '产品单位能耗' },
];

export interface ChartInsertionRule {
  sectionCode: string;
  chartCode: string;
  position: 'before_content' | 'after_content' | 'inline';
}

export const CHART_INSERTION_RULES: ChartInsertionRule[] = [
  { sectionCode: 'energy-consumption', chartCode: 'energy-structure-pie', position: 'after_content' },
  { sectionCode: 'energy-consumption', chartCode: 'energy-trend-bar', position: 'after_content' },
  { sectionCode: 'carbon-emission', chartCode: 'carbon-emission-pie', position: 'after_content' },
  { sectionCode: 'energy-efficiency', chartCode: 'product-energy-comparison-bar', position: 'after_content' },
  { sectionCode: 'energy-flow', chartCode: 'energy-flow-sankey', position: 'after_content' },
];

export function getSectionsForReport(): ReportSection[] {
  return [...STANDARD_SECTIONS].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getFieldsForSection(sectionCode: string): FieldMapping[] {
  return FIELD_MAPPINGS.filter((f) => f.sectionCode === sectionCode);
}

export function getChartRulesForSection(sectionCode: string): ChartInsertionRule[] {
  return CHART_INSERTION_RULES.filter((r) => r.sectionCode === sectionCode);
}

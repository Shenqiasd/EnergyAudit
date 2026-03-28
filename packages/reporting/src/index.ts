export {
  STANDARD_SECTIONS,
  FIELD_MAPPINGS,
  CHART_INSERTION_RULES,
  getSectionsForReport,
  getFieldsForSection,
  getChartRulesForSection,
} from './report-template';

export type {
  ReportSection,
  FieldMapping,
  ChartInsertionRule,
} from './report-template';

export {
  buildEnergyStructurePie,
  buildEnergyTrendBar,
  buildCarbonEmissionPie,
  buildProductEnergyComparisonBar,
  aggregateChartData,
} from './chart-renderer';

export type {
  ChartType,
  ChartDataItem,
  ChartData,
  DataItemRecord,
} from './chart-renderer';

export {
  buildSankeyData,
  buildSankeyFromEnergyBalance,
} from './energy-flow-renderer';

export type {
  SankeyNode,
  SankeyLink,
  SankeyData,
  EnergyFlowInput,
} from './energy-flow-renderer';

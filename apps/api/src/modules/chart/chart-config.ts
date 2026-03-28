export interface ChartConfigDef {
  code: string;
  name: string;
  chartType: 'pie' | 'bar' | 'line' | 'sankey' | 'table';
  moduleCode: string;
  description: string;
}

export const DEFAULT_CHART_CONFIGS: ChartConfigDef[] = [
  {
    code: 'energy-structure-pie',
    name: '能源消费结构',
    chartType: 'pie',
    moduleCode: 'energy-balance',
    description: '各类能源消费占比',
  },
  {
    code: 'energy-trend-bar',
    name: '能源消费趋势',
    chartType: 'bar',
    moduleCode: 'energy-balance',
    description: '历年能源消费变化趋势',
  },
  {
    code: 'carbon-emission-pie',
    name: '碳排放构成',
    chartType: 'pie',
    moduleCode: 'carbon-emission',
    description: '各能源品种碳排放占比',
  },
  {
    code: 'product-energy-comparison-bar',
    name: '产品单位能耗对比',
    chartType: 'bar',
    moduleCode: 'product-energy',
    description: '主要产品单位能耗与标杆对比',
  },
  {
    code: 'energy-flow-sankey',
    name: '能源流向图',
    chartType: 'sankey',
    moduleCode: 'energy-flow',
    description: '能源从输入到终端使用的流向',
  },
];

export function getChartConfig(code: string): ChartConfigDef | undefined {
  return DEFAULT_CHART_CONFIGS.find((c) => c.code === code);
}

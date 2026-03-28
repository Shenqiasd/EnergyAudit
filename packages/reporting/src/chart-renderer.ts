export type ChartType = 'pie' | 'bar' | 'line' | 'sankey' | 'table';

export interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
}

export interface ChartData {
  chartCode: string;
  chartType: ChartType;
  title: string;
  data: ChartDataItem[];
  xAxis?: string;
  yAxis?: string;
}

export interface DataItemRecord {
  fieldCode: string;
  finalValue: string | null;
  rawValue: string | null;
  unit: string | null;
}

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

function getNumericValue(item: DataItemRecord): number {
  const val = item.finalValue ?? item.rawValue;
  if (val === null || val === '') return 0;
  const num = Number(val);
  return isFinite(num) ? num : 0;
}

export function buildEnergyStructurePie(items: DataItemRecord[]): ChartData {
  const energyFields: Record<string, string> = {
    coal_consumption: '煤炭',
    electricity_consumption: '电力',
    natural_gas_consumption: '天然气',
    oil_consumption: '石油',
    heat_consumption: '热力',
    other_energy_consumption: '其他',
  };

  const data: ChartDataItem[] = [];
  let colorIdx = 0;
  for (const [fieldCode, label] of Object.entries(energyFields)) {
    const item = items.find((i) => i.fieldCode === fieldCode);
    if (item) {
      const value = getNumericValue(item);
      if (value > 0) {
        data.push({ label, value, color: DEFAULT_COLORS[colorIdx % DEFAULT_COLORS.length] });
        colorIdx++;
      }
    }
  }

  return {
    chartCode: 'energy-structure-pie',
    chartType: 'pie',
    title: '能源消费结构',
    data,
  };
}

export function buildEnergyTrendBar(
  yearlyData: Array<{ year: number; totalEnergy: number }>,
): ChartData {
  const data: ChartDataItem[] = yearlyData.map((d, i) => ({
    label: String(d.year),
    value: d.totalEnergy,
    color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  return {
    chartCode: 'energy-trend-bar',
    chartType: 'bar',
    title: '能源消费趋势',
    data,
    xAxis: '年份',
    yAxis: '综合能耗 (tce)',
  };
}

export function buildCarbonEmissionPie(
  emissionData: Array<{ energyName: string; emission: number }>,
): ChartData {
  const data: ChartDataItem[] = emissionData
    .filter((d) => d.emission > 0)
    .map((d, i) => ({
      label: d.energyName,
      value: d.emission,
      color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    }));

  return {
    chartCode: 'carbon-emission-pie',
    chartType: 'pie',
    title: '碳排放构成',
    data,
  };
}

export function buildProductEnergyComparisonBar(
  products: Array<{ productName: string; unitEnergy: number; benchmark?: number }>,
): ChartData {
  const data: ChartDataItem[] = products.map((p, i) => ({
    label: p.productName,
    value: p.unitEnergy,
    color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  return {
    chartCode: 'product-energy-comparison-bar',
    chartType: 'bar',
    title: '产品单位能耗对比',
    data,
    xAxis: '产品',
    yAxis: '单位能耗 (tce/单位产品)',
  };
}

export function aggregateChartData(
  chartCode: string,
  items: DataItemRecord[],
  extra?: Record<string, unknown>,
): ChartData | null {
  switch (chartCode) {
    case 'energy-structure-pie':
      return buildEnergyStructurePie(items);
    case 'energy-trend-bar': {
      const yearlyData = (extra?.['yearlyData'] as Array<{ year: number; totalEnergy: number }>) ?? [];
      return buildEnergyTrendBar(yearlyData);
    }
    case 'carbon-emission-pie': {
      const emissionData = (extra?.['emissionData'] as Array<{ energyName: string; emission: number }>) ?? [];
      return buildCarbonEmissionPie(emissionData);
    }
    case 'product-energy-comparison-bar': {
      const products = (extra?.['products'] as Array<{ productName: string; unitEnergy: number; benchmark?: number }>) ?? [];
      return buildProductEnergyComparisonBar(products);
    }
    default:
      return null;
  }
}

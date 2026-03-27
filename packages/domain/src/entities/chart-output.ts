/**
 * 图表输出对象
 * 对齐设计文档 5.3 结果输出对象 - ChartOutput
 */
export interface ChartOutput {
  id: string;
  auditProjectId: string;
  /** 图表配置编码 */
  chartConfigCode: string;
  /** 图表类型 (pie, bar, line, stacked_bar, sankey, etc.) */
  chartType: string;
  /** 图表标题 */
  title: string;
  /** 图表数据 (JSON) */
  data: string;
  /** 计算快照 ID */
  calculationSnapshotId?: string;
  /** 是否为规定图表 */
  isMandatory: boolean;
  /** 是否嵌入报告 */
  embeddedInReport: boolean;
  createdAt: string;
}

export function createChartOutput(
  overrides: Partial<ChartOutput> = {},
): ChartOutput {
  return {
    id: "chart_1",
    auditProjectId: "project_1",
    chartConfigCode: "energy-structure-pie",
    chartType: "pie",
    title: "能源消费结构",
    data: "{}",
    isMandatory: true,
    embeddedInReport: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * 关键计算结果快照
 * 对齐设计文档 5.2 业务运行对象 - CalculationSnapshot
 * 对齐设计文档 9.8 关键计算原则：关键结果保留快照
 */
export interface CalculationSnapshot {
  id: string;
  auditProjectId: string;
  /** 计算类型 (如 comprehensive_energy, product_unit_consumption, carbon_emission, energy_saving) */
  calculationType: string;
  /** 计算结果 (JSON) */
  result: string;
  /** 使用的规则版本 ID */
  ruleVersionId?: string;
  /** 使用的参数快照 (JSON, 如折标系数、碳排放因子) */
  parametersSnapshot?: string;
  /** 计算时间 */
  calculatedAt: string;
  /** 是否为最新快照 */
  isLatest: boolean;
}

export function createCalculationSnapshot(
  overrides: Partial<CalculationSnapshot> = {},
): CalculationSnapshot {
  return {
    id: "calc_snap_1",
    auditProjectId: "project_1",
    calculationType: "comprehensive_energy",
    result: '{"totalTce": 1234.56}',
    calculatedAt: new Date().toISOString(),
    isLatest: true,
    ...overrides,
  };
}

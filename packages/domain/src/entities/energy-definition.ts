/**
 * 企业级能源品种定义
 * 对齐设计文档 5.2 业务运行对象 - EnergyDefinition
 */
export interface EnergyDefinition {
  id: string;
  enterpriseId: string;
  /** 能源品种编码 (关联字典) */
  energyCode: string;
  /** 能源品种名称 */
  name: string;
  /** 能源类型 (一次能源/二次能源/耗能工质) */
  energyType: string;
  /** 折标煤系数 (kgce/单位) */
  conversionFactor: number;
  /** 计量单位 */
  measurementUnit: string;
  /** 是否启用 */
  isActive: boolean;
  /** 排序 */
  sortOrder: number;
}

export function createEnergyDefinition(
  overrides: Partial<EnergyDefinition> = {},
): EnergyDefinition {
  return {
    id: "energy_def_1",
    enterpriseId: "ent_1",
    energyCode: "electricity",
    name: "电力",
    energyType: "二次能源",
    conversionFactor: 0.1229,
    measurementUnit: "万kWh",
    isActive: true,
    sortOrder: 1,
    ...overrides,
  };
}

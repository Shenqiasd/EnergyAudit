/**
 * 碳排放因子管理
 * KDocs 需求明确要求管理端具备碳排放因子管理能力
 */
export interface CarbonEmissionFactor {
  id: string;
  /** 能源品种编码 */
  energyCode: string;
  /** 碳排放因子名称 */
  name: string;
  /** 排放因子值 (tCO2/单位) */
  emissionFactor: number;
  /** 氧化率 */
  oxidationRate: number;
  /** 来源标准 (如 GB/T xxxxx) */
  standardSource?: string;
  /** 适用年份 */
  applicableYear?: number;
  /** 计量单位 */
  measurementUnit: string;
  /** 是否为默认值 */
  isDefault: boolean;
  /** 是否启用 */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function createCarbonEmissionFactor(
  overrides: Partial<CarbonEmissionFactor> = {},
): CarbonEmissionFactor {
  return {
    id: "cef_1",
    energyCode: "coal",
    name: "原煤碳排放因子",
    emissionFactor: 1.9003,
    oxidationRate: 0.98,
    standardSource: "GB/T 32150-2015",
    measurementUnit: "tCO2/tce",
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

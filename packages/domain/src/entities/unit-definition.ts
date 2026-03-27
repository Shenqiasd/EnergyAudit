/**
 * 企业级单元定义
 * 对齐设计文档 5.2 业务运行对象 - UnitDefinition
 */
export interface UnitDefinition {
  id: string;
  enterpriseId: string;
  /** 单元编码 */
  unitCode: string;
  /** 单元名称 */
  name: string;
  /** 单元类型 (生产单元/辅助单元/附属单元) */
  unitType: string;
  /** 能源消耗边界描述 */
  energyBoundaryDescription?: string;
  /** 关联能源品种编码列表 (JSON array) */
  associatedEnergyCodes?: string;
  /** 是否启用 */
  isActive: boolean;
  /** 排序 */
  sortOrder: number;
}

export function createUnitDefinition(
  overrides: Partial<UnitDefinition> = {},
): UnitDefinition {
  return {
    id: "unit_def_1",
    enterpriseId: "ent_1",
    unitCode: "production_line_1",
    name: "一号生产线",
    unitType: "生产单元",
    isActive: true,
    sortOrder: 1,
    ...overrides,
  };
}

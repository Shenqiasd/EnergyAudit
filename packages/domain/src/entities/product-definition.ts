/**
 * 企业级产品定义
 * 对齐设计文档 5.2 业务运行对象 - ProductDefinition
 */
export interface ProductDefinition {
  id: string;
  enterpriseId: string;
  /** 产品编码 */
  productCode: string;
  /** 产品名称 */
  name: string;
  /** 计量单位 */
  measurementUnit: string;
  /** 关联单元 ID */
  unitDefinitionId?: string;
  /** 关联工序描述 */
  processDescription?: string;
  /** 是否启用 */
  isActive: boolean;
  /** 排序 */
  sortOrder: number;
}

export function createProductDefinition(
  overrides: Partial<ProductDefinition> = {},
): ProductDefinition {
  return {
    id: "product_def_1",
    enterpriseId: "ent_1",
    productCode: "steel_plate",
    name: "钢板",
    measurementUnit: "吨",
    isActive: true,
    sortOrder: 1,
    ...overrides,
  };
}

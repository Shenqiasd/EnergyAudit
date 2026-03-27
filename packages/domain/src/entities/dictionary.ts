/**
 * 字典项对象
 * 对齐设计文档 5.1 平台核心对象 - DictionaryItem
 */
export interface DictionaryItem {
  id: string;
  /** 字典类别 (如 industry_type, energy_type, measurement_unit) */
  category: string;
  code: string;
  name: string;
  /** 父级编码 (层级字典) */
  parentCode?: string;
  /** 排序 */
  sortOrder: number;
  /** 是否启用 */
  isActive: boolean;
  /** 附加属性 (JSON) */
  metadata?: string;
}

export function createDictionaryItem(
  overrides: Partial<DictionaryItem> = {},
): DictionaryItem {
  return {
    id: "dict_1",
    category: "energy_type",
    code: "electricity",
    name: "电力",
    sortOrder: 1,
    isActive: true,
    ...overrides,
  };
}

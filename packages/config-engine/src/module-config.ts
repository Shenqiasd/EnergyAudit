/**
 * Module configuration loader - manages enable/disable per project
 */

export interface ModuleConfig {
  code: string;
  name: string;
  category: string;
  description?: string;
  sortOrder: number;
  isEnabled: boolean;
}

export interface ProjectModuleOverride {
  moduleCode: string;
  isEnabled: boolean;
}

const MODULE_CATEGORIES = [
  '基本信息',
  '能源数据',
  '节能管理',
  '分项数据',
  '设备设施',
  '管理体系',
] as const;

export type ModuleCategory = (typeof MODULE_CATEGORIES)[number];

export function getModuleCategories(): readonly string[] {
  return MODULE_CATEGORIES;
}

export function filterModulesByCategory(
  modules: ModuleConfig[],
  category: string,
): ModuleConfig[] {
  return modules.filter((m) => m.category === category);
}

export function getEnabledModules(
  modules: ModuleConfig[],
  overrides: ProjectModuleOverride[] = [],
): ModuleConfig[] {
  const overrideMap = new Map(overrides.map((o) => [o.moduleCode, o.isEnabled]));

  return modules.filter((m) => {
    const override = overrideMap.get(m.code);
    return override !== undefined ? override : m.isEnabled;
  });
}

export function groupModulesByCategory(
  modules: ModuleConfig[],
): Record<string, ModuleConfig[]> {
  const groups: Record<string, ModuleConfig[]> = {};

  for (const mod of modules) {
    if (!groups[mod.category]) {
      groups[mod.category] = [];
    }
    groups[mod.category].push(mod);
  }

  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return groups;
}

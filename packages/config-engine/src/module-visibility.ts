export interface ModuleVisibility {
  moduleCode: string;
  isVisible: boolean;
  isRequired: boolean;
  sortOrder: number;
}

export interface ModuleVisibilityStore {
  getByBusinessType(businessType: string): ModuleVisibility[];
}

/**
 * Returns only the visible modules for a given business type.
 */
export function getVisibleModules(
  store: ModuleVisibilityStore,
  businessType: string,
): ModuleVisibility[] {
  return store
    .getByBusinessType(businessType)
    .filter((m) => m.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Checks whether a specific module is visible for a business type.
 */
export function isModuleVisible(
  store: ModuleVisibilityStore,
  businessType: string,
  moduleCode: string,
): boolean {
  const modules = store.getByBusinessType(businessType);
  const mod = modules.find((m) => m.moduleCode === moduleCode);
  return mod ? mod.isVisible : false;
}

/**
 * Checks whether a specific module is required for a business type.
 */
export function isModuleRequired(
  store: ModuleVisibilityStore,
  businessType: string,
  moduleCode: string,
): boolean {
  const modules = store.getByBusinessType(businessType);
  const mod = modules.find((m) => m.moduleCode === moduleCode);
  return mod ? mod.isRequired : false;
}

/**
 * Returns module codes in display order for a business type.
 */
export function getModuleOrder(
  store: ModuleVisibilityStore,
  businessType: string,
): string[] {
  return store
    .getByBusinessType(businessType)
    .filter((m) => m.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((m) => m.moduleCode);
}

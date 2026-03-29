// Module visibility (from platform-merge)
export {
  getVisibleModules,
  isModuleVisible,
  isModuleRequired,
  getModuleOrder,
} from './module-visibility';

export type {
  ModuleVisibility,
  ModuleVisibilityStore,
} from './module-visibility';

// Module config (from data-collection)
export {
  getModuleCategories,
  filterModulesByCategory,
  getEnabledModules,
  groupModulesByCategory,
} from './module-config';
export type { ModuleConfig, ModuleCategory, ProjectModuleOverride } from './module-config';

export {
  isFieldRequired,
  getRequiredFields,
  getFieldsByGroup,
  isFieldVisible,
  validateFieldValue,
} from './field-config';
export type {
  FieldType,
  FieldConstraint,
  SelectOption,
  TableColumnDef,
  DisplayRule,
  FieldConfig,
} from './field-config';

export {
  createEmptyResult,
  executeRequiredCheck,
  executeFieldValidation,
  executeCrossFieldValidation,
  executeCrossModuleValidation,
  executeCompletenessCheck,
  aggregateResults,
  groupErrorsByLayer,
} from './validation-rule';
export type {
  ValidationSeverity,
  ValidationLayer,
  ValidationRule,
  ValidationError,
  ValidationResult,
} from './validation-rule';

export {
  resolveDependencyOrder,
  executeCalculation,
  executeAllCalculations,
} from './calculation-rule';
export type {
  CalculationRule,
  CalculationResult,
  CalculationSnapshot,
} from './calculation-rule';

// Config override resolver
export {
  deepMerge,
  filterAndSortOverrides,
  applyOverrides,
  resolveModuleConfig,
  resolveFieldConfig,
  resolveValidationRules,
} from './config-resolver';
export type {
  ConfigOverrideRecord,
  ResolutionContext,
  MergedModuleConfig,
  MergedFieldConfig,
  MergedValidationRule,
} from './config-resolver';

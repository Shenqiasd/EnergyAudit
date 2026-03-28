import { describe, expect, it } from 'vitest';

/**
 * Pure unit tests for business type routing logic.
 * Tests business type differentiation, module visibility, and template routing
 * without any DB or NestJS involvement.
 */

// ==================== Business Type Types ====================

interface BusinessTypeConfig {
  businessType: string;
  label: string;
  description: string | null;
  defaultTemplateId: string | null;
  reportTemplateId: string | null;
  isActive: boolean;
}

interface ModuleVisibilityEntry {
  moduleCode: string;
  isVisible: boolean;
  isRequired: boolean;
  sortOrder: number;
}

interface AuditBatch {
  id: string;
  name: string;
  year: number;
  status: string;
  businessType: string;
}

// ==================== In-Memory Stores ====================

function createBusinessTypeStore() {
  const configs: BusinessTypeConfig[] = [
    {
      businessType: 'energy_audit',
      label: '能源审计',
      description: '全市重点用能企业能源审计',
      defaultTemplateId: 'tpl_audit_v1',
      reportTemplateId: 'rpt_audit_v1',
      isActive: true,
    },
    {
      businessType: 'energy_diagnosis',
      label: '节能诊断',
      description: '节能诊断评估',
      defaultTemplateId: 'tpl_diag_v1',
      reportTemplateId: 'rpt_diag_v1',
      isActive: true,
    },
  ];

  const moduleVisibility: Record<string, ModuleVisibilityEntry[]> = {
    energy_audit: [
      { moduleCode: 'energy-flow', isVisible: true, isRequired: true, sortOrder: 0 },
      { moduleCode: 'energy-consumption', isVisible: true, isRequired: true, sortOrder: 1 },
      { moduleCode: 'carbon-emission', isVisible: true, isRequired: false, sortOrder: 2 },
      { moduleCode: 'equipment-efficiency', isVisible: true, isRequired: false, sortOrder: 3 },
      { moduleCode: 'energy-balance', isVisible: false, isRequired: false, sortOrder: 4 },
    ],
    energy_diagnosis: [
      { moduleCode: 'energy-flow', isVisible: true, isRequired: true, sortOrder: 0 },
      { moduleCode: 'energy-consumption', isVisible: true, isRequired: true, sortOrder: 1 },
      { moduleCode: 'carbon-emission', isVisible: false, isRequired: false, sortOrder: 2 },
      { moduleCode: 'equipment-efficiency', isVisible: true, isRequired: true, sortOrder: 3 },
    ],
  };

  return {
    getConfig(type: string): BusinessTypeConfig | undefined {
      return configs.find((c) => c.businessType === type);
    },
    getModuleVisibility(type: string): ModuleVisibilityEntry[] {
      return moduleVisibility[type] ?? [];
    },
    getVisibleModules(type: string): ModuleVisibilityEntry[] {
      return (moduleVisibility[type] ?? [])
        .filter((m) => m.isVisible)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },
    getTemplateForType(type: string): string | null {
      const config = configs.find((c) => c.businessType === type && c.isActive);
      return config?.defaultTemplateId ?? null;
    },
    getReportTemplateForType(type: string): string | null {
      const config = configs.find((c) => c.businessType === type && c.isActive);
      return config?.reportTemplateId ?? null;
    },
  };
}

// ==================== Batch & Project Creation Logic ====================

function createBatch(
  name: string,
  year: number,
  businessType?: string,
): AuditBatch {
  return {
    id: `batch_test_${Date.now()}`,
    name,
    year,
    status: 'draft',
    businessType: businessType ?? 'energy_audit',
  };
}

function createProjectFromBatch(
  batch: AuditBatch,
  enterpriseId: string,
): { enterpriseId: string; batchId: string; businessType: string } {
  return {
    enterpriseId,
    batchId: batch.id,
    businessType: batch.businessType,
  };
}

function filterBatchesByType(batches: AuditBatch[], businessType: string): AuditBatch[] {
  return batches.filter((b) => b.businessType === businessType);
}

// ==================== Tests ====================

describe('business type routing', () => {
  describe('batch creation with business type', () => {
    it('creates audit batch with business type energy_audit', () => {
      const batch = createBatch('2026年度能源审计', 2026, 'energy_audit');
      expect(batch.businessType).toBe('energy_audit');
      expect(batch.name).toBe('2026年度能源审计');
      expect(batch.status).toBe('draft');
    });

    it('creates diagnosis batch with business type energy_diagnosis', () => {
      const batch = createBatch('2026年度节能诊断', 2026, 'energy_diagnosis');
      expect(batch.businessType).toBe('energy_diagnosis');
      expect(batch.name).toBe('2026年度节能诊断');
    });

    it('defaults to energy_audit when businessType not provided', () => {
      const batch = createBatch('默认批次', 2026);
      expect(batch.businessType).toBe('energy_audit');
    });

    it('filters batches by business type', () => {
      const batches = [
        createBatch('审计批次1', 2026, 'energy_audit'),
        createBatch('诊断批次1', 2026, 'energy_diagnosis'),
        createBatch('审计批次2', 2026, 'energy_audit'),
        createBatch('诊断批次2', 2026, 'energy_diagnosis'),
      ];

      const auditBatches = filterBatchesByType(batches, 'energy_audit');
      expect(auditBatches).toHaveLength(2);
      expect(auditBatches.every((b) => b.businessType === 'energy_audit')).toBe(true);

      const diagBatches = filterBatchesByType(batches, 'energy_diagnosis');
      expect(diagBatches).toHaveLength(2);
      expect(diagBatches.every((b) => b.businessType === 'energy_diagnosis')).toBe(true);
    });
  });

  describe('project inherits business type from batch', () => {
    it('project gets energy_audit from batch', () => {
      const batch = createBatch('审计批次', 2026, 'energy_audit');
      const project = createProjectFromBatch(batch, 'enterprise_1');
      expect(project.businessType).toBe('energy_audit');
    });

    it('project gets energy_diagnosis from batch', () => {
      const batch = createBatch('诊断批次', 2026, 'energy_diagnosis');
      const project = createProjectFromBatch(batch, 'enterprise_1');
      expect(project.businessType).toBe('energy_diagnosis');
    });
  });

  describe('module visibility by business type', () => {
    it('controls module visibility by business type', () => {
      const store = createBusinessTypeStore();

      const auditModules = store.getVisibleModules('energy_audit');
      const auditCodes = auditModules.map((m) => m.moduleCode);

      expect(auditCodes).toContain('energy-flow');
      expect(auditCodes).toContain('energy-consumption');
      expect(auditCodes).toContain('carbon-emission');
      expect(auditCodes).not.toContain('energy-balance'); // hidden for audit
    });

    it('different business types can have different visible modules', () => {
      const store = createBusinessTypeStore();

      const auditModules = store.getVisibleModules('energy_audit');
      const diagModules = store.getVisibleModules('energy_diagnosis');

      const auditCodes = auditModules.map((m) => m.moduleCode);
      const diagCodes = diagModules.map((m) => m.moduleCode);

      // carbon-emission is visible in audit but not in diagnosis
      expect(auditCodes).toContain('carbon-emission');
      expect(diagCodes).not.toContain('carbon-emission');

      // energy-balance is hidden in audit
      expect(auditCodes).not.toContain('energy-balance');
    });

    it('module required flag works correctly', () => {
      const store = createBusinessTypeStore();

      const auditModules = store.getModuleVisibility('energy_audit');
      const diagModules = store.getModuleVisibility('energy_diagnosis');

      // energy-flow is required in both
      const auditEnergyFlow = auditModules.find((m) => m.moduleCode === 'energy-flow');
      expect(auditEnergyFlow?.isRequired).toBe(true);

      const diagEnergyFlow = diagModules.find((m) => m.moduleCode === 'energy-flow');
      expect(diagEnergyFlow?.isRequired).toBe(true);

      // carbon-emission is not required in audit
      const auditCarbon = auditModules.find((m) => m.moduleCode === 'carbon-emission');
      expect(auditCarbon?.isRequired).toBe(false);

      // equipment-efficiency is required in diagnosis but not in audit
      const diagEquip = diagModules.find((m) => m.moduleCode === 'equipment-efficiency');
      expect(diagEquip?.isRequired).toBe(true);

      const auditEquip = auditModules.find((m) => m.moduleCode === 'equipment-efficiency');
      expect(auditEquip?.isRequired).toBe(false);
    });
  });

  describe('template routing by business type', () => {
    it('returns correct template per business type', () => {
      const store = createBusinessTypeStore();

      const auditTemplate = store.getTemplateForType('energy_audit');
      expect(auditTemplate).toBe('tpl_audit_v1');

      const diagTemplate = store.getTemplateForType('energy_diagnosis');
      expect(diagTemplate).toBe('tpl_diag_v1');
    });

    it('returns correct report template per business type', () => {
      const store = createBusinessTypeStore();

      const auditReportTemplate = store.getReportTemplateForType('energy_audit');
      expect(auditReportTemplate).toBe('rpt_audit_v1');

      const diagReportTemplate = store.getReportTemplateForType('energy_diagnosis');
      expect(diagReportTemplate).toBe('rpt_diag_v1');
    });

    it('returns null for unknown business type', () => {
      const store = createBusinessTypeStore();

      const unknownTemplate = store.getTemplateForType('unknown_type');
      expect(unknownTemplate).toBeNull();
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import { MasterDataController } from '../../src/modules/master-data/master-data.controller';

function createController(checkResult: unknown) {
  const dict = { findByCategory: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };
  const energy = { findByEnterprise: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), countByEnterprise: vi.fn() };
  const product = { findByEnterprise: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), countByEnterprise: vi.fn() };
  const unit = { findByEnterprise: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), countByEnterprise: vi.fn() };
  const carbon = { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), findDefaults: vi.fn(), findByEnergyCode: vi.fn() };
  const completeness = { check: vi.fn().mockResolvedValue(checkResult) };
  return new MasterDataController(dict as any, energy as any, product as any, unit as any, carbon as any, completeness as any);
}

describe('config completeness', () => {
  it('returns incomplete when no configs exist', async () => {
    const controller = createController({
      isComplete: false,
      energyDefinitions: { count: 0, required: 1, complete: false },
      productDefinitions: { count: 0, required: 1, complete: false },
      unitDefinitions: { count: 0, required: 1, complete: false },
      missingItems: ['至少需要配置1个能源品种定义', '至少需要配置1个产品定义', '至少需要配置1个单元定义'],
    });
    const result = await controller.getConfigCompleteness('ent-1');
    expect(result.isComplete).toBe(false);
    expect(result.missingItems.length).toBe(3);
  });

  it('returns complete when all configs exist', async () => {
    const controller = createController({
      isComplete: true,
      energyDefinitions: { count: 2, required: 1, complete: true },
      productDefinitions: { count: 1, required: 1, complete: true },
      unitDefinitions: { count: 3, required: 1, complete: true },
      missingItems: [],
    });
    const result = await controller.getConfigCompleteness('ent-1');
    expect(result.isComplete).toBe(true);
    expect(result.missingItems.length).toBe(0);
    expect(result.energyDefinitions.count).toBe(2);
    expect(result.unitDefinitions.count).toBe(3);
  });

  it('returns partial missing items', async () => {
    const controller = createController({
      isComplete: false,
      energyDefinitions: { count: 1, required: 1, complete: true },
      productDefinitions: { count: 0, required: 1, complete: false },
      unitDefinitions: { count: 0, required: 1, complete: false },
      missingItems: ['至少需要配置1个产品定义', '至少需要配置1个单元定义'],
    });
    const result = await controller.getConfigCompleteness('ent-1');
    expect(result.isComplete).toBe(false);
    expect(result.missingItems.length).toBe(2);
    expect(result.energyDefinitions.complete).toBe(true);
    expect(result.productDefinitions.complete).toBe(false);
  });
});

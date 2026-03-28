import { describe, expect, it, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { MasterDataController } from '../../src/modules/master-data/master-data.controller';
import { EnergyDefinitionService } from '../../src/modules/master-data/energy-definition.service';

function createController(overrides: Record<string, unknown> = {}) {
  const dict = { findByCategory: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), ...overrides.dict as object };
  const energy = { findByEnterprise: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), countByEnterprise: vi.fn(), ...overrides.energy as object };
  const product = { findByEnterprise: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), countByEnterprise: vi.fn(), ...overrides.product as object };
  const unit = { findByEnterprise: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), countByEnterprise: vi.fn(), ...overrides.unit as object };
  const carbon = { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), findDefaults: vi.fn(), findByEnergyCode: vi.fn(), ...overrides.carbon as object };
  const completeness = { check: vi.fn(), ...overrides.completeness as object };
  return new MasterDataController(dict as any, energy as any, product as any, unit as any, carbon as any, completeness as any);
}

describe('master-data validation', () => {
  it('createDictionary delegates to service', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'dict-1', category: 'industry', code: 'test_code', name: '测试行业' });
    const controller = createController({ dict: { create: mockCreate } });
    const result = await controller.createDictionary({ category: 'industry', code: 'test_code', name: '测试行业' });
    expect(result.category).toBe('industry');
    expect(result.name).toBe('测试行业');
    expect(mockCreate).toHaveBeenCalledWith({ category: 'industry', code: 'test_code', name: '测试行业' });
  });

  it('getDictionaries returns items by category', async () => {
    const treeData = [{ id: 'dict-1', code: 'manufacturing', name: '制造业', children: [] }];
    const mockFind = vi.fn().mockResolvedValue(treeData);
    const controller = createController({ dict: { findByCategory: mockFind } });
    const result = await controller.getDictionaries('industry');
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].name).toBe('制造业');
    expect(mockFind).toHaveBeenCalledWith('industry');
  });

  it('energy definition service rejects negative conversion factor', () => {
    const service = new EnergyDefinitionService({} as any);
    expect(() => (service as any).validateConversionFactor('-1')).toThrow(HttpException);
    expect(() => (service as any).validateConversionFactor('-1')).toThrow('折标系数必须为正数');
  });

  it('energy definition service rejects non-numeric conversion factor', () => {
    const service = new EnergyDefinitionService({} as any);
    expect(() => (service as any).validateConversionFactor('abc')).toThrow('折标系数必须为正数');
  });

  it('energy definition service accepts valid conversion factor', () => {
    const service = new EnergyDefinitionService({} as any);
    expect(() => (service as any).validateConversionFactor('0.7143')).not.toThrow();
  });

  it('createEnergyDefinition delegates to service', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'edef-1', name: '原煤' });
    const controller = createController({ energy: { create: mockCreate } });
    const result = await controller.createEnergyDefinition('ent-1', { energyCode: 'coal', name: '原煤', energyType: 'primary', conversionFactor: '0.7143', measurementUnit: '吨' });
    expect(result.name).toBe('原煤');
    expect(mockCreate).toHaveBeenCalledWith('ent-1', expect.objectContaining({ energyCode: 'coal' }));
  });

  it('createProductDefinition delegates to service', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'pdef-1', name: '钢板' });
    const controller = createController({ product: { create: mockCreate } });
    const result = await controller.createProductDefinition('ent-1', { productCode: 'steel', name: '钢板', measurementUnit: '吨' });
    expect(result.name).toBe('钢板');
  });

  it('createUnitDefinition delegates to service', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'udef-1', name: '一号车间' });
    const controller = createController({ unit: { create: mockCreate } });
    const result = await controller.createUnitDefinition('ent-1', { unitCode: 'workshop_1', name: '一号车间', unitType: 'production' });
    expect(result.name).toBe('一号车间');
  });
});

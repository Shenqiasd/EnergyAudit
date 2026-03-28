import { describe, expect, it, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { MasterDataController } from '../../src/modules/master-data/master-data.controller';
import { CarbonEmissionFactorService } from '../../src/modules/master-data/carbon-emission-factor.service';

function createController(carbonOverrides: Record<string, unknown> = {}) {
  const dict = { findByCategory: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };
  const energy = { findByEnterprise: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), countByEnterprise: vi.fn() };
  const product = { findByEnterprise: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), countByEnterprise: vi.fn() };
  const unit = { findByEnterprise: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), countByEnterprise: vi.fn() };
  const carbon = { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), findDefaults: vi.fn(), findByEnergyCode: vi.fn(), ...carbonOverrides };
  const completeness = { check: vi.fn() };
  return new MasterDataController(dict as any, energy as any, product as any, unit as any, carbon as any, completeness as any);
}

describe('carbon emission factor', () => {
  it('createCarbonEmissionFactor delegates to service', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: 'cef-1', energyCode: 'coal', name: '原煤', emissionFactor: '1.9003',
      oxidationRate: '0.98', applicableYear: 2026, isDefault: true,
    });
    const controller = createController({ create: mockCreate });
    const result = await controller.createCarbonEmissionFactor({
      energyCode: 'coal', name: '原煤', emissionFactor: '1.9003', oxidationRate: '0.98',
      standardSource: 'GB/T 2589-2020', applicableYear: 2026, measurementUnit: 'tCO2/t', isDefault: true,
    });
    expect(result.energyCode).toBe('coal');
    expect(result.isDefault).toBe(true);
  });

  it('service rejects negative emission factor', () => {
    const service = new CarbonEmissionFactorService({} as any);
    expect(() => (service as any).validateFactor('-0.5')).toThrow(HttpException);
    expect(() => (service as any).validateFactor('-0.5')).toThrow('排放因子必须为正数');
  });

  it('service rejects oxidation rate > 1', () => {
    const service = new CarbonEmissionFactorService({} as any);
    expect(() => (service as any).validateOxidationRate('1.5')).toThrow(HttpException);
    expect(() => (service as any).validateOxidationRate('1.5')).toThrow('氧化率必须在0到1之间');
  });

  it('service accepts valid oxidation rate', () => {
    const service = new CarbonEmissionFactorService({} as any);
    expect(() => (service as any).validateOxidationRate('0.98')).not.toThrow();
  });

  it('getCarbonEmissionFactors returns all factors', async () => {
    const mockFactors = [
      { id: 'cef-1', energyCode: 'coal', name: '原煤' },
      { id: 'cef-2', energyCode: 'gas', name: '天然气' },
    ];
    const mockFindAll = vi.fn().mockResolvedValue(mockFactors);
    const controller = createController({ findAll: mockFindAll });
    const result = await controller.getCarbonEmissionFactors();
    expect(result.length).toBe(2);
    expect(mockFindAll).toHaveBeenCalledWith(undefined);
  });

  it('getCarbonEmissionFactors passes year filter', async () => {
    const mockFindAll = vi.fn().mockResolvedValue([]);
    const controller = createController({ findAll: mockFindAll });
    await controller.getCarbonEmissionFactors('2026');
    expect(mockFindAll).toHaveBeenCalledWith(2026);
  });

  it('updateCarbonEmissionFactor delegates to service', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ id: 'cef-1', name: '更新后的原煤', emissionFactor: '2.0' });
    const controller = createController({ update: mockUpdate });
    const result = await controller.updateCarbonEmissionFactor('cef-1', { name: '更新后的原煤', emissionFactor: '2.0' });
    expect(result.name).toBe('更新后的原煤');
    expect(mockUpdate).toHaveBeenCalledWith('cef-1', { name: '更新后的原煤', emissionFactor: '2.0' });
  });
});

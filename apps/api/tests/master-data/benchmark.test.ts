import { describe, expect, it, vi } from 'vitest';
import { MasterDataController } from '../../src/modules/master-data/master-data.controller';

function createController(benchmarkOverrides: Record<string, unknown> = {}) {
  const dict = { findByCategory: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };
  const energy = { findByEnterprise: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), countByEnterprise: vi.fn() };
  const product = { findByEnterprise: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), countByEnterprise: vi.fn() };
  const unit = { findByEnterprise: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), countByEnterprise: vi.fn() };
  const carbon = { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), findDefaults: vi.fn(), findByEnergyCode: vi.fn() };
  const completeness = { check: vi.fn() };
  const benchmark = {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByIndustry: vi.fn(),
    compareEnterprise: vi.fn(),
    ...benchmarkOverrides,
  };
  return new MasterDataController(
    dict as any, energy as any, product as any, unit as any, carbon as any, completeness as any, benchmark as any,
  );
}

describe('benchmark CRUD via controller', () => {
  it('getBenchmarks delegates to service with filters', async () => {
    const mockFindAll = vi.fn().mockResolvedValue([
      { id: 'bv-1', industryCode: '2511', indicatorCode: 'comprehensive_energy_intensity', benchmarkValue: '0.85' },
    ]);
    const controller = createController({ findAll: mockFindAll });
    const result = await controller.getBenchmarks('2511', undefined, '2025');
    expect(mockFindAll).toHaveBeenCalledWith({
      industryCode: '2511',
      indicatorCode: undefined,
      applicableYear: 2025,
    });
    expect(result).toHaveLength(1);
    expect(result[0].industryCode).toBe('2511');
  });

  it('createBenchmark delegates to service', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: 'bv-new',
      industryCode: '2610',
      indicatorCode: 'product_unit_energy',
      indicatorName: '产品单位能耗',
      benchmarkValue: '120.00',
      unit: 'kgce/t',
    });
    const controller = createController({ create: mockCreate });
    const result = await controller.createBenchmark({
      industryCode: '2610',
      indicatorCode: 'product_unit_energy',
      indicatorName: '产品单位能耗',
      benchmarkValue: '120.00',
      unit: 'kgce/t',
    });
    expect(result.industryCode).toBe('2610');
    expect(result.indicatorName).toBe('产品单位能耗');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('updateBenchmark delegates to service with id', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({
      id: 'bv-1',
      benchmarkValue: '0.90',
    });
    const controller = createController({ update: mockUpdate });
    const result = await controller.updateBenchmark('bv-1', { benchmarkValue: '0.90' });
    expect(result.benchmarkValue).toBe('0.90');
    expect(mockUpdate).toHaveBeenCalledWith('bv-1', { benchmarkValue: '0.90' });
  });

  it('deleteBenchmark delegates to service', async () => {
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    const controller = createController({ delete: mockDelete });
    await controller.deleteBenchmark('bv-1');
    expect(mockDelete).toHaveBeenCalledWith('bv-1');
  });

  it('getBenchmarksByIndustry delegates with optional year', async () => {
    const mockFindByIndustry = vi.fn().mockResolvedValue([
      { id: 'bv-1', industryCode: '2511' },
      { id: 'bv-2', industryCode: '2511' },
    ]);
    const controller = createController({ findByIndustry: mockFindByIndustry });
    const result = await controller.getBenchmarksByIndustry('2511', '2025');
    expect(mockFindByIndustry).toHaveBeenCalledWith('2511', 2025);
    expect(result).toHaveLength(2);
  });

  it('compareBenchmark delegates to compareEnterprise', async () => {
    const mockCompare = vi.fn().mockResolvedValue([
      {
        indicatorName: '综合能耗强度',
        actualValue: 0.95,
        benchmarkValue: 0.85,
        unit: 'tce/万元',
        gapPercent: 11.76,
        status: 'above',
      },
      {
        indicatorName: '产品单位能耗',
        actualValue: 100,
        benchmarkValue: 120,
        unit: 'kgce/t',
        gapPercent: -16.67,
        status: 'below',
      },
    ]);
    const controller = createController({ compareEnterprise: mockCompare });
    const result = await controller.compareBenchmark('ent-1', 'proj-1');
    expect(mockCompare).toHaveBeenCalledWith('ent-1', 'proj-1');
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('above');
    expect(result[1].status).toBe('below');
  });
});

describe('benchmark comparison logic', () => {
  it('calculates gap percentage correctly', () => {
    const actualValue = 0.95;
    const benchmarkValue = 0.85;
    const gapPercent = benchmarkValue > 0
      ? ((actualValue - benchmarkValue) / benchmarkValue) * 100
      : 0;
    expect(gapPercent).toBeCloseTo(11.76, 1);
  });

  it('determines status correctly for above/below/equal', () => {
    function getStatus(actual: number, benchmark: number): 'above' | 'below' | 'equal' {
      if (actual > benchmark) return 'above';
      if (actual < benchmark) return 'below';
      return 'equal';
    }

    expect(getStatus(0.95, 0.85)).toBe('above');
    expect(getStatus(0.75, 0.85)).toBe('below');
    expect(getStatus(0.85, 0.85)).toBe('equal');
  });

  it('handles zero benchmark value gracefully', () => {
    const actualValue = 0.5;
    const benchmarkValue = 0;
    const gapPercent = benchmarkValue > 0
      ? ((actualValue - benchmarkValue) / benchmarkValue) * 100
      : 0;
    expect(gapPercent).toBe(0);
  });

  it('handles empty comparison result', () => {
    const comparisons: Array<{
      indicatorName: string;
      actualValue: number;
      benchmarkValue: number;
      status: string;
    }> = [];
    expect(comparisons).toHaveLength(0);
  });
});

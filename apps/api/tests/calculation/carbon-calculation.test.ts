import { describe, expect, it } from 'vitest';

import { CarbonCalculationService } from '../../src/modules/calculation/carbon-calculation.service';

function createServiceWithFactors(factors: Array<Record<string, unknown>>) {
  const mockDb = {
    select: () => ({
      from: () => ({
        where: () => factors,
      }),
    }),
  };
  return new CarbonCalculationService(mockDb as never);
}

describe('carbon calculation', () => {
  it('calculates per-fuel carbon emissions', async () => {
    const service = createServiceWithFactors([
      { energyCode: 'coal', name: '原煤', emissionFactor: '1.9003', oxidationRate: '0.98', measurementUnit: 'tCO2/t', isActive: true },
      { energyCode: 'gas', name: '天然气', emissionFactor: '2.1622', oxidationRate: '0.99', measurementUnit: 'tCO2/万m3', isActive: true },
    ]);

    const result = await service.calculateCarbonEmissions([
      { fieldCode: 'coal_consumption', finalValue: '1000', rawValue: null },
      { fieldCode: 'gas_consumption', finalValue: '50', rawValue: null },
    ]);

    expect(result.items.length).toBe(2);

    const coalItem = result.items.find((i) => i.energyCode === 'coal');
    expect(coalItem).toBeDefined();
    // 1000 * 1.9003 * 0.98 = 1862.294
    expect(coalItem!.emission).toBeCloseTo(1862.294, 1);

    const gasItem = result.items.find((i) => i.energyCode === 'gas');
    expect(gasItem).toBeDefined();
    // 50 * 2.1622 * 0.99 = 107.0289
    expect(gasItem!.emission).toBeCloseTo(107.0289, 1);
  });

  it('sums total organizational carbon footprint', async () => {
    const service = createServiceWithFactors([
      { energyCode: 'coal', name: '原煤', emissionFactor: '1.9003', oxidationRate: '0.98', measurementUnit: 'tCO2/t', isActive: true },
      { energyCode: 'gas', name: '天然气', emissionFactor: '2.1622', oxidationRate: '0.99', measurementUnit: 'tCO2/万m3', isActive: true },
    ]);

    const result = await service.calculateCarbonEmissions([
      { fieldCode: 'coal_consumption', finalValue: '1000', rawValue: null },
      { fieldCode: 'gas_consumption', finalValue: '50', rawValue: null },
    ]);

    // total = 1862.294 + 107.0289 = 1969.3229
    expect(result.totalEmission).toBeCloseTo(1969.3229, 1);
    expect(result.totalEmission).toBe(
      result.items.reduce((sum, i) => sum + i.emission, 0),
    );
  });

  it('uses correct emission factors from database', async () => {
    const service = createServiceWithFactors([
      { energyCode: 'coal', name: '原煤', emissionFactor: '2.5', oxidationRate: '0.9', measurementUnit: 'tCO2/t', isActive: true },
    ]);

    const result = await service.calculateCarbonEmissions([
      { fieldCode: 'coal_consumption', finalValue: '100', rawValue: null },
    ]);

    expect(result.items[0].emissionFactor).toBe(2.5);
    expect(result.items[0].oxidationRate).toBe(0.9);
    // 100 * 2.5 * 0.9 = 225
    expect(result.items[0].emission).toBeCloseTo(225, 2);
  });

  it('handles zero/null activity data', async () => {
    const service = createServiceWithFactors([
      { energyCode: 'coal', name: '原煤', emissionFactor: '1.9003', oxidationRate: '0.98', measurementUnit: 'tCO2/t', isActive: true },
    ]);

    // Null activity data
    const result1 = await service.calculateCarbonEmissions([
      { fieldCode: 'coal_consumption', finalValue: null, rawValue: null },
    ]);
    expect(result1.items.length).toBe(0);
    expect(result1.totalEmission).toBe(0);

    // Zero activity data
    const result2 = await service.calculateCarbonEmissions([
      { fieldCode: 'coal_consumption', finalValue: '0', rawValue: null },
    ]);
    expect(result2.items.length).toBe(0);
    expect(result2.totalEmission).toBe(0);

    // Empty data items
    const result3 = await service.calculateCarbonEmissions([]);
    expect(result3.items.length).toBe(0);
    expect(result3.totalEmission).toBe(0);
  });
});

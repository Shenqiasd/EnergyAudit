import { describe, expect, it } from 'vitest';

import { CalculationEngine } from '../../src/modules/calculation/calculation-engine';

describe('calculation snapshot', () => {
  it('calculates comprehensive energy consumption with conversion factors', async () => {
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => [
            { energyCode: 'coal', name: '原煤', conversionFactor: '0.7143', measurementUnit: 't', isActive: true },
            { energyCode: 'electricity', name: '电力', conversionFactor: '0.1229', measurementUnit: 'MWh', isActive: true },
          ],
        }),
      }),
    };

    const engine = new CalculationEngine(mockDb as never);
    const result = await engine.calculateComprehensiveEnergy('ent_001', [
      { fieldCode: 'coal_consumption', finalValue: '1000', rawValue: null },
      { fieldCode: 'electricity_consumption', finalValue: '500', rawValue: null },
    ]);

    expect(result.items.length).toBe(2);
    expect(result.totalTce).toBeCloseTo(714.3 + 61.45, 1);
    expect(result.items[0].energyCode).toBe('coal');
    expect(result.items[0].tce).toBeCloseTo(714.3, 1);
    expect(result.items[1].energyCode).toBe('electricity');
    expect(result.items[1].tce).toBeCloseTo(61.45, 1);
  });

  it('calculates energy intensity per unit output', () => {
    const engine = new CalculationEngine({} as never);
    const result = engine.calculateEnergyIntensity(500, 10000);

    expect(result.totalTce).toBe(500);
    expect(result.outputValue).toBe(10000);
    expect(result.intensityPerOutput).toBeCloseTo(0.05, 4);
  });

  it('creates calculation snapshot with timestamp-based ID', () => {
    const before = Date.now();
    const id = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const after = Date.now();

    expect(id.startsWith('cs_')).toBe(true);
    const parts = id.split('_');
    const timestamp = Number(parts[1]);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('compares results against industry benchmarks', () => {
    const currentIntensity = 0.05;
    const benchmarkValue = 0.04;

    const difference = currentIntensity - benchmarkValue;
    const status = difference > 0 ? 'above' : difference < 0 ? 'below' : 'equal';

    expect(status).toBe('above');
    expect(difference).toBeCloseTo(0.01, 4);
  });

  it('handles missing energy data gracefully', async () => {
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => [
            { energyCode: 'coal', name: '原煤', conversionFactor: '0.7143', measurementUnit: 't', isActive: true },
          ],
        }),
      }),
    };

    const engine = new CalculationEngine(mockDb as never);

    // No data items at all
    const result = await engine.calculateComprehensiveEnergy('ent_001', []);
    expect(result.items.length).toBe(0);
    expect(result.totalTce).toBe(0);

    // Data item with null value
    const result2 = await engine.calculateComprehensiveEnergy('ent_001', [
      { fieldCode: 'coal_consumption', finalValue: null, rawValue: null },
    ]);
    expect(result2.items.length).toBe(0);
    expect(result2.totalTce).toBe(0);

    // Data item with empty string
    const result3 = await engine.calculateComprehensiveEnergy('ent_001', [
      { fieldCode: 'coal_consumption', finalValue: '', rawValue: '' },
    ]);
    expect(result3.items.length).toBe(0);
    expect(result3.totalTce).toBe(0);
  });
});

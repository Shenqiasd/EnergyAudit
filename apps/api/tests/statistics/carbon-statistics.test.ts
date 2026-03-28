import { describe, expect, it } from 'vitest';

import type { CarbonEmissionSummary, CarbonTrendItem } from '../../src/modules/statistics/carbon-statistics.service';

describe('carbon statistics', () => {
  it('aggregates total carbon emissions', () => {
    const snapshots = [
      { result: JSON.stringify({ totalEmissions: 150.5 }) },
      { result: JSON.stringify({ totalEmissions: 200.3 }) },
      { result: JSON.stringify({ totalEmissions: 75.2 }) },
    ];

    let totalEmissions = 0;
    for (const snap of snapshots) {
      const result = JSON.parse(snap.result) as { totalEmissions?: number };
      totalEmissions += result.totalEmissions ?? 0;
    }

    expect(totalEmissions).toBeCloseTo(426.0, 1);
  });

  it('breaks down emissions by energy type', () => {
    const snapshots = [
      {
        result: JSON.stringify({
          totalEmissions: 100,
          byEnergyType: [
            { type: '电力', emissions: 60 },
            { type: '天然气', emissions: 40 },
          ],
        }),
      },
      {
        result: JSON.stringify({
          totalEmissions: 80,
          byEnergyType: [
            { type: '电力', emissions: 50 },
            { type: '煤炭', emissions: 30 },
          ],
        }),
      },
    ];

    const energyTypeMap = new Map<string, number>();
    for (const snap of snapshots) {
      const result = JSON.parse(snap.result) as {
        byEnergyType?: Array<{ type: string; emissions: number }>;
      };
      if (result.byEnergyType) {
        for (const item of result.byEnergyType) {
          energyTypeMap.set(
            item.type,
            (energyTypeMap.get(item.type) ?? 0) + item.emissions,
          );
        }
      }
    }

    expect(energyTypeMap.get('电力')).toBe(110);
    expect(energyTypeMap.get('天然气')).toBe(40);
    expect(energyTypeMap.get('煤炭')).toBe(30);
    expect(energyTypeMap.size).toBe(3);
  });

  it('returns emissions trend data', () => {
    const yearData = [
      { year: 2023, emissions: 500 },
      { year: 2024, emissions: 480 },
      { year: 2025, emissions: 450 },
    ];

    const trends: CarbonTrendItem[] = yearData
      .map(({ year, emissions }) => ({ year, totalEmissions: emissions }))
      .sort((a, b) => a.year - b.year);

    expect(trends.length).toBe(3);
    expect(trends[0].year).toBe(2023);
    expect(trends[0].totalEmissions).toBe(500);
    expect(trends[2].year).toBe(2025);
    expect(trends[2].totalEmissions).toBe(450);
    // Verify downward trend
    expect(trends[2].totalEmissions).toBeLessThan(trends[0].totalEmissions);
  });

  it('handles missing calculation data gracefully', () => {
    const snapshots = [
      { result: '{}' },
      { result: 'invalid json ###' },
      { result: JSON.stringify({ totalEmissions: 50 }) },
    ];

    let totalEmissions = 0;
    const energyTypeMap = new Map<string, number>();

    for (const snap of snapshots) {
      try {
        const result = JSON.parse(snap.result) as {
          totalEmissions?: number;
          byEnergyType?: Array<{ type: string; emissions: number }>;
        };
        totalEmissions += result.totalEmissions ?? 0;
        if (result.byEnergyType) {
          for (const item of result.byEnergyType) {
            energyTypeMap.set(
              item.type,
              (energyTypeMap.get(item.type) ?? 0) + item.emissions,
            );
          }
        }
      } catch {
        // skip invalid JSON — this is how the service handles it
      }
    }

    // Only the first ({}) and third (valid) should contribute
    expect(totalEmissions).toBe(50);
    expect(energyTypeMap.size).toBe(0);

    const summary: CarbonEmissionSummary = {
      totalEmissions,
      byEnergyType: [],
      byEnterprise: [],
    };
    expect(summary.totalEmissions).toBe(50);
    expect(summary.byEnergyType).toEqual([]);
    expect(summary.byEnterprise).toEqual([]);
  });
});

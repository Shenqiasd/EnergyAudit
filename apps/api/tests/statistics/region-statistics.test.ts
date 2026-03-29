import { describe, expect, it } from 'vitest';

describe('region statistics', () => {
  it('aggregates enterprises by region', () => {
    const enterprises = [
      { regionCode: 'east', regionName: '华东', province: '上海', city: '上海市' },
      { regionCode: 'east', regionName: '华东', province: '江苏', city: '南京市' },
      { regionCode: 'east', regionName: '华东', province: '浙江', city: '杭州市' },
      { regionCode: 'south', regionName: '华南', province: '广东', city: '广州市' },
      { regionCode: 'south', regionName: '华南', province: '广东', city: '深圳市' },
      { regionCode: 'north', regionName: '华北', province: '北京', city: '北京市' },
    ];

    const regionMap = new Map<string, { regionCode: string; regionName: string; enterpriseCount: number }>();
    for (const ent of enterprises) {
      if (!ent.regionCode) continue;
      const existing = regionMap.get(ent.regionCode);
      if (existing) {
        existing.enterpriseCount += 1;
      } else {
        regionMap.set(ent.regionCode, {
          regionCode: ent.regionCode,
          regionName: ent.regionName,
          enterpriseCount: 1,
        });
      }
    }
    const distribution = Array.from(regionMap.values());

    expect(distribution).toHaveLength(3);
    expect(distribution.find((d) => d.regionCode === 'east')?.enterpriseCount).toBe(3);
    expect(distribution.find((d) => d.regionCode === 'south')?.enterpriseCount).toBe(2);
    expect(distribution.find((d) => d.regionCode === 'north')?.enterpriseCount).toBe(1);
  });

  it('ranks regions by enterprise count', () => {
    const distribution = [
      { regionName: '华东', enterpriseCount: 3 },
      { regionName: '华南', enterpriseCount: 2 },
      { regionName: '华北', enterpriseCount: 1 },
    ];

    const ranked = [...distribution].sort((a, b) => b.enterpriseCount - a.enterpriseCount);

    expect(ranked[0].regionName).toBe('华东');
    expect(ranked[1].regionName).toBe('华南');
    expect(ranked[2].regionName).toBe('华北');
  });

  it('limits ranking results', () => {
    const distribution = [
      { regionName: '华东', enterpriseCount: 3 },
      { regionName: '华南', enterpriseCount: 2 },
      { regionName: '华北', enterpriseCount: 1 },
      { regionName: '西南', enterpriseCount: 4 },
      { regionName: '东北', enterpriseCount: 1 },
    ];

    const ranked = [...distribution]
      .sort((a, b) => b.enterpriseCount - a.enterpriseCount)
      .slice(0, 3);

    expect(ranked).toHaveLength(3);
    expect(ranked[0].regionName).toBe('西南');
    expect(ranked[2].regionName).toBe('华南');
  });

  it('breaks down province for a region', () => {
    const enterprises = [
      { regionCode: 'east', province: '上海', city: '上海市' },
      { regionCode: 'east', province: '江苏', city: '南京市' },
      { regionCode: 'east', province: '江苏', city: '苏州市' },
      { regionCode: 'east', province: '浙江', city: '杭州市' },
    ];

    const filtered = enterprises.filter((e) => e.regionCode === 'east');
    const provinceMap = new Map<string, { province: string; city: string | null; enterpriseCount: number }>();

    for (const ent of filtered) {
      const key = `${ent.province}-${ent.city}`;
      const existing = provinceMap.get(key);
      if (existing) {
        existing.enterpriseCount += 1;
      } else {
        provinceMap.set(key, {
          province: ent.province,
          city: ent.city,
          enterpriseCount: 1,
        });
      }
    }

    const breakdown = Array.from(provinceMap.values());
    expect(breakdown).toHaveLength(4);
    expect(breakdown.find((b) => b.city === '南京市')?.province).toBe('江苏');
  });

  it('calculates compliance rate by region', () => {
    const projects = [
      { regionCode: 'east', regionName: '华东', status: 'completed' },
      { regionCode: 'east', regionName: '华东', status: 'closed' },
      { regionCode: 'east', regionName: '华东', status: 'in_progress' },
      { regionCode: 'south', regionName: '华南', status: 'completed' },
      { regionCode: 'south', regionName: '华南', status: 'filing' },
    ];

    const regionProjects = new Map<
      string,
      { regionName: string; totalProjects: number; completedProjects: number }
    >();
    for (const p of projects) {
      const existing = regionProjects.get(p.regionCode);
      const isCompleted = p.status === 'completed' || p.status === 'closed';
      if (existing) {
        existing.totalProjects += 1;
        if (isCompleted) existing.completedProjects += 1;
      } else {
        regionProjects.set(p.regionCode, {
          regionName: p.regionName,
          totalProjects: 1,
          completedProjects: isCompleted ? 1 : 0,
        });
      }
    }

    const compliance = Array.from(regionProjects.values()).map((r) => ({
      ...r,
      complianceRate: r.totalProjects > 0 ? r.completedProjects / r.totalProjects : 0,
    }));

    const east = compliance.find((c) => c.regionName === '华东');
    expect(east?.totalProjects).toBe(3);
    expect(east?.completedProjects).toBe(2);
    expect(east?.complianceRate).toBeCloseTo(0.667, 2);

    const south = compliance.find((c) => c.regionName === '华南');
    expect(south?.totalProjects).toBe(2);
    expect(south?.completedProjects).toBe(1);
    expect(south?.complianceRate).toBe(0.5);
  });

  it('handles region with no enterprises', () => {
    const enterprises: Array<{ regionCode: string }> = [];
    const regionMap = new Map<string, number>();
    for (const ent of enterprises) {
      if (!ent.regionCode) continue;
      regionMap.set(ent.regionCode, (regionMap.get(ent.regionCode) ?? 0) + 1);
    }
    expect(regionMap.size).toBe(0);
  });

  it('handles enterprises with null region', () => {
    const enterprises = [
      { regionCode: null, regionName: null, province: null, city: null },
      { regionCode: 'east', regionName: '华东', province: '上海', city: '上海市' },
    ];

    const withRegion = enterprises.filter((e) => e.regionCode !== null);
    expect(withRegion).toHaveLength(1);
    expect(withRegion[0].regionCode).toBe('east');
  });
});

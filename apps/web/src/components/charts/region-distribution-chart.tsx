"use client";

import { ChartContainer } from "./chart-container";

interface RegionDataItem {
  regionCode: string;
  regionName: string;
  enterpriseCount: number;
  totalEnergyConsumption: number;
}

interface RegionDistributionChartProps {
  title: string;
  data: RegionDataItem[];
  onClick?: (regionCode: string) => void;
}

const BAR_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

export function RegionDistributionChart({
  title,
  data,
  onClick,
}: RegionDistributionChartProps) {
  if (data.length === 0) {
    return (
      <ChartContainer title={title}>
        <div className="flex h-48 items-center justify-center text-sm         text-[hsl(var(--muted-foreground))]">
                  暂无区域数据
        </div>
      </ChartContainer>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.enterpriseCount), 1);

  return (
    <ChartContainer title={title}>
      <div className="space-y-2">
        {data.map((d, i) => {
          const pct = (d.enterpriseCount / maxCount) * 100;
          const color = BAR_COLORS[i % BAR_COLORS.length];

          return (
            <div
              key={i}
              className="flex items-center gap-3 cursor-pointer hover:bg-[hsl(var(--muted))] rounded p-1 transition-colors"
              onClick={() => onClick?.(d.regionCode)}
            >
              <span className="w-20 truncate text-sm text-[hsl(var(--foreground))]">
                {d.regionName}
              </span>
              <div className="flex-1 h-6 rounded bg-[hsl(var(--muted))] relative">
                <div
                  className="h-full rounded transition-all duration-300"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <span className="w-16 text-right text-sm font-mono text-[hsl(var(--foreground))]">
                {d.enterpriseCount} 家
              </span>
            </div>
          );
        })}
      </div>
    </ChartContainer>
  );
}

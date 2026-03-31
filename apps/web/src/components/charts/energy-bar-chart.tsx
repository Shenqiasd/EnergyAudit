"use client";

import { ChartContainer } from "./chart-container";

interface BarDataItem {
  label: string;
  value: number;
  color?: string;
}

interface EnergyBarChartProps {
  title: string;
  data: BarDataItem[];
  xAxis?: string;
  yAxis?: string;
}

const DEFAULT_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

export function EnergyBarChart({ title, data, xAxis, yAxis }: EnergyBarChartProps) {
  if (data.length === 0) {
    return (
      <ChartContainer title={title}>
        <div className="flex h-48 items-center justify-center text-sm         text-[hsl(var(--muted-foreground))]">
                  暂无数据
        </div>
      </ChartContainer>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(30, Math.min(60, 400 / data.length));

  return (
    <ChartContainer title={title}>
      <div className="flex flex-col">
        {yAxis && (
          <div className="mb-1 text-xs text-[hsl(var(--muted-foreground))]">{yAxis}</div>
        )}
        <div className="flex items-end gap-2" style={{ height: 180 }}>
          {data.map((d, i) => {
            const heightPct = (d.value / maxValue) * 100;
            const color = d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            return (
              <div key={i} className="flex flex-col items-center gap-1" style={{ width: barWidth }}>
                <span className=                "text-xs text-[hsl(var(--muted-foreground))]">
                                  {d.value.toFixed(1)}
                </span>
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${Math.max(heightPct, 2)}%`,
                    backgroundColor: color,
                    minHeight: 4,
                  }}
                />
                <span className="mt-1 text-xs text-[hsl(var(--foreground))] truncate w-full text-center">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
        {xAxis && (
          <div className="mt-2 text-center text-xs text-[hsl(var(--muted-foreground))]">{xAxis}</div>
        )}
      </div>
    </ChartContainer>
  );
}

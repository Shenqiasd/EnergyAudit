"use client";

import { ChartContainer } from "./chart-container";

interface PieDataItem {
  label: string;
  value: number;
  color?: string;
}

interface EnergyPieChartProps {
  title: string;
  data: PieDataItem[];
}

const DEFAULT_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

export function EnergyPieChart({ title, data }: EnergyPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0 || data.length === 0) {
    return (
      <ChartContainer title={title}>
        <div className="flex h-48 items-center justify-center text-sm text-[var(--color-text-secondary)]">
          暂无数据
        </div>
      </ChartContainer>
    );
  }

  // Build SVG pie chart
  let cumulativeAngle = 0;
  const slices = data.map((d, i) => {
    const percentage = d.value / total;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + percentage * 360;
    cumulativeAngle = endAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = 100 + 80 * Math.cos(startRad);
    const y1 = 100 + 80 * Math.sin(startRad);
    const x2 = 100 + 80 * Math.cos(endRad);
    const y2 = 100 + 80 * Math.sin(endRad);

    const largeArc = percentage > 0.5 ? 1 : 0;
    const color = d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];

    const pathD = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { pathD, color, label: d.label, percentage, value: d.value };
  });

  return (
    <ChartContainer title={title}>
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 200 200" className="h-48 w-48 shrink-0">
          {slices.map((s, i) => (
            <path key={i} d={s.pathD} fill={s.color} stroke="white" strokeWidth="1" />
          ))}
        </svg>
        <div className="space-y-1.5">
          {slices.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[var(--color-text)]">{s.label}</span>
              <span className="text-[var(--color-text-secondary)]">
                {(s.percentage * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartContainer>
  );
}

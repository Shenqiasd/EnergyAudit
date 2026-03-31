"use client";

import { ChartContainer } from "./chart-container";

interface BenchmarkDataItem {
  indicatorName: string;
  actualValue: number;
  benchmarkValue: number;
  unit: string;
  status: "above" | "below" | "equal";
}

interface BenchmarkBarChartProps {
  title: string;
  data: BenchmarkDataItem[];
}

const STATUS_COLORS = {
  above: "#EF4444",
  below: "#10B981",
  equal: "#9CA3AF",
};

export function BenchmarkBarChart({ title, data }: BenchmarkBarChartProps) {
  if (data.length === 0) {
    return (
      <ChartContainer title={title}>
        <div className="flex h-48 items-center justify-center text-sm         text-[hsl(var(--muted-foreground))]">
                  暂无对标数据
        </div>
      </ChartContainer>
    );
  }

  const maxValue = Math.max(
    ...data.flatMap((d) => [d.actualValue, d.benchmarkValue]),
    1,
  );

  return (
    <ChartContainer title={title}>
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "#3B82F6" }} />
            <span className="text-[hsl(var(--muted-foreground))]">实际值</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "#F59E0B" }} />
            <span className="text-[hsl(var(--muted-foreground))]">对标值</span>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#10B981]" /> 优于对标
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#EF4444]" /> 低于对标
            </span>
          </div>
        </div>

        {/* Bars */}
        <div className="space-y-3">
          {data.map((d, i) => {
            const actualPct = maxValue > 0 ? (d.actualValue / maxValue) * 100 : 0;
            const benchmarkPct = maxValue > 0 ? (d.benchmarkValue / maxValue) * 100 : 0;
            const statusColor = STATUS_COLORS[d.status];

            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className=                  "font-medium text-[hsl(var(--foreground))]">
                                      {d.indicatorName}
                  </span>
                  <span className=                  "text-[hsl(var(--muted-foreground))]">
                                      {d.unit}
                  </span>
                </div>
                {/* Actual bar */}
                <div className="flex items-center gap-2">
                  <span className=                  "w-10 text-right text-xs text-[hsl(var(--muted-foreground))]">
                                      实际
                  </span>
                  <div className="flex-1 h-5 rounded bg-[hsl(var(--muted))] relative">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${Math.max(actualPct, 1)}%`,
                        backgroundColor: statusColor,
                        opacity: 0.8,
                      }}
                    />
                    <span className="absolute right-2 top-0.5 text-xs font-mono">
                      {d.actualValue.toFixed(2)}
                    </span>
                  </div>
                </div>
                {/* Benchmark bar */}
                <div className="flex items-center gap-2">
                  <span className=                  "w-10 text-right text-xs text-[hsl(var(--muted-foreground))]">
                                      对标
                  </span>
                  <div className="flex-1 h-5 rounded bg-[hsl(var(--muted))] relative">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${Math.max(benchmarkPct, 1)}%`,
                        backgroundColor: "#F59E0B",
                        opacity: 0.6,
                      }}
                    />
                    <span className="absolute right-2 top-0.5 text-xs font-mono">
                      {d.benchmarkValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartContainer>
  );
}

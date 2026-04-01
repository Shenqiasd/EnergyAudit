"use client";

import { cn } from "@/lib/utils";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect } from "react";
import type { ElementType } from "react";

const accentColors = {
  blue: {
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    sparkline: "stroke-blue-400",
    dot: "bg-blue-500",
    trendUp: "text-emerald-600 bg-emerald-50",
    trendDown: "text-red-500 bg-red-50",
    trendFlat: "text-slate-500 bg-slate-100",
  },
  green: {
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    sparkline: "stroke-emerald-400",
    dot: "bg-emerald-500",
    trendUp: "text-emerald-600 bg-emerald-50",
    trendDown: "text-red-500 bg-red-50",
    trendFlat: "text-slate-500 bg-slate-100",
  },
  orange: {
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
    sparkline: "stroke-amber-400",
    dot: "bg-amber-500",
    trendUp: "text-emerald-600 bg-emerald-50",
    trendDown: "text-red-500 bg-red-50",
    trendFlat: "text-slate-500 bg-slate-100",
  },
  purple: {
    iconBg: "bg-violet-50",
    iconText: "text-violet-600",
    sparkline: "stroke-violet-400",
    dot: "bg-violet-500",
    trendUp: "text-emerald-600 bg-emerald-50",
    trendDown: "text-red-500 bg-red-50",
    trendFlat: "text-slate-500 bg-slate-100",
  },
};

interface StatCardProps {
  icon: ElementType;
  label: string;
  value: number;
  trend?: {
    direction: "up" | "down" | "flat";
    value: string;
    text: string;
  };
  sparklineData?: number[];
  accentColor?: keyof typeof accentColors;
  className?: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    Math.round(latest).toLocaleString(),
  );

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.0,
      ease: "easeOut",
    });
    return controls.stop;
  }, [motionValue, value]);

  return <motion.span>{rounded}</motion.span>;
}

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 72;
  const height = 28;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="opacity-60"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      />
    </svg>
  );
}

const trendIconMap = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  sparklineData,
  accentColor = "blue",
  className,
}: StatCardProps) {
  const colors = accentColors[accentColor];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3.5 flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", colors.iconBg)}>
              <Icon className={cn("h-4.5 w-4.5", colors.iconText)} size={18} />
            </div>
            <span className="text-sm text-[hsl(var(--muted-foreground))] font-medium truncate">
              {label}
            </span>
          </div>

          <div className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            <AnimatedNumber value={value} />
          </div>

          {trend && (
            <div className="flex items-center gap-1.5">
              {(() => {
                const TrendIcon = trendIconMap[trend.direction];
                const colorClass =
                  trend.direction === "up"
                    ? colors.trendUp
                    : trend.direction === "down"
                    ? colors.trendDown
                    : colors.trendFlat;
                return (
                  <>
                    <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold", colorClass)}>
                      <TrendIcon size={11} />
                      {trend.value}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {trend.text}
                    </span>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {sparklineData && sparklineData.length > 1 && (
          <div className="mt-1 ml-2 shrink-0">
            <Sparkline data={sparklineData} className={colors.sparkline} />
          </div>
        )}
      </div>
    </div>
  );
}

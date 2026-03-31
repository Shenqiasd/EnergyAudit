"use client";

import { cn } from "@/lib/utils";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import type { ElementType } from "react";

const accentColors = {
  blue: {
    bg: "from-blue-50/50 to-blue-100/30 dark:from-blue-900/20 dark:to-transparent",
    border: "border-blue-200/50 dark:border-blue-800/30",
    icon: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50",
    trend: "text-blue-600 dark:text-blue-400",
    sparkline: "stroke-blue-500",
  },
  green: {
    bg: "from-emerald-50/50 to-emerald-100/30 dark:from-emerald-900/20 dark:to-transparent",
    border: "border-emerald-200/50 dark:border-emerald-800/30",
    icon: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50",
    trend: "text-emerald-600 dark:text-emerald-400",
    sparkline: "stroke-emerald-500",
  },
  orange: {
    bg: "from-amber-50/50 to-amber-100/30 dark:from-amber-900/20 dark:to-transparent",
    border: "border-amber-200/50 dark:border-amber-800/30",
    icon: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50",
    trend: "text-amber-600 dark:text-amber-400",
    sparkline: "stroke-amber-500",
  },
  purple: {
    bg: "from-indigo-50/50 to-indigo-100/30 dark:from-indigo-900/20 dark:to-transparent",
    border: "border-indigo-200/50 dark:border-indigo-800/30",
    icon: "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50",
    trend: "text-indigo-600 dark:text-indigo-400",
    sparkline: "stroke-indigo-500",
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
      duration: 1.2,
      ease: "easeOut",
    });
    return controls.stop;
  }, [motionValue, value]);

  return <motion.span>{rounded}</motion.span>;
}

function Sparkline({
  data,
  className,
}: {
  data: number[];
  className?: string;
}) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 32;
  const padding = 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("opacity-60", className)}
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      />
    </svg>
  );
}

const trendIcons: Record<"up" | "down" | "flat", string> = {
  up: "↑",
  down: "↓",
  flat: "→",
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
        "group relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 shadow-sm transition-all hover:shadow-md",
        colors.bg,
        colors.border,
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colors.icon)}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              {label}
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            <AnimatedNumber value={value} />
          </div>
          {trend && (
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span
                className={cn(
                  "flex items-center rounded-md px-1.5 py-0.5",
                  trend.direction === "up" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  trend.direction === "down" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                  trend.direction === "flat" && "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
                )}
              >
                {trendIcons[trend.direction]} {trend.value}
              </span>
              <span className="text-[hsl(var(--muted-foreground))]">
                {trend.text}
              </span>
            </div>
          )}
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <div className="mt-2">
             <Sparkline data={sparklineData} className={colors.sparkline} />
          </div>
        )}
      </div>
    </div>
  );
}

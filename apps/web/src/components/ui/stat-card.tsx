"use client";

import { cn } from "@/lib/utils";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import type { ElementType } from "react";

const accentColors = {
  blue: {
    bg: "from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    trend: "text-blue-600 dark:text-blue-400",
    sparkline: "stroke-blue-500",
  },
  green: {
    bg: "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20",
    icon: "text-emerald-600 dark:text-emerald-400",
    trend: "text-emerald-600 dark:text-emerald-400",
    sparkline: "stroke-emerald-500",
  },
  orange: {
    bg: "from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20",
    icon: "text-orange-600 dark:text-orange-400",
    trend: "text-orange-600 dark:text-orange-400",
    sparkline: "stroke-orange-500",
  },
  purple: {
    bg: "from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20",
    icon: "text-purple-600 dark:text-purple-400",
    trend: "text-purple-600 dark:text-purple-400",
    sparkline: "stroke-purple-500",
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
  up: "\u2191",
  down: "\u2193",
  flat: "\u2192",
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
        "group relative overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-gradient-to-br p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        colors.bg,
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", colors.icon)} />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              {label}
            </span>
          </div>
          <div className="text-2xl font-bold text-[hsl(var(--foreground))]">
            <AnimatedNumber value={value} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              <span
                className={cn(
                  "font-medium",
                  trend.direction === "up" && "text-emerald-600",
                  trend.direction === "down" && "text-red-600",
                  trend.direction === "flat" && "text-[hsl(var(--muted-foreground))]",
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
          <Sparkline data={sparklineData} className={colors.sparkline} />
        )}
      </div>
    </div>
  );
}

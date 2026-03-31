"use client";

import { clsx } from "clsx";
import type { ElementType } from "react";

interface KpiCardProps {
  icon: ElementType;
  label: string;
  value: string | number;
  trend?: {
    direction: "up" | "down" | "neutral";
    text: string;
  };
  className?: string;
}

export function KpiCard({ icon: Icon, label, value, trend, className }: KpiCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10">
          <Icon size={20} className="text-[hsl(var(--primary))]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{value}</p>
        </div>
      </div>
      {trend && (
        <div className="mt-3 text-xs">
          <span
            className={clsx(
              "font-medium",
              trend.direction === "up" && "text-[hsl(var(--success))]",
              trend.direction === "down" && "text-[hsl(var(--danger))]",
              trend.direction === "neutral" && "text-[hsl(var(--muted-foreground))]",
            )}
          >
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}{" "}
            {trend.text}
          </span>
        </div>
      )}
    </div>
  );
}

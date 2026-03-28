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
        "rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-light)]">
          <Icon size={20} className="text-[var(--color-primary)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
          <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
        </div>
      </div>
      {trend && (
        <div className="mt-3 text-xs">
          <span
            className={clsx(
              "font-medium",
              trend.direction === "up" && "text-[var(--color-success)]",
              trend.direction === "down" && "text-[var(--color-danger)]",
              trend.direction === "neutral" && "text-[var(--color-text-secondary)]",
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

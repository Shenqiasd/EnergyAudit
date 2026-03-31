"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LayoutGrid, List, Search } from "lucide-react";
import type { ReactNode } from "react";

interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  viewMode?: "table" | "card";
  onViewModeChange?: (mode: "table" | "card") => void;
  actions?: ReactNode;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "搜索...",
  filters,
  viewMode,
  onViewModeChange,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3",
        className,
      )}
    >
      <div className="relative min-w-[200px] flex-1">
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          startIcon={<Search size={16} />}
        />
      </div>

      {filters?.map((filter) => (
        <div key={filter.key} className="w-40">
          <Select
            options={filter.options}
            value={filter.value ?? ""}
            onChange={(e) => filter.onChange(e.target.value)}
            placeholder={filter.label}
          />
        </div>
      ))}

      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {onViewModeChange && (
        <div className="flex items-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-l-lg transition-colors",
              viewMode === "table"
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
            )}
            title="表格视图"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("card")}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-r-lg transition-colors",
              viewMode === "card"
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
            )}
            title="卡片视图"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

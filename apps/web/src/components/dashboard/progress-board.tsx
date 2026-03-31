"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface ProgressItem {
  label: string;
  value: number;
  total: number;
}

interface ProgressBoardProps {
  title: string;
  items: ProgressItem[];
}

export function ProgressBoard({ title, items }: ProgressBoardProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <div className="flex h-32 items-center justify-center text-sm         text-[hsl(var(--muted-foreground))]">
                  暂无数据
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <div className="space-y-4">
        {items.map((item) => {
          const percentage = item.total > 0 ? (item.value / item.total) * 100 : 0;
          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-[hsl(var(--foreground))]">{item.label}</span>
                <span className=                "text-[hsl(var(--muted-foreground))]">
                                  {item.value}/{item.total} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[hsl(var(--primary))] transition-all"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

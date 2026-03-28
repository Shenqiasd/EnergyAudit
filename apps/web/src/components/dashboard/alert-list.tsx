"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface AlertItem {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  createdAt: string;
}

interface AlertListProps {
  title: string;
  alerts: AlertItem[];
}

const typeLabels: Record<string, string> = {
  overdue_project: "项目超期",
  low_score: "评分偏低",
  delayed_rectification: "整改超期",
};

export function AlertList({ title, alerts }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <div className="flex h-32 items-center justify-center text-sm text-[var(--color-text-secondary)]">
          暂无预警
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <div className="max-h-80 space-y-3 overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] p-3"
          >
            <AlertTriangle
              size={16}
              className={
                alert.severity === "danger"
                  ? "mt-0.5 shrink-0 text-[var(--color-danger)]"
                  : "mt-0.5 shrink-0 text-[var(--color-warning)]"
              }
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {alert.title}
                </span>
                <Badge
                  variant={alert.severity === "danger" ? "danger" : "warning"}
                >
                  {typeLabels[alert.type] ?? alert.type}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                {alert.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

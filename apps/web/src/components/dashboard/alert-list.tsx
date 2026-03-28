"use client";

import Link from "next/link";
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
  relatedId?: string;
}

interface AlertListProps {
  title: string;
  alerts: AlertItem[];
}

const typeLabels: Record<string, string> = {
  overdue_project: "项目超期",
  low_score: "评分偏低",
  delayed_rectification: "整改超期",
  approaching_deadline: "即将到期",
  overdue_batch: "批次超期",
};

const alertLinks: Record<string, (id: string) => string> = {
  overdue_project: (id) => `/manager/projects?highlight=${id}`,
  delayed_rectification: (id) => `/manager/rectifications?highlight=${id}`,
  approaching_deadline: (id) => `/manager/projects?highlight=${id}`,
  overdue_batch: (id) => `/manager/batches/${id}`,
};

function AlertItemWrapper({ href, children }: { href?: string; children: React.ReactNode }) {
  const className = "flex items-start gap-3 rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:bg-[var(--color-bg-secondary)]";
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
}

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
          <AlertItemWrapper
            key={alert.id}
            href={alert.relatedId && alertLinks[alert.type] ? alertLinks[alert.type](alert.relatedId) : undefined}
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
          </AlertItemWrapper>
        ))}
      </div>
    </Card>
  );
}

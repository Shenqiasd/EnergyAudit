"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineItem {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  detail: string | null;
  userId: string;
  userRole: string;
  createdAt: string;
}

interface ActivityTimelineProps {
  title: string;
  items: TimelineItem[];
}

const roleLabels: Record<string, string> = {
  manager: "管理员",
  enterprise_user: "企业用户",
  reviewer: "审核员",
};

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;

    return date.toLocaleDateString("zh-CN");
  } catch {
    return dateStr;
  }
}

export function ActivityTimeline({ title, items }: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <div className="flex h-32 items-center justify-center text-sm         text-[hsl(var(--muted-foreground))]">
                  暂无活动记录
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <div className="max-h-96 space-y-0 overflow-y-auto">
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--primary))]" />
              {index < items.length - 1 && (
                <div className="w-px flex-1 bg-[hsl(var(--border))]" />
              )}
            </div>
            {/* Content */}
            <div className="min-w-0 flex-1 pb-4">
              <div className="flex items-center gap-2">
                <span className=                "text-sm font-medium text-[hsl(var(--foreground))]">
                                  {item.action}
                </span>
                <span className=                "text-xs text-[hsl(var(--muted-foreground))]">
                                  {roleLabels[item.userRole] ?? item.userRole}
                </span>
              </div>
              {item.detail && (
                <p className=                "mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                                  {item.detail}
                </p>
              )}
              <p className=              "mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                              {formatTime(item.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

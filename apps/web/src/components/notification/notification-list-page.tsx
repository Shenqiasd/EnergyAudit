"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Info,
  Trash2,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/lib/api/hooks/use-notifications";
import type { Notification } from "@/lib/api/hooks/use-notifications";
import { useAuth } from "@/lib/auth/use-auth";
import type { ElementType } from "react";

const typeConfig: Record<
  string,
  { icon: ElementType; color: string; label: string }
> = {
  status_change: { icon: Info, color: "text-blue-500", label: "状态变更" },
  task_assigned: {
    icon: ClipboardCheck,
    color: "text-green-500",
    label: "任务分配",
  },
  deadline_warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    label: "截止提醒",
  },
  review_result: {
    icon: CheckCircle2,
    color: "text-purple-500",
    label: "审核结果",
  },
  rectification_assigned: {
    icon: Wrench,
    color: "text-orange-500",
    label: "整改任务",
  },
  system: { icon: Bell, color: "text-[hsl(var(--muted-foreground))]", label: "系统通知" },
};

const notificationTypes = [
  { value: "", label: "全部类型" },
  { value: "status_change", label: "状态变更" },
  { value: "task_assigned", label: "任务分配" },
  { value: "deadline_warning", label: "截止提醒" },
  { value: "review_result", label: "审核结果" },
  { value: "rectification_assigned", label: "整改任务" },
  { value: "system", label: "系统通知" },
];

const readFilters = [
  { value: "all", label: "全部" },
  { value: "unread", label: "未读" },
  { value: "read", label: "已读" },
];

function getRelatedLink(
  relatedType: string | null,
  relatedId: string | null,
  role: string,
): string | null {
  if (!relatedType || !relatedId) return null;

  const rolePrefix =
    role === "enterprise_user"
      ? "/enterprise"
      : role === "reviewer"
        ? "/reviewer"
        : "/manager";

  switch (relatedType) {
    case "audit_project":
      return role === "manager"
        ? `${rolePrefix}/projects/${relatedId}`
        : `${rolePrefix}/projects`;
    case "review_task":
      return role === "reviewer"
        ? `${rolePrefix}/tasks/${relatedId}`
        : `${rolePrefix}/reviews/${relatedId}`;
    case "rectification_task":
      return role === "enterprise_user"
        ? `${rolePrefix}/rectification/${relatedId}`
        : `${rolePrefix}/rectifications`;
    case "report":
      return `${rolePrefix}/reports/${relatedId}`;
    default:
      return null;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [readFilter, setReadFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");

  const queryParams: {
    page: number;
    limit: number;
    isRead?: boolean;
    type?: string;
  } = {
    page,
    limit: 20,
  };
  if (readFilter === "unread") queryParams.isRead = false;
  if (readFilter === "read") queryParams.isRead = true;
  if (typeFilter) queryParams.type = typeFilter;

  const { data, isLoading } = useNotifications(queryParams);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    const link = getRelatedLink(
      notification.relatedType,
      notification.relatedId,
      user?.role ?? "enterprise_user",
    );
    if (link) {
      router.push(link);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">消息通知</h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => markAllAsRead.mutate()}
          disabled={markAllAsRead.isPending}
        >
          全部标为已读
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          {readFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setReadFilter(filter.value);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                readFilter === filter.value
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[hsl(var(--input))] px-3 py-1.5 text-xs"
        >
          {notificationTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notification list */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        {isLoading ? (
          <div className=          "px-4 py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
                      加载中...
          </div>
        ) : notifications.length === 0 ? (
          <div className=          "px-4 py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
                      暂无通知
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {notifications.map((notification) => {
              const config =
                typeConfig[notification.type] ?? typeConfig.system;
              const Icon = config.icon;
              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 px-4 py-4 transition-colors hover:bg-[hsl(var(--muted))] ${
                    !notification.isRead ? "bg-[hsl(var(--primary)/0.05)]" : ""
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 ${config.color}`}>
                    <Icon size={20} />
                  </div>
                  <button
                    onClick={() => handleClick(notification)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className=                      "text-sm font-medium text-[hsl(var(--foreground))]">
                                              {notification.title}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color} bg-[hsl(var(--muted))]`}
                      >
                        {config.label}
                      </span>
                      {!notification.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--primary))]" />
                      )}
                    </div>
                    <p className=                    "mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                                          {notification.content}
                    </p>
                    <span className=                    "mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                                          {formatDate(notification.createdAt)}
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead.mutate(notification.id)}
                        className="rounded p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]"
                        title="标为已读"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        deleteNotification.mutate(notification.id)
                      }
                      className="rounded p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--danger))]"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className=          "text-xs text-[hsl(var(--muted-foreground))]">
                      共 {total} 条通知
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-[hsl(var(--border))] px-3 py-1 text-xs disabled:opacity-50"
            >
              上一页
            </button>
            <span className=            "text-xs text-[hsl(var(--muted-foreground))]">
                          {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-[hsl(var(--border))] px-3 py-1 text-xs disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

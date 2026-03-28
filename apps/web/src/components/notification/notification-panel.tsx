"use client";

import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/lib/api/hooks/use-notifications";
import type { Notification } from "@/lib/api/hooks/use-notifications";
import { useAuth } from "@/lib/auth/use-auth";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Info,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ElementType } from "react";

const typeConfig: Record<
  string,
  { icon: ElementType; color: string; label: string }
> = {
  status_change: {
    icon: Info,
    color: "text-blue-500",
    label: "状态变更",
  },
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
  system: {
    icon: Bell,
    color: "text-gray-500",
    label: "系统通知",
  },
};

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

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 30) return `${days} 天前`;
  return date.toLocaleDateString("zh-CN");
}

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { data, isLoading } = useNotifications({ limit: 10 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.items ?? [];

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
      onClose();
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  const rolePrefix =
    user?.role === "enterprise_user"
      ? "/enterprise"
      : user?.role === "reviewer"
        ? "/reviewer"
        : "/manager";

  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-96 rounded-lg border border-[var(--color-border)] bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">
          通知消息
        </h3>
        <button
          onClick={handleMarkAllRead}
          className="text-xs text-[var(--color-primary)] hover:underline"
          disabled={markAllAsRead.isPending}
        >
          全部已读
        </button>
      </div>

      {/* Notification list */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">
            加载中...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">
            暂无通知
          </div>
        ) : (
          notifications.map((notification) => {
            const config = typeConfig[notification.type] ?? typeConfig.system;
            const Icon = config.icon;
            return (
              <button
                key={notification.id}
                onClick={() => handleClick(notification)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                  !notification.isRead ? "bg-blue-50/50" : ""
                }`}
              >
                <div className={`mt-0.5 shrink-0 ${config.color}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-[var(--color-text)]">
                      {notification.title}
                    </span>
                    {!notification.isRead && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">
                    {notification.content}
                  </p>
                  <span className="mt-1 text-[10px] text-[var(--color-text-secondary)]">
                    {timeAgo(notification.createdAt)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--color-border)] px-4 py-2">
        <button
          onClick={() => {
            router.push(`${rolePrefix}/notifications`);
            onClose();
          }}
          className="w-full text-center text-xs text-[var(--color-primary)] hover:underline"
        >
          查看全部通知
        </button>
      </div>
    </div>
  );
}

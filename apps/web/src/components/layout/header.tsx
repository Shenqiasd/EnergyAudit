"use client";

import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notification/notification-bell";
import type { UserRole } from "@/lib/auth/auth-provider";
import { useAuth } from "@/lib/auth/use-auth";
import {
  ChevronRight,
  LogOut,
  Menu,
  User,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  onMenuToggle: () => void;
}

const roleLabels: Record<UserRole, string> = {
  enterprise_user: "企业端",
  manager: "管理端",
  reviewer: "审核端",
};

const roleBadgeVariants: Record<UserRole, "primary" | "success" | "warning"> = {
  enterprise_user: "primary",
  manager: "success",
  reviewer: "warning",
};

const breadcrumbMap: Record<string, string> = {
  enterprise: "企业端",
  manager: "管理端",
  reviewer: "审核端",
  dashboard: "工作台",
  config: "企业配置",
  filing: "数据填报",
  reports: "报告管理",
  rectification: "整改任务",
  enterprises: "企业管理",
  batches: "批次管理",
  projects: "项目管理",
  reviews: "审核管理",
  statistics: "统计分析",
  tasks: "我的审核",
  history: "审核历史",
  notifications: "消息通知",
};

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout, switchRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const roleDashboards: Record<UserRole, string> = {
    enterprise_user: "/enterprise/dashboard",
    manager: "/manager/dashboard",
    reviewer: "/reviewer/tasks",
  };

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map(
    (seg) => breadcrumbMap[seg] || seg,
  );

  const roles: UserRole[] = ["enterprise_user", "manager", "reviewer"];

  return (
    <header className="flex h-16 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 lg:px-6">
      {/* Left: menu toggle + breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        >
          <Menu size={20} />
        </button>
        <nav className="hidden items-center gap-1 text-sm text-[hsl(var(--muted-foreground))] sm:flex">
          <span>首页</span>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={14} />
              <span
                className={
                  i === breadcrumbs.length - 1
                    ? "text-[hsl(var(--foreground))] font-medium"
                    : ""
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: notification bell + user info + role switcher */}
      <div className="flex items-center gap-3">
        <NotificationBell />
        {/* Role switcher (dev only) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100"
          >
            <User size={16} />
            <span className="hidden sm:inline">{user?.name || "未登录"}</span>
            {user?.role && (
              <Badge variant={roleBadgeVariants[user.role]}>
                {roleLabels[user.role]}
              </Badge>
            )}
          </button>
          {showRoleSwitcher && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-1 shadow-lg">
              <div className="px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                切换角色 (开发用)
              </div>
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    switchRole(role);
                    router.push(roleDashboards[role]);
                    setShowRoleSwitcher(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                    user?.role === role ? "bg-gray-50 font-medium" : ""
                  }`}
                >
                  <Badge variant={roleBadgeVariants[role]}>
                    {roleLabels[role]}
                  </Badge>
                </button>
              ))}
              <div className="border-t border-[hsl(var(--border))] mt-1 pt-1">
                <button
                  onClick={() => {
                    logout();
                    router.push("/");
                    setShowRoleSwitcher(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--danger))] hover:bg-[hsl(var(--muted))]"
                >
                  <LogOut size={16} />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

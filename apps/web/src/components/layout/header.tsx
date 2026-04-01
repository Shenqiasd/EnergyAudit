"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notification/notification-bell";
import type { UserRole } from "@/lib/auth/auth-provider";
import { useAuth } from "@/lib/auth/use-auth";
import {
  ChevronRight,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Search,
  Shield,
  Sun,
} from "lucide-react";
import { useThemeStore } from "@/lib/stores/theme-store";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface HeaderProps {
  onMenuToggle: () => void;
}

const roleLabels: Record<UserRole, string> = {
  enterprise_user: "重点用能单位",
  manager: "监管机构",
  reviewer: "评审专家",
};

const breadcrumbMap: Record<string, string> = {
  enterprise: "企业平台",
  manager: "监管平台",
  reviewer: "专家平台",
  dashboard: "总览工作台",
  config: "参数配置",
  filing: "数据填报",
  reports: "审计报告",
  rectification: "整改办理",
  enterprises: "名录管理",
  batches: "计划下发",
  projects: "项目追踪",
  reviews: "专家评审",
  statistics: "全局统计",
  tasks: "审核任务",
  history: "审核档案",
  notifications: "消息中心",
  "business-types": "业务类型",
  calculations: "核算规则",
  "data-overview": "填报大盘",
  rectifications: "整改督办",
  benchmarks: "行业对标",
  region: "区域分布",
  ledgers: "系统台账",
  sync: "数据同步",
  "audit-logs": "操作审计",
  jobs: "任务调度",
};

function buildBreadcrumbHref(segments: string[], index: number): string {
  return "/" + segments.slice(0, index + 1).join("/");
}

const themeOptions = [
  { value: "light" as const, label: "浅色", icon: Sun },
  { value: "dark" as const, label: "深色", icon: Moon },
  { value: "system" as const, label: "系统", icon: Monitor },
];

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout, switchRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useThemeStore();

  const roleDashboards: Record<UserRole, string> = {
    enterprise_user: "/enterprise/dashboard",
    manager: "/manager/dashboard",
    reviewer: "/reviewer/tasks",
  };

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: breadcrumbMap[seg] || seg,
    href: buildBreadcrumbHref(segments, i),
    isLast: i === segments.length - 1,
  }));

  const roles: UserRole[] = ["enterprise_user", "manager", "reviewer"];
  const userInitial = user?.name ? user.name.charAt(0) : "U";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-[hsl(var(--card))] px-4 border-b border-[hsl(var(--border))] lg:px-6">
      {/* Left: menu toggle + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
          aria-label="切换菜单"
        >
          <Menu size={18} />
        </button>
        <nav className="hidden items-center gap-0.5 text-sm text-[hsl(var(--muted-foreground))] sm:flex">
          <Link
            href="/"
            className="transition-colors hover:text-[hsl(var(--foreground))] px-1"
          >
            首页
          </Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.href} className="flex items-center">
              <ChevronRight size={14} className="opacity-30" />
              {crumb.isLast ? (
                <span className="font-medium text-[hsl(var(--foreground))] px-1">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-[hsl(var(--foreground))] px-1"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: search trigger + notification bell + user dropdown */}
      <div className="flex items-center gap-1.5">
        {/* Global search trigger */}
        <button
          className="hidden items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-1.5 text-sm text-[hsl(var(--muted-foreground))] transition-all hover:border-[hsl(var(--primary))/40] hover:text-[hsl(var(--foreground))] md:flex mr-1"
          onClick={() => {}}
        >
          <Search size={13} />
          <span className="mr-6 text-xs">检索项目、企业...</span>
          <kbd className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-1.5 py-0.5 text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">
            ⌘K
          </kbd>
        </button>

        {/* Theme switcher */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="rounded-xl p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
              aria-label="切换主题"
            >
              {theme === "dark" ? (
                <Moon size={16} />
              ) : theme === "system" ? (
                <Monitor size={16} />
              ) : (
                <Sun size={16} />
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[140px] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1.5 shadow-[var(--shadow-lg)]"
            >
              <DropdownMenu.Label className="px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                视觉偏好
              </DropdownMenu.Label>
              {themeOptions.map((option) => (
                <DropdownMenu.Item
                  key={option.value}
                  onSelect={() => setTheme(option.value)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none transition-colors hover:bg-[hsl(var(--accent))]",
                    theme === option.value && "bg-[hsl(var(--primary))/8] text-[hsl(var(--primary))] font-medium",
                  )}
                >
                  <option.icon size={14} />
                  {option.label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <NotificationBell />

        <div className="w-px h-5 bg-[hsl(var(--border))] mx-0.5 hidden sm:block" />

        {/* User dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2.5 rounded-xl pl-2 pr-3 py-1.5 text-sm transition-colors hover:bg-[hsl(var(--accent))] outline-none">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[hsl(var(--primary))] to-indigo-500 text-xs font-bold text-white">
                {userInitial}
              </div>
              <div className="hidden flex-col items-start sm:flex">
                <span className="max-w-[100px] truncate text-xs font-medium text-[hsl(var(--foreground))] leading-none mb-0.5">
                  {user?.name || "未登录"}
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] leading-none">
                  {user?.role ? roleLabels[user.role] : ""}
                </span>
              </div>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[240px] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1.5 shadow-[var(--shadow-lg)]"
            >
              {/* User info header */}
              <div className="px-3.5 py-3 bg-[hsl(var(--muted))/50] rounded-xl m-1 mb-1.5">
                <div className="text-sm font-semibold text-[hsl(var(--foreground))] mb-0.5">
                  {user?.name || "未登录"}
                </div>
                {user?.email && (
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    {user.email}
                  </div>
                )}
              </div>

              {/* Role switcher */}
              <DropdownMenu.Label className="px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                切换视图
              </DropdownMenu.Label>
              {roles.map((role) => (
                <DropdownMenu.Item
                  key={role}
                  onSelect={() => {
                    switchRole(role);
                    router.push(roleDashboards[role]);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm outline-none transition-colors hover:bg-[hsl(var(--accent))]",
                    user?.role === role && "bg-[hsl(var(--primary))/8] text-[hsl(var(--primary))] font-medium",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Shield size={14} className={user?.role === role ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"} />
                    {roleLabels[role]}
                  </div>
                  {user?.role === role && <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />}
                </DropdownMenu.Item>
              ))}

              <DropdownMenu.Separator className="my-1.5 h-px bg-[hsl(var(--border))]" />

              {/* Logout */}
              <DropdownMenu.Item
                onSelect={() => {
                  logout();
                  router.push("/");
                }}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[hsl(var(--danger))] outline-none transition-colors hover:bg-[hsl(var(--danger))/8]"
              >
                <LogOut size={14} />
                安全退出
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}

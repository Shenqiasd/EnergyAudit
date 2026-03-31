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
  "business-types": "业务类型",
  calculations: "计算管理",
  "data-overview": "填报概览",
  rectifications: "整改监管",
  benchmarks: "能效对标",
  region: "区域统计",
  ledgers: "台账管理",
  sync: "同步管理",
  "audit-logs": "操作日志",
  jobs: "任务监控",
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
    <header className="flex h-16 items-center justify-between bg-[hsl(var(--card))] px-4 shadow-sm lg:px-6">
      {/* Left: menu toggle + breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
        >
          <Menu size={20} />
        </button>
        <nav className="hidden items-center gap-1 text-sm text-[hsl(var(--muted-foreground))] sm:flex">
          <Link
            href="/"
            className="transition-colors hover:text-[hsl(var(--foreground))]"
          >
            首页
          </Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-1">
              <ChevronRight size={14} className="text-[hsl(var(--muted-foreground))]" />
              {crumb.isLast ? (
                <span className="font-medium text-[hsl(var(--foreground))]">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-[hsl(var(--foreground))]"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: search trigger + notification bell + user dropdown */}
      <div className="flex items-center gap-2">
        {/* Global search trigger (Wave 14 - Command palette placeholder) */}
        <button
          className="hidden items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent))] md:flex"
          onClick={() => {
            /* Command palette - Wave 14 */
          }}
        >
          <Search size={14} />
          <span>搜索...</span>
          <kbd className="ml-2 rounded border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-1.5 py-0.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
            ⌘K
          </kbd>
        </button>

        {/* Theme switcher */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
              aria-label="切换主题"
            >
              {theme === "dark" ? (
                <Moon size={18} />
              ) : theme === "system" ? (
                <Monitor size={18} />
              ) : (
                <Sun size={18} />
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[140px] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 shadow-lg"
            >
              <DropdownMenu.Label className="px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                主题模式
              </DropdownMenu.Label>
              {themeOptions.map((option) => (
                <DropdownMenu.Item
                  key={option.value}
                  onSelect={() => setTheme(option.value)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-[hsl(var(--accent))]",
                    theme === option.value && "bg-[hsl(var(--accent))] font-medium",
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

        {/* User dropdown with Radix DropdownMenu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-[hsl(var(--accent))]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-xs font-medium text-white">
                {userInitial}
              </div>
              <span className="hidden max-w-[120px] truncate sm:inline">
                {user?.name || "未登录"}
              </span>
              {user?.role && (
                <Badge variant={roleBadgeVariants[user.role]}>
                  {roleLabels[user.role]}
                </Badge>
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[200px] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 shadow-lg"
            >
              {/* User info header */}
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-[hsl(var(--foreground))]">
                  {user?.name || "未登录"}
                </div>
                {user?.email && (
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    {user.email}
                  </div>
                )}
              </div>

              <DropdownMenu.Separator className="my-1 h-px bg-[hsl(var(--border))]" />

              {/* Role switcher */}
              <DropdownMenu.Label className="px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                切换角色
              </DropdownMenu.Label>
              {roles.map((role) => (
                <DropdownMenu.Item
                  key={role}
                  onSelect={() => {
                    switchRole(role);
                    router.push(roleDashboards[role]);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-[hsl(var(--accent))]",
                    user?.role === role && "bg-[hsl(var(--accent))] font-medium",
                  )}
                >
                  <Shield size={14} />
                  <Badge variant={roleBadgeVariants[role]}>
                    {roleLabels[role]}
                  </Badge>
                </DropdownMenu.Item>
              ))}

              <DropdownMenu.Separator className="my-1 h-px bg-[hsl(var(--border))]" />

              {/* Logout */}
              <DropdownMenu.Item
                onSelect={() => {
                  logout();
                  router.push("/");
                }}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[hsl(var(--destructive))] outline-none transition-colors hover:bg-[hsl(var(--destructive)/0.1)]"
              >
                <LogOut size={14} />
                退出登录
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}

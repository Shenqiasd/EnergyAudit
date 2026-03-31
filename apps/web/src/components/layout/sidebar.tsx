"use client";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/use-auth";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ClipboardCheck,
  Cpu,
  Database,
  FileText,
  History,
  Home,
  Layers,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MapPin,
  Settings,
  Shield,
  Target,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ElementType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { UserRole } from "@/lib/auth/auth-provider";

interface MenuItem {
  label: string;
  href: string;
  icon: ElementType;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const enterpriseMenus: MenuGroup[] = [
  {
    label: "工作台",
    items: [
      { label: "工作台", href: "/enterprise/dashboard", icon: LayoutDashboard },
      { label: "消息通知", href: "/enterprise/notifications", icon: Bell },
    ],
  },
  {
    label: "业务管理",
    items: [
      { label: "企业配置", href: "/enterprise/config", icon: Settings },
      { label: "数据填报", href: "/enterprise/filing", icon: Database },
      { label: "报告管理", href: "/enterprise/reports", icon: FileText },
      { label: "整改任务", href: "/enterprise/rectification", icon: Wrench },
    ],
  },
];

const managerMenus: MenuGroup[] = [
  {
    label: "工作台",
    items: [
      { label: "工作台", href: "/manager/dashboard", icon: Home },
      { label: "消息通知", href: "/manager/notifications", icon: Bell },
    ],
  },
  {
    label: "业务管理",
    items: [
      { label: "企业管理", href: "/manager/enterprises", icon: Building2 },
      { label: "批次管理", href: "/manager/batches", icon: Layers },
      { label: "项目管理", href: "/manager/projects", icon: ClipboardCheck },
      { label: "业务类型", href: "/manager/business-types", icon: Settings },
      { label: "计算管理", href: "/manager/calculations", icon: Cpu },
    ],
  },
  {
    label: "数据管理",
    items: [
      { label: "填报概览", href: "/manager/data-overview", icon: Database },
    ],
  },
  {
    label: "审核与监管",
    items: [
      { label: "审核管理", href: "/manager/reviews", icon: Shield },
      { label: "整改监管", href: "/manager/rectifications", icon: Wrench },
      { label: "统计分析", href: "/manager/statistics", icon: BarChart3 },
      { label: "能效对标", href: "/manager/benchmarks", icon: Target },
      { label: "区域统计", href: "/manager/statistics/region", icon: MapPin },
      { label: "台账管理", href: "/manager/ledgers", icon: FileText },
    ],
  },
  {
    label: "运维管理",
    items: [
      { label: "同步管理", href: "/manager/sync", icon: Activity },
      { label: "操作日志", href: "/manager/audit-logs", icon: FileText },
      { label: "任务监控", href: "/manager/jobs", icon: Cpu },
    ],
  },
];

const reviewerMenus: MenuGroup[] = [
  {
    label: "审核工作",
    items: [
      { label: "我的审核", href: "/reviewer/tasks", icon: ListChecks },
      { label: "审核历史", href: "/reviewer/history", icon: History },
      { label: "消息通知", href: "/reviewer/notifications", icon: Bell },
    ],
  },
];

const menusByRole: Record<UserRole, MenuGroup[]> = {
  enterprise_user: enterpriseMenus,
  manager: managerMenus,
  reviewer: reviewerMenus,
};

interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  onToggle: () => void;
}

const roleLabels: Record<UserRole, string> = {
  enterprise_user: "企业端",
  manager: "管理端",
  reviewer: "审核端",
};

const roleBadgeColors: Record<UserRole, string> = {
  enterprise_user: "bg-blue-100 text-blue-700",
  manager: "bg-emerald-100 text-emerald-700",
  reviewer: "bg-amber-100 text-amber-700",
};

/** Collect all href values from menu groups into a flat set for precise active matching */
function getAllHrefs(groups: MenuGroup[]): string[] {
  return groups.flatMap((g) => g.items.map((item) => item.href));
}

/**
 * Determine if a menu item should be active.
 * Uses exact match first; for prefix matches, ensures no more-specific sibling href also matches.
 * This prevents both "/manager/statistics" and "/manager/statistics/region" from being active simultaneously.
 */
function isItemActive(pathname: string, itemHref: string, allHrefs: string[]): boolean {
  if (pathname === itemHref) return true;
  if (!pathname.startsWith(itemHref + "/")) return false;
  // Check if a more specific href also matches — if so, this item should not be active
  const hasMoreSpecificMatch = allHrefs.some(
    (href) => href !== itemHref && href.startsWith(itemHref + "/") && (pathname === href || pathname.startsWith(href + "/")),
  );
  return !hasMoreSpecificMatch;
}

export function Sidebar({ role, collapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const menus = menusByRole[role] || [];
  const allHrefs = getAllHrefs(menus);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      menus.forEach((group) => {
        initial[group.label] = true;
      });
      return initial;
    },
  );

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    menus.forEach((group) => {
      initial[group.label] = true;
    });
    setExpandedGroups(initial);
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const userInitial = user?.name ? user.name.charAt(0) : "U";

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Brand area */}
      <div className="flex h-16 items-center gap-3 border-b border-[hsl(var(--sidebar-border))] px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
          <Zap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="truncate text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">
              能源审计平台
            </div>
            <span
              className={cn(
                "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight",
                roleBadgeColors[role],
              )}
            >
              {roleLabels[role]}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {menus.map((group) => (
          <div key={group.label} className="mb-4">
            {/* Group header */}
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.label)}
                className="mb-1 flex w-full items-center gap-2 px-2 py-1.5 text-xs font-medium tracking-wider text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-foreground))]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-muted))]" />
                {group.label}
                <ChevronDown
                  size={14}
                  className={cn(
                    "ml-auto transition-transform duration-200",
                    expandedGroups[group.label] ? "rotate-0" : "-rotate-90",
                  )}
                />
              </button>
            )}
            <AnimatePresence initial={false}>
              {(collapsed || expandedGroups[group.label]) && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="space-y-0.5 overflow-hidden"
                >
                  {group.items.map((item) => {
                    const isActive = isItemActive(pathname, item.href, allHrefs);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-[hsl(var(--primary)/0.08)] font-medium text-[hsl(var(--primary))]"
                              : "text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]",
                            collapsed && "justify-center px-2",
                          )}
                          title={collapsed ? item.label : undefined}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[hsl(var(--primary))]"
                              transition={{
                                type: "spring",
                                stiffness: 350,
                                damping: 30,
                              }}
                            />
                          )}
                          <Icon size={18} className="shrink-0" />
                          {!collapsed && <span>{item.label}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Bottom user info */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-xs font-medium text-white">
              {userInitial}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-sm font-medium text-white">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[hsl(var(--sidebar-foreground))]">
                {user?.name || "未登录"}
              </div>
              <span
                className={cn(
                  "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight",
                  roleBadgeColors[role],
                )}
              >
                {roleLabels[role]}
              </span>
            </div>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="rounded-lg p-1.5 text-[hsl(var(--sidebar-muted))] transition-colors hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--destructive))]"
              title="退出登录"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

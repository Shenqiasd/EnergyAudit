"use client";

import { clsx } from "clsx";
import {
  Activity,
  BarChart3,
  Building2,
  ChevronDown,
  ClipboardCheck,
  Cpu,
  Database,
  FileBarChart,
  FileText,
  History,
  Home,
  Layers,
  LayoutDashboard,
  ListChecks,
  Settings,
  Shield,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ElementType } from "react";
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

export function Sidebar({ role, collapsed }: SidebarProps) {
  const pathname = usePathname();
  const menus = menusByRole[role] || [];
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

  const roleLabels: Record<UserRole, string> = {
    enterprise_user: "企业端",
    manager: "管理端",
    reviewer: "审核端",
  };

  return (
    <aside
      className={clsx(
        "flex h-full flex-col bg-[var(--color-sidebar)] text-white transition-all duration-300",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <FileBarChart size={24} className="shrink-0 text-blue-400" />
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="truncate text-sm font-bold">能源审计平台</div>
            <div className="truncate text-xs text-white/60">
              {roleLabels[role]}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {menus.map((group) => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-white/40 hover:text-white/60"
              >
                {group.label}
                <ChevronDown
                  size={14}
                  className={clsx(
                    "transition-transform",
                    expandedGroups[group.label] ? "rotate-0" : "-rotate-90",
                  )}
                />
              </button>
            )}
            {(collapsed || expandedGroups[group.label]) && (
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={clsx(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-[var(--color-sidebar-active)] text-white font-medium"
                            : "text-white/70 hover:bg-[var(--color-sidebar-hover)] hover:text-white",
                          collapsed && "justify-center px-2",
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon size={18} className="shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

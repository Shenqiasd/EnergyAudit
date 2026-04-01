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
      { label: "总览", href: "/enterprise/dashboard", icon: LayoutDashboard },
      { label: "消息", href: "/enterprise/notifications", icon: Bell },
    ],
  },
  {
    label: "业务办理",
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
    label: "监管中心",
    items: [
      { label: "工作台", href: "/manager/dashboard", icon: Home },
      { label: "消息", href: "/manager/notifications", icon: Bell },
    ],
  },
  {
    label: "业务管理",
    items: [
      { label: "企业名录", href: "/manager/enterprises", icon: Building2 },
      { label: "批次计划", href: "/manager/batches", icon: Layers },
      { label: "项目追踪", href: "/manager/projects", icon: ClipboardCheck },
      { label: "类型配置", href: "/manager/business-types", icon: Settings },
      { label: "核算规则", href: "/manager/calculations", icon: Cpu },
    ],
  },
  {
    label: "数据资产",
    items: [
      { label: "填报大盘", href: "/manager/data-overview", icon: Database },
      { label: "统计洞察", href: "/manager/statistics", icon: BarChart3 },
      { label: "能效对标", href: "/manager/benchmarks", icon: Target },
      { label: "区域分布", href: "/manager/statistics/region", icon: MapPin },
      { label: "基础台账", href: "/manager/ledgers", icon: FileText },
    ],
  },
  {
    label: "核查与督办",
    items: [
      { label: "审核统筹", href: "/manager/reviews", icon: Shield },
      { label: "整改督办", href: "/manager/rectifications", icon: Wrench },
    ],
  },
  {
    label: "系统运维",
    items: [
      { label: "同步监控", href: "/manager/sync", icon: Activity },
      { label: "系统日志", href: "/manager/audit-logs", icon: FileText },
      { label: "任务调度", href: "/manager/jobs", icon: Cpu },
    ],
  },
];

const reviewerMenus: MenuGroup[] = [
  {
    label: "专家工作",
    items: [
      { label: "待审任务", href: "/reviewer/tasks", icon: ListChecks },
      { label: "已审记录", href: "/reviewer/history", icon: History },
      { label: "通知公告", href: "/reviewer/notifications", icon: Bell },
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
  enterprise_user: "重点用能单位",
  manager: "监管机构",
  reviewer: "评审专家",
};

const roleBadgeColors: Record<UserRole, string> = {
  enterprise_user: "bg-blue-500/15 text-blue-200 border border-blue-500/25",
  manager: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/25",
  reviewer: "bg-indigo-500/15 text-indigo-200 border border-indigo-500/25",
};

function getAllHrefs(groups: MenuGroup[]): string[] {
  return groups.flatMap((g) => g.items.map((item) => item.href));
}

function isItemActive(pathname: string, itemHref: string, allHrefs: string[]): boolean {
  if (pathname === itemHref) return true;
  if (!pathname.startsWith(itemHref + "/")) return false;
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
  }, [role]);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const userInitial = user?.name ? user.name.charAt(0) : "U";

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] transition-all duration-300",
        collapsed ? "w-[60px]" : "w-60",
      )}
    >
      {/* Brand area */}
      <div className={cn(
        "flex h-14 items-center gap-3 border-b border-white/8 shrink-0",
        collapsed ? "px-3 justify-center" : "px-4",
      )}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
          <Zap size={15} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1">
            <div className="truncate text-sm font-semibold text-white tracking-wide">
              EAP 能源审计
            </div>
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-[9px] font-medium leading-none mt-1",
                roleBadgeColors[role],
              )}
            >
              {roleLabels[role]}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar space-y-1">
        {menus.map((group) => (
          <div key={group.label} className="mb-3">
            {/* Group header */}
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.label)}
                className="mb-1 flex w-full items-center justify-between px-2.5 py-1 text-[10px] font-semibold tracking-widest uppercase text-[hsl(var(--sidebar-muted))] hover:text-white/70 transition-colors"
              >
                <span>{group.label}</span>
                <ChevronDown
                  size={12}
                  className={cn(
                    "transition-transform duration-200 opacity-50",
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
                  transition={{ duration: 0.18, ease: "easeInOut" }}
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
                            "relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-all duration-150 group outline-none",
                            isActive
                              ? "bg-white/12 text-white font-medium"
                              : "text-[hsl(var(--sidebar-muted))] hover:bg-white/6 hover:text-white/90",
                            collapsed && "justify-center px-0 py-2.5",
                          )}
                          title={collapsed ? item.label : undefined}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[hsl(var(--primary))]" />
                          )}
                          <Icon size={16} className={cn("shrink-0 transition-opacity", isActive ? "opacity-100 text-white" : "opacity-60 group-hover:opacity-80")} />
                          {!collapsed && <span className="truncate">{item.label}</span>}
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
      <div className={cn(
        "border-t border-white/8 bg-black/15 mt-auto shrink-0",
        collapsed ? "p-2.5" : "p-3",
      )}>
        {collapsed ? (
          <div className="flex justify-center">
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8 text-[hsl(var(--sidebar-muted))] hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="退出登录"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-indigo-500 text-xs font-bold text-white">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-white">
                {user?.name || "未登录"}
              </div>
              <div className="truncate text-[10px] text-[hsl(var(--sidebar-muted))] mt-0.5">
                {user?.id?.slice(0, 16) || "N/A"}
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="rounded-xl p-1.5 text-[hsl(var(--sidebar-muted))] transition-colors hover:bg-red-500/20 hover:text-red-400"
              title="退出登录"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

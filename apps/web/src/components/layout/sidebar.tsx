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
  enterprise_user: "bg-blue-500/20 text-blue-200 border border-blue-500/30",
  manager: "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30",
  reviewer: "bg-indigo-500/20 text-indigo-200 border border-indigo-500/30",
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
        "flex h-full flex-col border-r border-transparent bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] transition-all duration-300 shadow-xl",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      {/* Brand area */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4 shrink-0 bg-black/10">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))] shadow-sm">
          <Zap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1">
            <div className="truncate text-sm font-bold text-white tracking-wide">
              EAP 能源审计
            </div>
            <span
              className={cn(
                "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium leading-none mt-1",
                roleBadgeColors[role],
              )}
            >
              {roleLabels[role]}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 custom-scrollbar">
        {menus.map((group) => (
          <div key={group.label} className="mb-6">
            {/* Group header */}
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.label)}
                className="mb-2 flex w-full items-center justify-between px-2 py-1 text-xs font-semibold tracking-widest text-[hsl(var(--sidebar-muted))] hover:text-white transition-colors"
              >
                <span>{group.label}</span>
                <ChevronDown
                  size={14}
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
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="space-y-1 overflow-hidden"
                >
                  {group.items.map((item) => {
                    const isActive = isItemActive(pathname, item.href, allHrefs);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 group outline-none",
                            isActive
                              ? "bg-[hsl(var(--primary))] text-white font-medium shadow-md shadow-[hsl(var(--primary))]/20"
                              : "text-[hsl(var(--sidebar-muted))] hover:bg-white/5 hover:text-white",
                            collapsed && "justify-center px-2",
                          )}
                          title={collapsed ? item.label : undefined}
                        >
                          <Icon size={18} className={cn("shrink-0", isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100 transition-opacity")} />
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
      <div className="border-t border-white/10 p-4 bg-black/20 mt-auto shrink-0">
        {collapsed ? (
          <div className="flex justify-center">
            <button
               onClick={() => {
                logout();
                router.push("/");
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[hsl(var(--sidebar-muted))] hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="退出登录"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-indigo-600 text-sm font-bold text-white shadow-inner">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">
                {user?.name || "未登录"}
              </div>
              <div className="truncate text-xs text-[hsl(var(--sidebar-muted))] mt-0.5">
                {user?.id || "N/A"}
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="rounded-lg p-2 text-[hsl(var(--sidebar-muted))] transition-colors hover:bg-red-500/20 hover:text-red-400"
              title="退出登录"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

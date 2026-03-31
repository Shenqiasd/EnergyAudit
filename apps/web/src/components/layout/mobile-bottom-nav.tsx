"use client";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth/auth-provider";
import {
  Bell,
  Building2,
  ClipboardCheck,
  Database,
  FileText,
  History,
  Home,
  LayoutDashboard,
  ListChecks,
  MoreHorizontal,
  Shield,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ElementType } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ElementType;
}

interface MoreMenuItem {
  label: string;
  href: string;
  icon: ElementType;
}

const enterpriseNav: NavItem[] = [
  { label: "工作台", href: "/enterprise/dashboard", icon: LayoutDashboard },
  { label: "填报", href: "/enterprise/filing", icon: Database },
  { label: "报告", href: "/enterprise/reports", icon: FileText },
  { label: "整改", href: "/enterprise/rectification", icon: Wrench },
];

const enterpriseMore: MoreMenuItem[] = [
  { label: "企业配置", href: "/enterprise/config", icon: Building2 },
  { label: "消息通知", href: "/enterprise/notifications", icon: Bell },
];

const managerNav: NavItem[] = [
  { label: "工作台", href: "/manager/dashboard", icon: Home },
  { label: "企业", href: "/manager/enterprises", icon: Building2 },
  { label: "项目", href: "/manager/projects", icon: ClipboardCheck },
  { label: "审核", href: "/manager/reviews", icon: Shield },
];

const managerMore: MoreMenuItem[] = [
  { label: "批次管理", href: "/manager/batches", icon: ClipboardCheck },
  { label: "统计分析", href: "/manager/statistics", icon: Home },
  { label: "台账管理", href: "/manager/ledgers", icon: FileText },
  { label: "消息通知", href: "/manager/notifications", icon: Bell },
  { label: "整改监管", href: "/manager/rectifications", icon: Wrench },
];

const reviewerNav: NavItem[] = [
  { label: "任务", href: "/reviewer/tasks", icon: ListChecks },
  { label: "历史", href: "/reviewer/history", icon: History },
  { label: "通知", href: "/reviewer/notifications", icon: Bell },
];

const reviewerMore: MoreMenuItem[] = [];

const navByRole: Record<UserRole, { items: NavItem[]; more: MoreMenuItem[] }> = {
  enterprise_user: { items: enterpriseNav, more: enterpriseMore },
  manager: { items: managerNav, more: managerMore },
  reviewer: { items: reviewerNav, more: reviewerMore },
};

interface MobileBottomNavProps {
  role: UserRole;
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { items, more } = navByRole[role];

  const hasMore = more.length > 0;

  return (
    <>
      {/* "More" overlay menu */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-16 z-50 rounded-t-2xl border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-xl lg:hidden"
            >
              <div className="mb-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                更多功能
              </div>
              <div className="grid grid-cols-3 gap-3">
                {more.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg p-3 text-xs transition-colors",
                        isActive
                          ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]"
                          : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]",
                      )}
                    >
                      <Icon size={20} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex h-16 items-center justify-around">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] transition-colors",
                  isActive
                    ? "text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--muted-foreground))]",
                )}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {hasMore && (
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] transition-colors",
                moreOpen
                  ? "text-[hsl(var(--primary))]"
                  : "text-[hsl(var(--muted-foreground))]",
              )}
            >
              <MoreHorizontal size={20} />
              <span>更多</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}

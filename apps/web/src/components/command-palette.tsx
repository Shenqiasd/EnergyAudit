"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import type { UserRole } from "@/lib/auth/auth-provider";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardCheck,
  Cpu,
  Database,
  FileText,
  Home,
  Layers,
  LayoutDashboard,
  ListChecks,
  Settings,
  Shield,
  Target,
  Wrench,
  type LucideIcon,
} from "lucide-react";

interface CommandItem {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords?: string[];
}

interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

const managerCommands: CommandGroup[] = [
  {
    heading: "页面导航",
    items: [
      { label: "工作台", href: "/manager/dashboard", icon: Home, keywords: ["首页", "dashboard"] },
      { label: "企业管理", href: "/manager/enterprises", icon: Building2, keywords: ["企业", "enterprise"] },
      { label: "批次管理", href: "/manager/batches", icon: Layers, keywords: ["批次", "batch"] },
      { label: "项目管理", href: "/manager/projects", icon: ClipboardCheck, keywords: ["项目", "project"] },
      { label: "审核管理", href: "/manager/reviews", icon: Shield, keywords: ["审核", "review"] },
      { label: "整改监管", href: "/manager/rectifications", icon: Wrench, keywords: ["整改", "rectification"] },
      { label: "台账管理", href: "/manager/ledgers", icon: FileText, keywords: ["台账", "ledger"] },
      { label: "统计分析", href: "/manager/statistics", icon: BarChart3, keywords: ["统计", "statistics"] },
      { label: "能效对标", href: "/manager/benchmarks", icon: Target, keywords: ["能效", "benchmark"] },
      { label: "消息通知", href: "/manager/notifications", icon: Bell, keywords: ["通知", "notification"] },
    ],
  },
  {
    heading: "快捷操作",
    items: [
      { label: "新建批次", href: "/manager/batches?action=create", icon: Layers, keywords: ["创建批次"] },
      { label: "新增企业", href: "/manager/enterprises?action=create", icon: Building2, keywords: ["创建企业"] },
      { label: "计算管理", href: "/manager/calculations", icon: Cpu, keywords: ["计算"] },
      { label: "业务类型", href: "/manager/business-types", icon: Settings, keywords: ["业务"] },
    ],
  },
];

const enterpriseCommands: CommandGroup[] = [
  {
    heading: "页面导航",
    items: [
      { label: "工作台", href: "/enterprise/dashboard", icon: LayoutDashboard, keywords: ["首页", "dashboard"] },
      { label: "数据填报", href: "/enterprise/filing", icon: Database, keywords: ["填报", "filing"] },
      { label: "报告管理", href: "/enterprise/reports", icon: FileText, keywords: ["报告", "report"] },
      { label: "整改任务", href: "/enterprise/rectification", icon: Wrench, keywords: ["整改", "rectification"] },
      { label: "企业配置", href: "/enterprise/config", icon: Settings, keywords: ["配置", "config"] },
      { label: "消息通知", href: "/enterprise/notifications", icon: Bell, keywords: ["通知", "notification"] },
    ],
  },
];

const reviewerCommands: CommandGroup[] = [
  {
    heading: "页面导航",
    items: [
      { label: "我的审核", href: "/reviewer/tasks", icon: ListChecks, keywords: ["审核", "review", "task"] },
      { label: "消息通知", href: "/reviewer/notifications", icon: Bell, keywords: ["通知", "notification"] },
    ],
  },
];

const commandsByRole: Record<UserRole, CommandGroup[]> = {
  manager: managerCommands,
  enterprise_user: enterpriseCommands,
  reviewer: reviewerCommands,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open || !user) return null;

  const groups = commandsByRole[user.role] ?? [];

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      {/* Dialog */}
      <div className="absolute left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2">
        <Command className="rounded-xl border border-[hsl(var(--border))] shadow-2xl">
          <CommandInput placeholder="搜索页面或操作... (Esc 关闭)" />
          <CommandList className="max-h-[360px]">
            <CommandEmpty>未找到匹配结果</CommandEmpty>
            {groups.map((group, idx) => (
              <div key={group.heading}>
                {idx > 0 && <CommandSeparator />}
                <CommandGroup heading={group.heading}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.href}
                        value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                        onSelect={() => handleSelect(item.href)}
                      >
                        <Icon className="mr-2 h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
                        <span>{item.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </div>
            ))}
          </CommandList>
        </Command>
      </div>
    </div>
  );
}

"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import {
  FolderOpen,
  FileEdit,
  Wrench,
  Bell,
  ArrowRight,
  ClipboardList,
  FileText,
  AlertCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const mockTodos = [
  {
    id: "1",
    type: "filing",
    title: "完成能源消费总量填报",
    description: "2026年度审计批次 — 模块：能源消费总量",
    deadline: "2026-04-15",
    priority: "high" as const,
  },
  {
    id: "2",
    type: "filing",
    title: "补充设备台账数据",
    description: "2026年度审计批次 — 模块：主要用能设备",
    deadline: "2026-04-20",
    priority: "medium" as const,
  },
  {
    id: "3",
    type: "rectification",
    title: "整改：能源计量器具配备不足",
    description: "审核问题 #12 — 严重度：重要",
    deadline: "2026-04-10",
    priority: "high" as const,
  },
  {
    id: "4",
    type: "notification",
    title: "审核报告已生成，请查看",
    description: "2026年度能源审计报告 v1.0",
    deadline: "",
    priority: "low" as const,
  },
];

const priorityConfig: Record<string, { label: string; variant: "danger" | "warning" | "default" }> = {
  high: { label: "紧急", variant: "danger" },
  medium: { label: "一般", variant: "warning" },
  low: { label: "提醒", variant: "default" },
};

const todoTypeIcons: Record<string, { icon: typeof FileEdit; iconBg: string; iconColor: string }> = {
  filing: { icon: FileEdit, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  rectification: { icon: Wrench, iconBg: "bg-red-50", iconColor: "text-red-600" },
  notification: { icon: Bell, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
};

const quickActions = [
  {
    icon: ClipboardList,
    label: "数据填报",
    description: "进入模块填报数据",
    href: "/enterprise/filing",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: FileText,
    label: "查看报告",
    description: "查阅最新审计报告",
    href: "/enterprise/reports",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: Wrench,
    label: "整改任务",
    description: "处理待办整改事项",
    href: "/enterprise/rectification",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

function formatDeadline(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const deadline = new Date(dateStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `已超期 ${Math.abs(diffDays)} 天`;
    if (diffDays === 0) return "今日到期";
    if (diffDays <= 3) return `剩余 ${diffDays} 天`;
    return `${diffDays} 天后到期`;
  } catch {
    return "";
  }
}

export default function EnterpriseDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="企业工作台"
        description="总览重点用能单位审计进度、处理待办事项及快捷办理业务"
      />

      {/* StatCards */}
      <motion.div
        className="grid gap-4 sm:grid-cols-3"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {[
          {
            icon: FolderOpen, label: "我的项目数", value: 3, accentColor: "blue" as const,
            trend: { direction: "up" as const, value: "+1", text: "本年度新增" },
            sparklineData: [1, 1, 2, 2, 3, 3, 3],
          },
          {
            icon: FileEdit, label: "待填报模块", value: 8, accentColor: "orange" as const,
            trend: { direction: "down" as const, value: "-2", text: "较上周减少" },
            sparklineData: [12, 11, 10, 10, 9, 8, 8],
          },
          {
            icon: Wrench, label: "待整改任务", value: 2, accentColor: "purple" as const,
            trend: { direction: "flat" as const, value: "0", text: "较上周持平" },
            sparklineData: [3, 2, 2, 3, 2, 2, 2],
          },
        ].map((card) => (
          <motion.div key={card.label} variants={fadeUp}>
            <StatCard {...card} />
          </motion.div>
        ))}
      </motion.div>

      {/* Todo List + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Todo List */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-[hsl(var(--border))] pb-4">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle size={16} className="text-[hsl(var(--primary))]" />
                待办事项
              </CardTitle>
              <Badge variant="default" className="font-mono tabular-nums">{mockTodos.length}</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {mockTodos.length === 0 ? (
                  <EmptyState
                    icon={<Bell className="h-7 w-7 text-[hsl(var(--muted-foreground))]" />}
                    title="暂无待办"
                    description="当前没有需要处理的待办事项，做得好！"
                  />
                ) : (
                  mockTodos.map((todo) => {
                    const typeConfig = todoTypeIcons[todo.type] ?? {
                      icon: Bell,
                      iconBg: "bg-[hsl(var(--muted))]",
                      iconColor: "text-[hsl(var(--muted-foreground))]",
                    };
                    const IconComponent = typeConfig.icon;
                    const priority = priorityConfig[todo.priority];
                    const deadlineText = formatDeadline(todo.deadline);

                    return (
                      <div
                        key={todo.id}
                        className="group flex items-start gap-3.5 rounded-xl border border-[hsl(var(--border))] p-3.5 transition-all hover:border-[hsl(var(--primary))/25] hover:bg-[hsl(var(--background))] hover:shadow-[var(--shadow-xs)]"
                      >
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${typeConfig.iconBg}`}>
                          <IconComponent size={17} className={typeConfig.iconColor} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <span className="text-sm font-medium text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                              {todo.title}
                            </span>
                            <Badge variant={priority.variant} className="shrink-0 text-[11px]">{priority.label}</Badge>
                          </div>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5">
                            {todo.description}
                          </p>
                          {deadlineText && (
                            <div className="flex items-center gap-1 text-xs font-medium text-red-500">
                              <Clock size={11} />
                              {deadlineText}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <p className="text-sm font-semibold text-[hsl(var(--foreground))] px-0.5">快捷办理</p>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className="block group">
                <Card className="hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-[hsl(var(--primary))/30] transition-all duration-200">
                  <div className="flex items-center gap-3.5 p-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${action.iconBg}`}>
                      <action.icon size={20} className={action.iconColor} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {action.label}
                        </span>
                        <div className="w-5 h-5 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))] group-hover:bg-[hsl(var(--primary))/10] group-hover:text-[hsl(var(--primary))] transition-colors">
                          <ArrowRight size={12} />
                        </div>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

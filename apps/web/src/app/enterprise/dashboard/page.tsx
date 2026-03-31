"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
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

// Mock data for todos (will be replaced by notifications API)
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

const todoTypeIcons: Record<string, { icon: typeof FileEdit; color: string; bg: string }> = {
  filing: { icon: FileEdit, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/40" },
  rectification: { icon: Wrench, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/40" },
  notification: { icon: Bell, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/40" },
};

const quickActions = [
  {
    icon: ClipboardList,
    label: "数据填报",
    description: "进入模块填报数据",
    href: "/enterprise/filing",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20"
  },
  {
    icon: FileText,
    label: "查看报告",
    description: "查阅最新审计报告",
    href: "/enterprise/reports",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20"
  },
  {
    icon: Wrench,
    label: "整改任务",
    description: "处理待办整改事项",
    href: "/enterprise/rectification",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20"
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
    <div className="space-y-8">
      <PageHeader
        title="企业工作台"
        description="总览重点用能单位审计进度、处理待办事项及快捷办理业务"
      />

      {/* StatCards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard
          icon={FolderOpen}
          label="我的项目数"
          value={3}
          accentColor="blue"
          trend={{ direction: "up", value: "+1", text: "本年度新增" }}
          sparklineData={[1, 1, 2, 2, 3, 3, 3]}
        />
        <StatCard
          icon={FileEdit}
          label="待填报模块"
          value={8}
          accentColor="orange"
          trend={{ direction: "down", value: "-2", text: "较上周减少" }}
          sparklineData={[12, 11, 10, 10, 9, 8, 8]}
        />
        <StatCard
          icon={Wrench}
          label="待整改任务"
          value={2}
          accentColor="purple"
          trend={{ direction: "flat", value: "0", text: "较上周持平" }}
          sparklineData={[3, 2, 2, 3, 2, 2, 2]}
        />
      </div>

      {/* Todo List + Quick Actions */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Todo List - takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[hsl(var(--border))] pb-4 mb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle size={20} className="text-[hsl(var(--primary))]" />
              待办事项
            </CardTitle>
            <Badge variant="secondary" className="font-mono">{mockTodos.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTodos.length === 0 ? (
                <EmptyState
                  icon={<Bell className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />}
                  title="暂无待办"
                  description="当前没有需要处理的待办事项，做得好！"
                />
              ) : (
                mockTodos.map((todo) => {
                  const typeConfig = todoTypeIcons[todo.type] ?? {
                    icon: Bell,
                    color: "text-[hsl(var(--muted-foreground))]",
                    bg: "bg-[hsl(var(--muted))]"
                  };
                  const IconComponent = typeConfig.icon;
                  const priority = priorityConfig[todo.priority];
                  const deadlineText = formatDeadline(todo.deadline);

                  return (
                    <div
                      key={todo.id}
                      className="group flex items-start gap-4 rounded-xl border border-[hsl(var(--border))] p-4 transition-all hover:bg-[hsl(var(--muted))/30] hover:shadow-sm hover:border-[hsl(var(--primary))/30]"
                    >
                      <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeConfig.bg}`}>
                        <IconComponent size={20} className={typeConfig.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-sm font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                            {todo.title}
                          </span>
                          <Badge variant={priority.variant} className="shrink-0">{priority.label}</Badge>
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed mb-2">
                          {todo.description}
                        </p>
                        {deadlineText && (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                            <Clock size={12} />
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

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))] tracking-tight pl-1">
            快捷办理
          </h3>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className="block">
                <Card className="group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md border-[hsl(var(--border))] hover:border-[hsl(var(--primary))/40]">
                  <div className="flex items-center gap-4 p-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${action.bg}`}>
                      <action.icon
                        size={24}
                        className={action.color}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                          {action.label}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))] group-hover:bg-[hsl(var(--primary))] group-hover:text-white transition-colors">
                          <ArrowRight size={14} />
                        </div>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

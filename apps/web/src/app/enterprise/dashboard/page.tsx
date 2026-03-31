"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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

const todoTypeIcons: Record<string, { icon: typeof FileEdit; color: string }> = {
  filing: { icon: FileEdit, color: "text-blue-500" },
  rectification: { icon: Wrench, color: "text-red-500" },
  notification: { icon: Bell, color: "text-orange-500" },
};

const quickActions = [
  {
    icon: ClipboardList,
    label: "数据填报",
    description: "进入填报模块",
    href: "/enterprise/filing",
  },
  {
    icon: FileText,
    label: "查看报告",
    description: "查看审计报告",
    href: "/enterprise/reports",
  },
  {
    icon: Wrench,
    label: "整改任务",
    description: "处理整改事项",
    href: "/enterprise/rectifications",
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
        title="工作台"
        description="企业端工作台 — 查看审计进度、待办事项和数据概览"
      />

      {/* StatCards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={FolderOpen}
          label="我的项目数"
          value={3}
          accentColor="blue"
          trend={{ direction: "up", value: "+1", text: "本月新增" }}
          sparklineData={[1, 1, 2, 2, 3, 3, 3]}
        />
        <StatCard
          icon={FileEdit}
          label="待填报模块"
          value={8}
          accentColor="orange"
          trend={{ direction: "down", value: "-2", text: "较上周" }}
          sparklineData={[12, 11, 10, 10, 9, 8, 8]}
        />
        <StatCard
          icon={Wrench}
          label="待整改任务"
          value={2}
          accentColor="purple"
          trend={{ direction: "flat", value: "0", text: "较上周" }}
          sparklineData={[3, 2, 2, 3, 2, 2, 2]}
        />
      </div>

      {/* Todo List + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Todo List - takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle size={18} className="text-orange-500" />
              待办事项
            </CardTitle>
            <Badge variant="warning">{mockTodos.length}</Badge>
          </CardHeader>
          <div className="space-y-3">
            {mockTodos.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />}
                title="暂无待办"
                description="当前没有需要处理的待办事项"
              />
            ) : (
              mockTodos.map((todo) => {
                const typeConfig = todoTypeIcons[todo.type] ?? {
                  icon: Bell,
                  color: "text-gray-500",
                };
                const IconComponent = typeConfig.icon;
                const priority = priorityConfig[todo.priority];
                const deadlineText = formatDeadline(todo.deadline);

                return (
                  <div
                    key={todo.id}
                    className="flex items-start gap-3 rounded-lg border border-[hsl(var(--border))] p-3 transition-colors hover:bg-[hsl(var(--muted))]/50"
                  >
                    <div className="mt-0.5">
                      <IconComponent size={16} className={typeConfig.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {todo.title}
                        </span>
                        <Badge variant={priority.variant}>{priority.label}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                        {todo.description}
                      </p>
                      {deadlineText && (
                        <p className="mt-1 text-xs font-medium text-red-500">
                          {deadlineText}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
            快捷操作
          </h3>
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="group mb-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/10">
                    <action.icon
                      size={22}
                      className="text-[hsl(var(--primary))]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        {action.label}
                      </span>
                      <ArrowRight
                        size={16}
                        className="text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-1"
                      />
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
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
  );
}

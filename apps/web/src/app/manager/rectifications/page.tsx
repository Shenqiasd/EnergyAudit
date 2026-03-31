"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Loading } from "@/components/ui/loading";
import {
  useRectificationTasks,
  useRectificationStats,
} from "@/lib/api/hooks/use-rectifications";

const STATUS_LABELS: Record<string, string> = {
  pending_issue: "待下发",
  pending_claim: "待认领",
  in_progress: "整改中",
  pending_acceptance: "待验收",
  completed: "已完成",
  delayed: "已延期",
  closed: "已关闭",
};

const STATUS_VARIANTS: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
  pending_issue: "default",
  pending_claim: "primary",
  in_progress: "warning",
  pending_acceptance: "warning",
  completed: "success",
  delayed: "danger",
  closed: "default",
};

const KANBAN_COLUMNS = [
  { status: "pending_issue", label: "待下发" },
  { status: "pending_claim", label: "待认领" },
  { status: "in_progress", label: "整改中" },
  { status: "pending_acceptance", label: "待验收" },
  { status: "completed", label: "已完成" },
];

export default function ManagerRectificationsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useRectificationTasks({
    status: statusFilter || undefined,
  });
  const { data: stats } = useRectificationStats();

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">整改监管</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          监控所有整改任务进度，跟踪完成情况
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.total}</div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">总计</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.completionRate}</div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">完成率</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{stats.overdueCount}</div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">延期数</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">
              {stats.statusCounts["in_progress"] ?? 0}
            </div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">进行中</div>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "全部状态" },
            ...KANBAN_COLUMNS.map((col) => ({ value: col.status, label: col.label })),
            { value: "delayed", label: "已延期" },
            { value: "closed", label: "已关闭" },
          ]}
        />
      </div>

      {isLoading ? (
        <Loading />
      ) : !items.length ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Wrench size={20} />
                暂无整改任务
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((task) => (
            <Card key={task.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-[hsl(var(--foreground))] truncate">
                  {task.title}
                </span>
                <Badge variant={STATUS_VARIANTS[task.status] ?? "default"}>
                  {STATUS_LABELS[task.status] ?? task.status}
                </Badge>
              </div>
              {task.description && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
                  {task.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                <span>项目: {task.auditProjectId}</span>
                {task.deadline && (
                  <span>截止: {new Date(task.deadline).toLocaleDateString("zh-CN")}</span>
                )}
              </div>
              {task.isOverdue && (
                <Badge variant="danger">已延期</Badge>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

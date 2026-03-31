"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loading } from "@/components/ui/loading";
import { useReviewTasks } from "@/lib/api/hooks/use-reviews";

const STATUS_LABELS: Record<string, string> = {
  pending_assignment: "待分配",
  assigned: "已分配",
  in_review: "审核中",
  pending_confirmation: "待确认",
  returned: "已退回",
  completed: "已完成",
  closed: "已关闭",
};

const STATUS_VARIANTS: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
  pending_assignment: "default",
  assigned: "primary",
  in_review: "warning",
  pending_confirmation: "warning",
  returned: "danger",
  completed: "success",
  closed: "default",
};

export default function ManagerReviewsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useReviewTasks({
    status: statusFilter || undefined,
  });

  const items = data?.items ?? [];
  const pendingCount = items.filter((t) => t.status === "pending_assignment").length;
  const inProgressCount = items.filter((t) => ["assigned", "in_review", "pending_confirmation"].includes(t.status)).length;
  const completedCount = items.filter((t) => t.status === "completed" || t.status === "closed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">审核管理</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          管理审核任务分配、审核进度监控和整改督办
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{pendingCount}</div>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">待分配</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">{inProgressCount}</div>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">进行中</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{completedCount}</div>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">已完成</div>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "全部状态" },
            { value: "pending_assignment", label: "待分配" },
            { value: "assigned", label: "已分配" },
            { value: "in_review", label: "审核中" },
            { value: "pending_confirmation", label: "待确认" },
            { value: "returned", label: "已退回" },
            { value: "completed", label: "已完成" },
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
                <Shield size={20} />
                暂无审核任务
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((task) => (
            <Link key={task.id} href={`/manager/reviews/${task.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[hsl(var(--foreground))]">
                        审核任务
                      </span>
                      <Badge variant={STATUS_VARIANTS[task.status] ?? "default"}>
                        {STATUS_LABELS[task.status] ?? task.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      项目 ID: {task.auditProjectId}
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      审核员 ID: {task.reviewerId}
                    </div>
                  </div>
                  {task.status === "pending_assignment" && (
                    <Button size="sm" variant="secondary">
                      <UserPlus size={14} className="mr-1" />
                      分配审核员
                    </Button>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

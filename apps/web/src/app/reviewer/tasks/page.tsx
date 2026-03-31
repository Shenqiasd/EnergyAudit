"use client";

import { useState } from "react";
import Link from "next/link";
import { ListChecks, Play, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
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

export default function ReviewerTasksPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useReviewTasks({
    status: statusFilter || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="我的审核"
        description="查看分配给我的审核任务，进行审核评分"
      />

      <div className="flex items-center gap-4">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "全部状态" },
            { value: "assigned", label: "已分配" },
            { value: "in_review", label: "审核中" },
            { value: "pending_confirmation", label: "待确认" },
            { value: "returned", label: "已退回" },
          ]}
        />
      </div>

      {isLoading ? (
        <Loading />
      ) : !data?.items.length ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <ListChecks size={20} />
                暂无审核任务
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {data.items.map((task) => (
            <Link key={task.id} href={`/reviewer/tasks/${task.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text)]">
                        审核任务
                      </span>
                      <Badge variant={STATUS_VARIANTS[task.status] ?? "default"}>
                        {STATUS_LABELS[task.status] ?? task.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      项目 ID: {task.auditProjectId}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      分配时间: {task.assignedAt ? new Date(task.assignedAt).toLocaleDateString("zh-CN") : "未分配"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === "assigned" && (
                      <Button size="sm" variant="secondary">
                        <Play size={14} className="mr-1" />
                        开始审核
                      </Button>
                    )}
                    {task.status === "in_review" && (
                      <Button size="sm" variant="secondary">
                        <Send size={14} className="mr-1" />
                        提交结论
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

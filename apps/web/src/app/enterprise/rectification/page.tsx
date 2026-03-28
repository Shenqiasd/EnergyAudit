"use client";

import { useState } from "react";
import Link from "next/link";
import { Wrench, Hand, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Loading } from "@/components/ui/loading";
import {
  useRectificationTasks,
  useClaimRectification,
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

export default function EnterpriseRectificationPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useRectificationTasks({
    status: statusFilter || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">整改任务</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          查看审核发现的问题，提交整改方案和完成情况
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "全部状态" },
            { value: "pending_claim", label: "待认领" },
            { value: "in_progress", label: "整改中" },
            { value: "pending_acceptance", label: "待验收" },
            { value: "completed", label: "已完成" },
            { value: "delayed", label: "已延期" },
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
                <Wrench size={20} />
                暂无整改任务
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {data.items.map((task) => (
            <RectificationTaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function RectificationTaskCard({ task }: {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    deadline: string | null;
    isOverdue: boolean;
    auditProjectId: string;
  };
}) {
  const claimTask = useClaimRectification(task.id);

  return (
    <Link href={`/enterprise/rectification/${task.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--color-text)]">{task.title}</span>
              <Badge variant={STATUS_VARIANTS[task.status] ?? "default"}>
                {STATUS_LABELS[task.status] ?? task.status}
              </Badge>
              {task.isOverdue && <Badge variant="danger">延期</Badge>}
            </div>
            {task.description && (
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-1">
                {task.description}
              </p>
            )}
            <div className="text-xs text-[var(--color-text-secondary)]">
              {task.deadline && (
                <span>截止: {new Date(task.deadline).toLocaleDateString("zh-CN")}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
            {task.status === "pending_claim" && (
              <Button
                size="sm"
                onClick={() => claimTask.mutate()}
                disabled={claimTask.isPending}
              >
                <Hand size={14} className="mr-1" />
                认领
              </Button>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, Send, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { DetailHeader } from "@/components/detail/detail-header";
import { InfoGrid } from "@/components/detail/info-grid";
import { Timeline } from "@/components/detail/timeline";
import type { TimelineItem } from "@/components/detail/timeline";
import {
  useRectificationTask,
  useClaimRectification,
  useUpdateProgress,
  useSubmitRectification,
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

export default function EnterpriseRectificationDetailPage() {
  const params = useParams();
  const taskId = params.id as string;

  const [progressPercent, setProgressPercent] = useState(0);
  const [progressNote, setProgressNote] = useState("");

  const { data: task, isLoading } = useRectificationTask(taskId);
  const claimTask = useClaimRectification(taskId);
  const updateProgress = useUpdateProgress(taskId);
  const submitTask = useSubmitRectification(taskId);

  if (isLoading) return <Loading />;
  if (!task) return <div>整改任务不存在</div>;

  const actionButtons = (
    <div className="flex items-center gap-2">
      {task.status === "pending_claim" && (
        <Button
          onClick={() => claimTask.mutate()}
          disabled={claimTask.isPending}
        >
          认领任务
        </Button>
      )}
    </div>
  );

  const progressItems: TimelineItem[] = (task.progress ?? []).map((entry) => ({
    id: entry.id,
    avatar: (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100">
        <span className="text-[8px] font-bold text-blue-600">{entry.progressPercent}%</span>
      </div>
    ),
    title: `进度 ${entry.progressPercent}%`,
    description: entry.note,
    timestamp: new Date(entry.createdAt).toLocaleString("zh-CN"),
    type: entry.progressPercent >= 100 ? "success" as const : "default" as const,
  }));

  return (
    <div className="space-y-6">
      <DetailHeader
        icon={<AlertCircle size={20} />}
        title={task.title}
        subtitle={`项目: ${task.auditProjectId}`}
        badges={
          <>
            <Badge>{STATUS_LABELS[task.status] ?? task.status}</Badge>
            {task.isOverdue && <Badge variant="danger">已延期</Badge>}
          </>
        }
        metadata={[
          { label: "截止日期", value: task.deadline ? new Date(task.deadline).toLocaleDateString("zh-CN") : "未设置" },
        ]}
        actions={actionButtons}
        backHref="/enterprise/rectification"
        backLabel="返回列表"
      />

      <Card>
        <CardHeader>
          <CardTitle>任务信息</CardTitle>
        </CardHeader>
        <InfoGrid
          columns={2}
          items={[
            { label: "项目 ID", value: task.auditProjectId },
            { label: "截止日期", value: task.deadline ? new Date(task.deadline).toLocaleDateString("zh-CN") : "未设置" },
            { label: "当前状态", value: STATUS_LABELS[task.status] ?? task.status },
          ]}
        />
        {task.description && (
          <div className="mt-4 rounded-lg bg-[hsl(var(--muted))] p-3">
            <p className="text-sm text-[hsl(var(--foreground))]">{task.description}</p>
          </div>
        )}
      </Card>

      {task.status === "in_progress" && (
        <Card className="p-4 space-y-4">
          <CardHeader className="p-0">
            <CardTitle>更新进度</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-[hsl(var(--foreground))]">
                完成百分比: {progressPercent}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercent}
                onChange={(e) => setProgressPercent(Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <textarea
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              placeholder="整改说明..."
              className="w-full min-h-[100px] p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] resize-y"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  updateProgress.mutate({
                    progressPercent,
                    note: progressNote,
                    recordedBy: "current-user",
                  });
                  setProgressNote("");
                }}
                disabled={!progressNote || updateProgress.isPending}
              >
                <Upload size={14} className="mr-1" />
                提交进度
              </Button>
              <Button
                variant="secondary"
                onClick={() => submitTask.mutate()}
                disabled={submitTask.isPending}
              >
                <Send size={14} className="mr-1" />
                提交验收
              </Button>
            </div>
          </div>
        </Card>
      )}

      {progressItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>进度时间线</CardTitle>
          </CardHeader>
          <Timeline items={progressItems} />
        </Card>
      )}
    </div>
  );
}

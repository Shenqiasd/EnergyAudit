"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
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
  const router = useRouter();
  const taskId = params.id as string;

  const [progressPercent, setProgressPercent] = useState(0);
  const [progressNote, setProgressNote] = useState("");

  const { data: task, isLoading } = useRectificationTask(taskId);
  const claimTask = useClaimRectification(taskId);
  const updateProgress = useUpdateProgress(taskId);
  const submitTask = useSubmitRectification(taskId);

  if (isLoading) return <Loading />;
  if (!task) return <div>整改任务不存在</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" onClick={() => router.push("/enterprise/rectification")}>
          <ArrowLeft size={16} className="mr-1" />
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{task.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge>{STATUS_LABELS[task.status] ?? task.status}</Badge>
            {task.isOverdue && <Badge variant="danger">已延期</Badge>}
          </div>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <CardHeader className="p-0">
          <CardTitle>任务信息</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[var(--color-text-secondary)]">项目 ID: </span>
            <span className="text-[var(--color-text)]">{task.auditProjectId}</span>
          </div>
          <div>
            <span className="text-[var(--color-text-secondary)]">截止日期: </span>
            <span className="text-[var(--color-text)]">
              {task.deadline ? new Date(task.deadline).toLocaleDateString("zh-CN") : "未设置"}
            </span>
          </div>
        </div>
        {task.description && (
          <p className="text-sm text-[var(--color-text)]">{task.description}</p>
        )}

        {task.status === "pending_claim" && (
          <Button
            onClick={() => claimTask.mutate()}
            disabled={claimTask.isPending}
          >
            认领任务
          </Button>
        )}
      </Card>

      {task.status === "in_progress" && (
        <Card className="p-4 space-y-4">
          <CardHeader className="p-0">
            <CardTitle>更新进度</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-[var(--color-text)]">
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
              className="w-full min-h-[100px] p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] resize-y"
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

      {task.progress && task.progress.length > 0 && (
        <Card className="p-4 space-y-3">
          <CardHeader className="p-0">
            <CardTitle>进度时间线</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {task.progress.map((entry) => (
              <div key={entry.id} className="flex gap-3 p-3 rounded border border-[var(--color-border)]">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">
                    {entry.progressPercent}%
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[var(--color-text)]">{entry.note}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {new Date(entry.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

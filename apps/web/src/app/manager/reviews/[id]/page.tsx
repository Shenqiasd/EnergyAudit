"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, RotateCcw, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import {
  useReviewTask,
  useAssignReviewer,
  useConfirmReview,
  useReturnReview,
  useReviewScores,
  useReviewIssues,
} from "@/lib/api/hooks/use-reviews";

const STATUS_LABELS: Record<string, string> = {
  pending_assignment: "待分配",
  assigned: "已分配",
  in_review: "审核中",
  pending_confirmation: "待确认",
  returned: "已退回",
  completed: "已完成",
  closed: "已关闭",
};

const SEVERITY_LABELS: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "严重",
};

const SEVERITY_VARIANTS: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
  low: "default",
  medium: "primary",
  high: "warning",
  critical: "danger",
};

export default function ManagerReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [reviewerId, setReviewerId] = useState("");

  const { data: task, isLoading } = useReviewTask(taskId);
  const { data: scoresData } = useReviewScores(taskId);
  const { data: issuesData } = useReviewIssues(taskId);

  const assignReviewer = useAssignReviewer(taskId);
  const confirmReview = useConfirmReview(taskId);
  const returnReview = useReturnReview(taskId);

  if (isLoading) return <Loading />;
  if (!task) return <div>审核任务不存在</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" onClick={() => router.push("/manager/reviews")}>
          <ArrowLeft size={16} className="mr-1" />
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">审核详情</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge>{STATUS_LABELS[task.status] ?? task.status}</Badge>
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              项目: {task.auditProjectId}
            </span>
          </div>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <CardHeader className="p-0">
          <CardTitle>任务信息</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[hsl(var(--muted-foreground))]">审核员 ID: </span>
            <span className="text-[hsl(var(--foreground))]">{task.reviewerId}</span>
          </div>
          <div>
            <span className="text-[hsl(var(--muted-foreground))]">总分: </span>
            <span className="text-[hsl(var(--foreground))]">{task.totalScore ?? "未评分"}</span>
          </div>
          <div>
            <span className="text-[hsl(var(--muted-foreground))]">分配时间: </span>
            <span className="text-[hsl(var(--foreground))]">
              {task.assignedAt ? new Date(task.assignedAt).toLocaleString("zh-CN") : "-"}
            </span>
          </div>
          <div>
            <span className="text-[hsl(var(--muted-foreground))]">完成时间: </span>
            <span className="text-[hsl(var(--foreground))]">
              {task.completedAt ? new Date(task.completedAt).toLocaleString("zh-CN") : "-"}
            </span>
          </div>
        </div>

        {task.status === "pending_assignment" && (
          <div className="flex items-center gap-2 pt-3 border-t border-[hsl(var(--border))]">
            <Input
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              placeholder="输入审核员 ID"
              className="max-w-xs"
            />
            <Button
              onClick={() => assignReviewer.mutate(reviewerId)}
              disabled={!reviewerId || assignReviewer.isPending}
            >
              <UserPlus size={14} className="mr-1" />
              分配
            </Button>
          </div>
        )}

        {task.status === "pending_confirmation" && (
          <div className="flex items-center gap-2 pt-3 border-t border-[hsl(var(--border))]">
            <Button
              onClick={() => confirmReview.mutate()}
              disabled={confirmReview.isPending}
            >
              <CheckCircle size={14} className="mr-1" />
              确认通过
            </Button>
            <Button
              variant="secondary"
              onClick={() => returnReview.mutate()}
              disabled={returnReview.isPending}
            >
              <RotateCcw size={14} className="mr-1" />
              退回修改
            </Button>
          </div>
        )}
      </Card>

      {task.conclusion && (
        <Card className="p-4 space-y-3">
          <CardHeader className="p-0">
            <CardTitle>审核结论</CardTitle>
          </CardHeader>
          <p className="text-sm text-[hsl(var(--foreground))]">{task.conclusion}</p>
        </Card>
      )}

      {scoresData && scoresData.scores.length > 0 && (
        <Card className="p-4 space-y-3">
          <CardHeader className="p-0">
            <CardTitle>评分详情</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {scoresData.scores.map((score) => (
              <div key={score.id} className="flex items-center justify-between p-2 rounded bg-[hsl(var(--muted))]">
                <span className="text-sm text-[hsl(var(--foreground))]">{score.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                    {score.score} / {score.maxScore}
                  </span>
                  {score.comment && (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {score.comment}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-[hsl(var(--border))]">
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
              总分: {scoresData.totalScore} / {scoresData.totalMaxScore}，
              平均分: {scoresData.averageScore.toFixed(1)}
            </span>
          </div>
        </Card>
      )}

      {issuesData && issuesData.length > 0 && (
        <Card className="p-4 space-y-3">
          <CardHeader className="p-0">
            <CardTitle>审核问题 ({issuesData.length})</CardTitle>
          </CardHeader>
          {issuesData.map((issue) => (
            <div key={issue.id} className="p-3 rounded border border-[hsl(var(--border))]">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[hsl(var(--foreground))]">{issue.description}</span>
                <Badge variant={SEVERITY_VARIANTS[issue.severity] ?? "default"}>
                  {SEVERITY_LABELS[issue.severity] ?? issue.severity}
                </Badge>
              </div>
              {issue.suggestion && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  建议: {issue.suggestion}
                </p>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

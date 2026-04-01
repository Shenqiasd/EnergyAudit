"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, FileText, RotateCcw, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { DetailSkeleton } from "@/components/skeleton/detail-skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DetailHeader } from "@/components/detail/detail-header";
import { InfoGrid } from "@/components/detail/info-grid";
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

  if (isLoading) return <DetailSkeleton />;
  if (!task) return <div>审核任务不存在</div>;

  const actionButtons = (
    <div className="flex items-center gap-2">
      {task.status === "pending_assignment" && (
        <>
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
        </>
      )}
      {task.status === "pending_confirmation" && (
        <>
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
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <DetailHeader
        icon={<FileText size={20} />}
        title="审核详情"
        subtitle={`项目: ${task.auditProjectId}`}
        badges={<Badge>{STATUS_LABELS[task.status] ?? task.status}</Badge>}
        metadata={[
          { label: "审核员", value: task.reviewerId ?? "未分配" },
          { label: "总分", value: task.totalScore ?? "未评分" },
        ]}
        actions={actionButtons}
        backHref="/manager/reviews"
        backLabel="返回列表"
      />

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">任务信息</TabsTrigger>
          <TabsTrigger value="scores">评分详情</TabsTrigger>
          <TabsTrigger value="issues">审核问题</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>任务信息</CardTitle>
            </CardHeader>
            <InfoGrid
              columns={2}
              items={[
                { label: "审核员 ID", value: task.reviewerId ?? "未分配" },
                { label: "总分", value: task.totalScore ?? "未评分" },
                { label: "分配时间", value: task.assignedAt ? new Date(task.assignedAt).toLocaleString("zh-CN") : "-" },
                { label: "完成时间", value: task.completedAt ? new Date(task.completedAt).toLocaleString("zh-CN") : "-" },
              ]}
            />
            {task.conclusion && (
              <div className="mt-4 rounded-lg bg-[hsl(var(--muted))] p-3">
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">审核结论</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{task.conclusion}</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="scores">
          <Card>
            <CardHeader>
              <CardTitle>评分详情</CardTitle>
            </CardHeader>
            {scoresData && scoresData.scores.length > 0 ? (
              <>
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
              </>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">暂无评分数据</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>审核问题 ({issuesData?.length ?? 0})</CardTitle>
            </CardHeader>
            {issuesData && issuesData.length > 0 ? (
              <div className="space-y-3">
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
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">暂无问题记录</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

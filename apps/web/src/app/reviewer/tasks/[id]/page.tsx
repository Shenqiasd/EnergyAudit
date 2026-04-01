"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, ClipboardCheck, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loading } from "@/components/ui/loading";
import { DetailSkeleton } from "@/components/skeleton/detail-skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DetailHeader } from "@/components/detail/detail-header";
import {
  useReviewTask,
  useStartReview,
  useSubmitReview,
  useReviewScores,
  useSubmitScores,
  useReviewIssues,
  useCreateIssue,
  useResolveIssue,
} from "@/lib/api/hooks/use-reviews";
import type { ScoreInput } from "@/lib/api/hooks/use-reviews";

const STATUS_LABELS: Record<string, string> = {
  pending_assignment: "待分配",
  assigned: "已分配",
  in_review: "审核中",
  pending_confirmation: "待确认",
  returned: "已退回",
  completed: "已完成",
  closed: "已关闭",
};

const SCORE_CATEGORIES = [
  { key: "数据完整性", maxScore: "20" },
  { key: "数据准确性", maxScore: "20" },
  { key: "合规性", maxScore: "20" },
  { key: "节能措施可行性", maxScore: "20" },
  { key: "报告质量", maxScore: "20" },
];

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

export default function ReviewWorkbenchPage() {
  const params = useParams();
  const taskId = params.id as string;

  const [conclusion, setConclusion] = useState("");
  const [scores, setScores] = useState<ScoreInput[]>(
    SCORE_CATEGORIES.map((c) => ({
      category: c.key,
      score: "0",
      maxScore: c.maxScore,
      comment: "",
    }))
  );

  const [newIssue, setNewIssue] = useState({
    description: "",
    severity: "medium",
    suggestion: "",
  });

  const { data: task, isLoading } = useReviewTask(taskId);
  const { data: scoresData } = useReviewScores(taskId);
  const { data: issuesData } = useReviewIssues(taskId);

  const startReview = useStartReview(taskId);
  const submitReview = useSubmitReview(taskId);
  const submitScores = useSubmitScores(taskId);
  const createIssue = useCreateIssue(taskId);

  if (isLoading) return <DetailSkeleton />;
  if (!task) return <div>审核任务不存在</div>;

  const handleScoreChange = (index: number, value: string) => {
    const updated = [...scores];
    updated[index] = { ...updated[index], score: value };
    setScores(updated);
  };

  const handleScoreCommentChange = (index: number, value: string) => {
    const updated = [...scores];
    updated[index] = { ...updated[index], comment: value };
    setScores(updated);
  };

  const totalScore = scores.reduce((sum, s) => sum + Number(s.score), 0);

  const actionButtons = (
    <div className="flex items-center gap-2">
      {task.status === "assigned" && (
        <Button onClick={() => startReview.mutate()}>
          开始审核
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <DetailHeader
        icon={<ClipboardCheck size={20} />}
        title="审核工作台"
        subtitle={`项目: ${task.auditProjectId}`}
        badges={<Badge>{STATUS_LABELS[task.status] ?? task.status}</Badge>}
        metadata={[
          { label: "审核员", value: task.reviewerId ?? "未分配" },
          { label: "总分", value: task.totalScore ?? "未评分" },
        ]}
        actions={actionButtons}
        backHref="/reviewer/tasks"
        backLabel="返回列表"
      />

      <Tabs defaultValue="scores">
        <TabsList>
          <TabsTrigger value="scores">评分表</TabsTrigger>
          <TabsTrigger value="issues">问题登记</TabsTrigger>
          <TabsTrigger value="conclusion">审核结论</TabsTrigger>
        </TabsList>

        <TabsContent value="scores">
          <Card className="p-4 space-y-4">
            <CardHeader className="p-0">
              <CardTitle>审核评分</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              {scores.map((score, index) => (
                <div key={score.category} className="grid grid-cols-[1fr_120px_1fr] gap-4 items-start">
                  <div>
                    <label className="text-sm font-medium text-[hsl(var(--foreground))]">
                      {score.category}
                    </label>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      满分 {score.maxScore} 分
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max={score.maxScore}
                    value={score.score}
                    onChange={(e) => handleScoreChange(index, e.target.value)}
                    placeholder="分数"
                  />
                  <Input
                    value={score.comment ?? ""}
                    onChange={(e) => handleScoreCommentChange(index, e.target.value)}
                    placeholder="评价说明"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
              <span className="text-lg font-bold text-[hsl(var(--foreground))]">
                总分: {totalScore} / 100
              </span>
              <Button
                onClick={() => submitScores.mutate(scores)}
                disabled={submitScores.isPending}
              >
                提交评分
              </Button>
            </div>
            {scoresData && scoresData.scores.length > 0 && (
              <div className="mt-4 p-3 bg-[hsl(var(--muted))] rounded">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  已保存评分 - 总分: {scoresData.totalScore} / {scoresData.totalMaxScore}，
                  平均分: {scoresData.averageScore.toFixed(1)}
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <div className="space-y-4">
            <Card className="p-4 space-y-4">
              <CardHeader className="p-0">
                <CardTitle>登记问题</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                <Input
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                  placeholder="问题描述"
                />
                <div className="flex gap-3">
                  <Select
                    value={newIssue.severity}
                    onChange={(e) => setNewIssue({ ...newIssue, severity: e.target.value })}
                    options={[
                      { value: "low", label: "低" },
                      { value: "medium", label: "中" },
                      { value: "high", label: "高" },
                      { value: "critical", label: "严重" },
                    ]}
                  />
                  <Input
                    value={newIssue.suggestion}
                    onChange={(e) => setNewIssue({ ...newIssue, suggestion: e.target.value })}
                    placeholder="整改建议"
                    className="flex-1"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (newIssue.description) {
                      createIssue.mutate({
                        description: newIssue.description,
                        severity: newIssue.severity,
                        suggestion: newIssue.suggestion || undefined,
                        requiresRectification: true,
                      });
                      setNewIssue({ description: "", severity: "medium", suggestion: "" });
                    }
                  }}
                  disabled={!newIssue.description || createIssue.isPending}
                >
                  添加问题
                </Button>
              </div>
            </Card>

            {issuesData && issuesData.length > 0 && (
              <Card className="p-4 space-y-3">
                <CardHeader className="p-0">
                  <CardTitle>已登记问题 ({issuesData.length})</CardTitle>
                </CardHeader>
                {issuesData.map((issue) => (
                  <IssueItem key={issue.id} issue={issue} />
                ))}
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="conclusion">
          <Card className="p-4 space-y-4">
            <CardHeader className="p-0">
              <CardTitle>审核结论</CardTitle>
            </CardHeader>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="请输入审核结论..."
              className="w-full min-h-[200px] p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] resize-y"
            />
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  submitReview.mutate({
                    conclusion,
                    totalScore: String(totalScore),
                  })
                }
                disabled={!conclusion || submitReview.isPending}
              >
                <Send size={14} className="mr-1" />
                提交审核结论
              </Button>
            </div>
            {task.conclusion && (
              <div className="mt-4 p-3 bg-[hsl(var(--muted))] rounded">
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">已提交的结论:</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                  {task.conclusion}
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IssueItem({ issue }: { issue: { id: string; description: string; severity: string; suggestion: string | null; requiresRectification: boolean } }) {
  const resolveIssue = useResolveIssue(issue.id);

  return (
    <div className="flex items-start justify-between p-3 rounded border border-[hsl(var(--border))]">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[hsl(var(--foreground))]">{issue.description}</span>
          <Badge variant={SEVERITY_VARIANTS[issue.severity] ?? "default"}>
            {SEVERITY_LABELS[issue.severity] ?? issue.severity}
          </Badge>
        </div>
        {issue.suggestion && (
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            建议: {issue.suggestion}
          </p>
        )}
      </div>
      {issue.requiresRectification && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => resolveIssue.mutate()}
          disabled={resolveIssue.isPending}
        >
          <CheckCircle size={14} className="mr-1" />
          标记解决
        </Button>
      )}
    </div>
  );
}

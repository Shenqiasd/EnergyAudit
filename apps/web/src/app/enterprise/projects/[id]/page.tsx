"use client";

import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { EnterpriseProfileCard } from "@/components/enterprise-profile-card";
import { useAuditProject, useProjectTimeline } from "@/lib/api/hooks/use-audit-projects";
import { ArrowLeft, AlertTriangle, Clock } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending_start: "待启动",
  configuring: "配置中",
  filing: "填报中",
  pending_submit: "待提交",
  pending_report: "待生成报告",
  report_processing: "报告处理中",
  pending_review: "待审核",
  in_review: "审核中",
  pending_rectification: "待整改",
  in_rectification: "整改中",
  completed: "已完成",
  closed: "已关闭",
};

const STATUS_VARIANTS: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
  pending_start: "default",
  configuring: "primary",
  filing: "primary",
  pending_submit: "warning",
  pending_report: "warning",
  report_processing: "warning",
  pending_review: "warning",
  in_review: "primary",
  pending_rectification: "danger",
  in_rectification: "danger",
  completed: "success",
  closed: "default",
};

export default function EnterpriseProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading } = useAuditProject(projectId);
  const { data: timeline } = useProjectTimeline(projectId);

  if (isLoading) return <PageLoading />;
  if (!project) {
    return (
      <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">
        项目不存在
      </div>
    );
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("zh-CN");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/enterprise/projects")}>
          <ArrowLeft size={16} />
          返回
        </Button>
      </div>

      {project.isOverdue && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-[hsl(var(--danger))] bg-red-50 p-4">
          <AlertTriangle size={20} className="text-[hsl(var(--danger))]" />
          <span className="text-sm font-medium text-[hsl(var(--danger))]">
            该项目已逾期，截止日期为 {formatDate(project.deadline)}
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-3">
              <span>{project.enterpriseName ?? "未知企业"}</span>
              <Badge variant={STATUS_VARIANTS[project.status] ?? "default"}>
                {STATUS_LABELS[project.status] ?? project.status}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[hsl(var(--muted-foreground))]">批次：</span>
            <span className="text-[hsl(var(--foreground))]">{project.batchName ?? "-"}</span>
          </div>
          <div>
            <span className="text-[hsl(var(--muted-foreground))]">截止日期：</span>
            <span className="text-[hsl(var(--foreground))]">{formatDate(project.deadline)}</span>
          </div>
          <div>
            <span className="text-[hsl(var(--muted-foreground))]">创建时间：</span>
            <span className="text-[hsl(var(--foreground))]">{formatDateTime(project.createdAt)}</span>
          </div>
        </div>
      </Card>

      {/* Enterprise Profile Snapshot */}
      <EnterpriseProfileCard projectId={projectId} />

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Clock size={20} />
              状态流转记录
            </span>
          </CardTitle>
        </CardHeader>
        <div className="relative pl-6">
          {timeline && timeline.length > 0 ? (
            <div className="space-y-4">
              {timeline.map((t, idx) => (
                <div key={t.id} className="relative flex items-start gap-3">
                  <div className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center">
                    <div
                      className={`h-3 w-3 rounded-full ${idx === 0 ? "bg-[hsl(var(--primary))]" : "bg-gray-300"}`}
                    />
                  </div>
                  {idx < timeline.length - 1 && (
                    <div className="absolute -left-[18px] top-5 h-full w-0.5 bg-gray-200" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANTS[t.fromStatus] ?? "default"}>
                        {STATUS_LABELS[t.fromStatus] ?? t.fromStatus}
                      </Badge>
                      <span className="text-[hsl(var(--muted-foreground))]">→</span>
                      <Badge variant={STATUS_VARIANTS[t.toStatus] ?? "default"}>
                        {STATUS_LABELS[t.toStatus] ?? t.toStatus}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      {formatDateTime(t.transitionedAt)}
                      {t.reason && ` · ${t.reason}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">暂无流转记录</p>
          )}
        </div>
      </Card>
    </div>
  );
}

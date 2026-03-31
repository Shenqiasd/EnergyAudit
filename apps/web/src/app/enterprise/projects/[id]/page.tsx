"use client";

import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DetailHeader } from "@/components/detail/detail-header";
import { InfoGrid } from "@/components/detail/info-grid";
import { Timeline } from "@/components/detail/timeline";
import type { TimelineItem } from "@/components/detail/timeline";
import { EnterpriseProfileCard } from "@/components/enterprise-profile-card";
import { useAuditProject, useProjectTimeline } from "@/lib/api/hooks/use-audit-projects";
import { AlertTriangle, FileText } from "lucide-react";

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

  const timelineItems: TimelineItem[] = (timeline ?? []).map((t) => ({
    id: t.id,
    title: `${STATUS_LABELS[t.fromStatus] ?? t.fromStatus} → ${STATUS_LABELS[t.toStatus] ?? t.toStatus}`,
    description: t.reason ?? undefined,
    timestamp: formatDateTime(t.transitionedAt),
    type: t.toStatus === "completed" ? "success" as const : t.toStatus.includes("rectification") ? "danger" as const : "default" as const,
  }));

  return (
    <div className="space-y-6">
      <DetailHeader
        icon={<FileText size={20} />}
        title={project.enterpriseName ?? "未知企业"}
        subtitle={`批次: ${project.batchName ?? "-"}`}
        badges={
          <>
            <Badge variant={STATUS_VARIANTS[project.status] ?? "default"}>
              {STATUS_LABELS[project.status] ?? project.status}
            </Badge>
            {project.isOverdue && <Badge variant="danger">已逾期</Badge>}
          </>
        }
        metadata={[
          { label: "截止日期", value: formatDate(project.deadline) },
          { label: "创建时间", value: formatDateTime(project.createdAt) },
        ]}
        backHref="/enterprise/projects"
        backLabel="返回列表"
      />

      {project.isOverdue && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-[hsl(var(--danger))] bg-red-50 p-4">
          <AlertTriangle size={20} className="text-[hsl(var(--danger))]" />
          <span className="text-sm font-medium text-[hsl(var(--danger))]">
            该项目已逾期，截止日期为 {formatDate(project.deadline)}
          </span>
        </div>
      )}

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="report">报告状态</TabsTrigger>
          <TabsTrigger value="timeline">状态记录</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>项目信息</CardTitle>
              </CardHeader>
              <InfoGrid
                columns={2}
                items={[
                  { label: "企业名称", value: project.enterpriseName ?? "-" },
                  { label: "批次", value: project.batchName ?? "-" },
                  { label: "当前状态", value: STATUS_LABELS[project.status] ?? project.status },
                  { label: "截止日期", value: formatDate(project.deadline) },
                  { label: "创建时间", value: formatDateTime(project.createdAt) },
                ]}
              />
            </Card>

            <EnterpriseProfileCard projectId={projectId} />
          </div>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>报告状态</CardTitle>
            </CardHeader>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              当前状态: {STATUS_LABELS[project.status] ?? project.status}
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>状态流转记录</CardTitle>
            </CardHeader>
            <Timeline items={timelineItems} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

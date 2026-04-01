"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { DetailSkeleton } from "@/components/skeleton/detail-skeleton";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  FileText,
  UserPlus,
  Users,
  Trash2,
} from "lucide-react";
import { DetailHeader } from "@/components/detail/detail-header";
import { InfoGrid } from "@/components/detail/info-grid";
import { Timeline } from "@/components/detail/timeline";
import type { TimelineItem } from "@/components/detail/timeline";
import { EnterpriseProfileCard } from "@/components/enterprise-profile-card";
import {
  useAuditProject,
  useTransitionProject,
  useProjectMembers,
  useAddMember,
  useRemoveMember,
  useExtendProjectDeadline,
  useProjectTimeline,
} from "@/lib/api/hooks/use-audit-projects";
import { DeadlineExtensionDialog } from "@/components/deadline-extension-dialog";

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

const ROLE_LABELS: Record<string, string> = {
  enterprise_contact: "企业联系人",
  enterprise_filler: "填报人",
  assigned_reviewer: "审核人",
  project_manager: "项目经理",
};

const ROLE_VARIANTS: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
  enterprise_contact: "primary",
  enterprise_filler: "success",
  assigned_reviewer: "warning",
  project_manager: "danger",
};

const roleOptions = [
  { value: "enterprise_contact", label: "企业联系人" },
  { value: "enterprise_filler", label: "填报人" },
  { value: "assigned_reviewer", label: "审核人" },
  { value: "project_manager", label: "项目经理" },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading } = useAuditProject(projectId);
  const { data: members } = useProjectMembers(projectId);
  const { data: timeline } = useProjectTimeline(projectId);
  const transitionProject = useTransitionProject(projectId);
  const addMember = useAddMember(projectId);
  const removeMember = useRemoveMember(projectId);

  const [showAddMember, setShowAddMember] = useState(false);
  const [showExtendDeadline, setShowExtendDeadline] = useState(false);
  const [memberForm, setMemberForm] = useState({ userId: "", role: "enterprise_contact" });
  const extendDeadline = useExtendProjectDeadline(projectId);

  if (isLoading) return <DetailSkeleton />;
  if (!project) return <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">项目不存在</div>;

  const handleTransition = async (targetStatus: string) => {
    await transitionProject.mutateAsync({ targetStatus });
  };

  const handleAddMember = async () => {
    if (!memberForm.userId) return;
    await addMember.mutateAsync(memberForm);
    setShowAddMember(false);
    setMemberForm({ userId: "", role: "enterprise_contact" });
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeMember.mutateAsync(memberId);
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("zh-CN");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  const STATUS_PROGRESS: Record<string, number> = {
    pending_start: 0,
    configuring: 10,
    filing: 25,
    pending_submit: 40,
    pending_report: 50,
    report_processing: 60,
    pending_review: 70,
    in_review: 80,
    pending_rectification: 85,
    in_rectification: 90,
    completed: 100,
    closed: 100,
  };
  const progressPercent = STATUS_PROGRESS[project.status] ?? 0;

  const timelineItems: TimelineItem[] = (timeline ?? []).map((t) => ({
    id: t.id,
    title: `${STATUS_LABELS[t.fromStatus] ?? t.fromStatus} → ${STATUS_LABELS[t.toStatus] ?? t.toStatus}`,
    description: t.reason ?? undefined,
    timestamp: formatDateTime(t.transitionedAt),
    type: t.toStatus === "completed" ? "success" as const : t.toStatus.includes("rectification") ? "danger" as const : "default" as const,
  }));

  const transitionButtons = project.validNextStates && project.validNextStates.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {project.validNextStates.map((next) => (
        <Button
          key={next}
          size="sm"
          variant="secondary"
          onClick={() => handleTransition(next)}
          disabled={transitionProject.isPending}
        >
          → {STATUS_LABELS[next] ?? next}
        </Button>
      ))}
      <Button size="sm" variant="secondary" onClick={() => setShowExtendDeadline(true)}>
        延期
      </Button>
    </div>
  );

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
        actions={transitionButtons || undefined}
        backHref="/manager/projects"
        backLabel="返回列表"
      />

      {project.isOverdue && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-[hsl(var(--danger))] bg-red-50 p-4">
          <AlertTriangle size={20} className="text-[hsl(var(--danger))]" />
          <span className="text-sm font-medium text-[hsl(var(--danger))]">
            该项目已逾期，截止日期为 {formatDate(project.deadline)}
          </span>
          <Button size="sm" variant="secondary" onClick={() => setShowExtendDeadline(true)}>
            延期
          </Button>
        </div>
      )}

      <Card>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">项目进度</span>
          <div className="flex-1">
            <Progress value={progressPercent} />
          </div>
          <span className="text-sm font-medium text-[hsl(var(--foreground))]">{progressPercent}%</span>
        </div>
      </Card>

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="members">项目成员</TabsTrigger>
          <TabsTrigger value="timeline">审核记录</TabsTrigger>
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
                  { label: "模板版本", value: project.templateVersionId ?? "未绑定" },
                ]}
              />
            </Card>

            <EnterpriseProfileCard projectId={projectId} />
          </div>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Users size={20} />
                  项目成员
                </span>
              </CardTitle>
              <Button size="sm" onClick={() => setShowAddMember(true)}>
                <UserPlus size={14} />
                添加成员
              </Button>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>加入时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.userName ?? m.userId}</TableCell>
                    <TableCell>{m.userEmail ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANTS[m.role] ?? "default"}>
                        {ROLE_LABELS[m.role] ?? m.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(m.joinedAt)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveMember(m.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!members || members.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-[hsl(var(--muted-foreground))]">
                      暂无成员
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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

      <Modal open={showAddMember} onClose={() => setShowAddMember(false)} title="添加成员">
        <div className="space-y-4">
          <Input
            label="用户ID"
            value={memberForm.userId}
            onChange={(e) => setMemberForm({ ...memberForm, userId: e.target.value })}
            placeholder="输入用户ID"
          />
          <Select
            label="角色"
            options={roleOptions}
            value={memberForm.role}
            onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddMember(false)}>
              取消
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!memberForm.userId || addMember.isPending}
            >
              {addMember.isPending ? "添加中..." : "添加"}
            </Button>
          </div>
        </div>
      </Modal>

      <DeadlineExtensionDialog
        open={showExtendDeadline}
        onClose={() => setShowExtendDeadline(false)}
        onSubmit={async (data) => {
          await extendDeadline.mutateAsync(data);
        }}
        isPending={extendDeadline.isPending}
        entityType="project"
        currentDeadline={project.deadline}
      />
    </div>
  );
}

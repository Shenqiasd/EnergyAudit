"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageLoading } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  Users,
  Trash2,
} from "lucide-react";
import {
  useAuditProject,
  useTransitionProject,
  useProjectMembers,
  useAddMember,
  useRemoveMember,
  useProjectTimeline,
} from "@/lib/api/hooks/use-audit-projects";

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
  const [memberForm, setMemberForm] = useState({ userId: "", role: "enterprise_contact" });

  if (isLoading) return <PageLoading />;
  if (!project) return <div className="p-8 text-center text-[var(--color-text-secondary)]">项目不存在</div>;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/manager/projects")}>
          <ArrowLeft size={16} />
          返回
        </Button>
      </div>

      {project.isOverdue && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-[var(--color-danger)] bg-red-50 p-4">
          <AlertTriangle size={20} className="text-[var(--color-danger)]" />
          <span className="text-sm font-medium text-[var(--color-danger)]">
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
            <span className="text-[var(--color-text-secondary)]">批次：</span>
            <span className="text-[var(--color-text)]">{project.batchName ?? "-"}</span>
          </div>
          <div>
            <span className="text-[var(--color-text-secondary)]">截止日期：</span>
            <span className="text-[var(--color-text)]">{formatDate(project.deadline)}</span>
          </div>
          <div>
            <span className="text-[var(--color-text-secondary)]">创建时间：</span>
            <span className="text-[var(--color-text)]">{formatDateTime(project.createdAt)}</span>
          </div>
          <div>
            <span className="text-[var(--color-text-secondary)]">模板版本：</span>
            <span className="text-[var(--color-text)]">{project.templateVersionId ?? "未绑定"}</span>
          </div>
        </div>

        {project.validNextStates && project.validNextStates.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-secondary)]">状态流转：</span>
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
          </div>
        )}
      </Card>

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
                      className={`h-3 w-3 rounded-full ${idx === 0 ? "bg-[var(--color-primary)]" : "bg-gray-300"}`}
                    />
                  </div>
                  {idx < timeline.length - 1 && (
                    <div className="absolute -left-[18px] top-5 h-full w-0.5 bg-gray-200" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANTS[t.fromStatus] ?? "default"}>
                        {STATUS_LABELS[t.fromStatus] ?? t.fromStatus}
                      </Badge>
                      <span className="text-[var(--color-text-secondary)]">→</span>
                      <Badge variant={STATUS_VARIANTS[t.toStatus] ?? "default"}>
                        {STATUS_LABELS[t.toStatus] ?? t.toStatus}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      {formatDateTime(t.transitionedAt)}
                      {t.reason && ` · ${t.reason}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)]">暂无流转记录</p>
          )}
        </div>
      </Card>

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
                <TableCell colSpan={5} className="text-center text-[var(--color-text-secondary)]">
                  暂无成员
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

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
    </div>
  );
}

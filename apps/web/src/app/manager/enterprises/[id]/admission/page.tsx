"use client";

import { use, useState } from "react";
import { CheckCircle, XCircle, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageLoading } from "@/components/ui/loading";
import { DetailHeader } from "@/components/detail/detail-header";
import { InfoGrid } from "@/components/detail/info-grid";
import { Timeline } from "@/components/detail/timeline";
import type { TimelineItem } from "@/components/detail/timeline";
import { useEnterprise, useUpdateAdmission } from "@/lib/api/hooks/use-enterprises";

const STATUS_MAP: Record<string, { label: string; variant: "warning" | "success" | "danger" | "default" }> = {
  pending_review: { label: "待审核", variant: "warning" },
  approved: { label: "已通过", variant: "success" },
  rejected: { label: "已驳回", variant: "danger" },
  suspended: { label: "已停用", variant: "default" },
  locked: { label: "已锁定", variant: "default" },
  expired: { label: "已过期", variant: "default" },
};

export default function AdmissionReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: enterprise, isLoading } = useEnterprise(id);
  const approveMutation = useUpdateAdmission(id, "approve");
  const rejectMutation = useUpdateAdmission(id, "reject");

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);

  if (isLoading) return <PageLoading />;
  if (!enterprise) return <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">企业不存在</div>;

  const handleApprove = () => {
    approveMutation.mutate(
      { operatedBy: "system" },
      {
        onSuccess: () => {
          setShowConfirmApprove(false);
          window.location.href = `/manager/enterprises/${id}`;
        },
      },
    );
  };

  const handleReject = () => {
    rejectMutation.mutate(
      { operatedBy: "system", reason: rejectReason || undefined },
      {
        onSuccess: () => {
          setShowRejectModal(false);
          setRejectReason("");
          window.location.href = `/manager/enterprises/${id}`;
        },
      },
    );
  };

  const statusConfig = STATUS_MAP[enterprise.admissionStatus] ?? { label: enterprise.admissionStatus, variant: "default" as const };

  const historyItems: TimelineItem[] = [
    {
      id: "created",
      title: "提交准入申请",
      description: enterprise.name,
      timestamp: new Date(enterprise.createdAt).toLocaleString("zh-CN"),
      type: "default",
    },
  ];

  return (
    <div className="space-y-6">
      <DetailHeader
        icon={<Building2 size={20} />}
        title="准入审核"
        subtitle={`审核企业 ${enterprise.name} 的准入申请`}
        badges={<Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>}
        backHref={`/manager/enterprises/${id}`}
        backLabel="返回详情"
      />

      <Card>
        <CardHeader>
          <CardTitle>申请详情</CardTitle>
        </CardHeader>
        <InfoGrid
          columns={2}
          items={[
            { label: "企业名称", value: enterprise.name },
            { label: "统一社会信用代码", value: enterprise.unifiedSocialCreditCode },
            { label: "行业分类", value: enterprise.industryCode ?? "-" },
            { label: "联系人", value: enterprise.contactPerson ?? "-" },
            { label: "联系电话", value: enterprise.contactPhone ?? "-" },
            { label: "联系邮箱", value: enterprise.contactEmail ?? "-" },
            { label: "地址", value: enterprise.address ?? "-", span: 2 },
            { label: "备注", value: enterprise.notes ?? "-", span: 2 },
            { label: "申请时间", value: new Date(enterprise.createdAt).toLocaleString("zh-CN") },
          ]}
        />
      </Card>

      {enterprise.admissionStatus === "pending_review" && (
        <Card>
          <CardHeader>
            <CardTitle>审核操作</CardTitle>
          </CardHeader>
          <div className="flex gap-3">
            <Button onClick={() => setShowConfirmApprove(true)}>
              <CheckCircle size={16} />
              审核通过
            </Button>
            <Button variant="danger" onClick={() => setShowRejectModal(true)}>
              <XCircle size={16} />
              驳回
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>审核历史</CardTitle>
        </CardHeader>
        <Timeline items={historyItems} />
      </Card>

      <Modal
        open={showConfirmApprove}
        onClose={() => setShowConfirmApprove(false)}
        title="确认审核通过"
      >
        <div className="space-y-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            确认通过企业 <strong>{enterprise.name}</strong> 的准入申请？通过后企业将可以参与能源审计。
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowConfirmApprove(false)}>
              取消
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? "处理中..." : "确认通过"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="驳回申请"
      >
        <div className="space-y-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            请输入驳回原因，企业将收到通知。
          </p>
          <Input
            label="驳回原因"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="请输入驳回原因"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleReject} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? "处理中..." : "确认驳回"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

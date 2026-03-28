"use client";

import { use, useState } from "react";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageLoading } from "@/components/ui/loading";
import { useEnterprise, useUpdateAdmission } from "@/lib/api/hooks/use-enterprises";

const STATUS_MAP: Record<string, { label: string; variant: "warning" | "success" | "danger" | "default" }> = {
  pending_review: { label: "待审核", variant: "warning" },
  approved: { label: "已通过", variant: "success" },
  rejected: { label: "已驳回", variant: "danger" },
  suspended: { label: "已停用", variant: "default" },
  locked: { label: "已锁定", variant: "default" },
  expired: { label: "已过期", variant: "default" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

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
  if (!enterprise) return <div className="p-8 text-center text-[var(--color-text-secondary)]">企业不存在</div>;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href={`/manager/enterprises/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} />
            返回详情
          </Button>
        </a>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">准入审核</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            审核企业 {enterprise.name} 的准入申请
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Clock size={18} />
              申请详情
            </span>
          </CardTitle>
          <StatusBadge status={enterprise.admissionStatus} />
        </CardHeader>
        <div className="space-y-3">
          <InfoRow label="企业名称" value={enterprise.name} />
          <InfoRow label="统一社会信用代码" value={enterprise.unifiedSocialCreditCode} />
          <InfoRow label="行业分类" value={enterprise.industryCode ?? "-"} />
          <InfoRow label="联系人" value={enterprise.contactPerson ?? "-"} />
          <InfoRow label="联系电话" value={enterprise.contactPhone ?? "-"} />
          <InfoRow label="联系邮箱" value={enterprise.contactEmail ?? "-"} />
          <InfoRow label="地址" value={enterprise.address ?? "-"} />
          <InfoRow label="备注" value={enterprise.notes ?? "-"} />
          <InfoRow label="申请时间" value={new Date(enterprise.createdAt).toLocaleString("zh-CN")} />
        </div>
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

      <Modal
        open={showConfirmApprove}
        onClose={() => setShowConfirmApprove(false)}
        title="确认审核通过"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
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
          <p className="text-sm text-[var(--color-text-secondary)]">
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-32 shrink-0 text-sm text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-sm text-[var(--color-text)]">{value}</span>
    </div>
  );
}

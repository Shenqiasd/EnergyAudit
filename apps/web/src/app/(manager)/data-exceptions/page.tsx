"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import {
  usePendingExceptions,
  useApproveException,
  useRejectException,
} from "@/lib/api/hooks/use-data-exceptions";
import { CheckCircle2, XCircle } from "lucide-react";

import type { PendingExceptionItem } from "@/lib/api/hooks/use-data-exceptions";

export default function DataExceptionsPage() {
  const { data: pendingItems, isLoading } = usePendingExceptions();
  const approveMutation = useApproveException();
  const rejectMutation = useRejectException();

  const [rejectModal, setRejectModal] = useState<PendingExceptionItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Mock approver ID - in production this comes from auth context
  const approverId = "current_manager_id";

  const handleApprove = async (item: PendingExceptionItem) => {
    await approveMutation.mutateAsync({
      exceptionId: item.exception.id,
      approverId,
    });
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    await rejectMutation.mutateAsync({
      exceptionId: rejectModal.exception.id,
      approverId,
      reason: rejectReason || undefined,
    });
    setRejectModal(null);
    setRejectReason("");
  };

  const severityBadge = (severity: string) => {
    switch (severity) {
      case "error":
        return <Badge variant="danger" className="text-xs">错误</Badge>;
      case "warning":
        return <Badge variant="warning" className="text-xs">警告</Badge>;
      default:
        return <Badge variant="default" className="text-xs">{severity}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          例外审核管理
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          审核企业提交的数据校验例外说明，批准或驳回
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>待审核例外</CardTitle>
          <Badge variant="default" className="text-xs">
            {pendingItems?.length ?? 0} 条待审核
          </Badge>
        </CardHeader>

        {isLoading ? (
          <Loading text="加载待审核例外..." className="py-8" />
        ) : pendingItems && pendingItems.length > 0 ? (
          <div className="divide-y divide-[var(--color-border)]">
            {pendingItems.map((item) => (
              <div key={item.exception.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {item.validationResult &&
                        severityBadge(item.validationResult.severity)}
                      <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                        {item.validationResult?.ruleCode}
                      </span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        模块: {item.validationResult?.moduleCode ?? item.dataRecord?.moduleCode}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text)]">
                      {item.validationResult?.message}
                    </p>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                        例外说明：
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text)]">
                        {item.exception.explanation}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      提交时间：{new Date(item.exception.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 size={14} />
                      批准
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setRejectModal(item);
                        setRejectReason("");
                      }}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle size={14} />
                      驳回
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
            暂无待审核的例外申请
          </p>
        )}
      </Card>

      {/* Reject Modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="驳回例外申请"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            确定要驳回此例外申请吗？
          </p>
          {rejectModal?.validationResult && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-[var(--color-text)]">
                {rejectModal.validationResult.message}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                例外说明：{rejectModal.exception.explanation}
              </p>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              驳回原因（可选）
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="输入驳回原因..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRejectModal(null)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleReject}>
              确认驳回
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

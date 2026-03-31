"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useReturnRecord } from "@/lib/api/hooks/use-data-entry";
import { AlertTriangle } from "lucide-react";

interface DataReturnDialogProps {
  recordId: string;
  open: boolean;
  onClose: () => void;
  returnedBy?: string;
}

export function DataReturnDialog({
  recordId,
  open,
  onClose,
  returnedBy,
}: DataReturnDialogProps) {
  const [reason, setReason] = useState("");
  const returnRecord = useReturnRecord(recordId);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    await returnRecord.mutateAsync({ reason, returnedBy });
    setReason("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="退回数据记录">
      <div className="space-y-4">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          请填写退回原因，该原因将展示给企业用户。
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">
            退回原因 <span className="text-[hsl(var(--danger))]">*</span>
          </label>
          <textarea
            className="w-full rounded-lg border border-[hsl(var(--border))] p-3 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            rows={4}
            placeholder="请输入退回原因..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            disabled={!reason.trim() || returnRecord.isPending}
          >
            {returnRecord.isPending ? "退回中..." : "确认退回"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface DataReturnBannerProps {
  returnReason: string | null;
  returnedBy: string | null;
  returnedAt: string | null;
}

export function DataReturnBanner({
  returnReason,
  returnedBy,
  returnedAt,
}: DataReturnBannerProps) {
  if (!returnReason) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border-2 border-[hsl(var(--warning))] bg-yellow-50 p-4">
      <AlertTriangle size={20} className="mt-0.5 shrink-0 text-[hsl(var(--warning))]" />
      <div>
        <p className="text-sm font-medium text-[hsl(var(--foreground))]">
          该记录已被退回，原因: {returnReason}
        </p>
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
          {returnedBy && `退回人: ${returnedBy}`}
          {returnedBy && returnedAt && " · "}
          {returnedAt && `退回时间: ${new Date(returnedAt).toLocaleString("zh-CN")}`}
        </p>
      </div>
    </div>
  );
}

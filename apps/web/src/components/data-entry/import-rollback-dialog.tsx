"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { useRollbackImport } from "@/lib/api/hooks/use-import-rollback";
import { AlertTriangle } from "lucide-react";

interface ImportRollbackDialogProps {
  open: boolean;
  onClose: () => void;
  importJobId: string;
  userId: string;
  moduleCode: string;
  onSuccess?: () => void;
}

export function ImportRollbackDialog({
  open,
  onClose,
  importJobId,
  userId,
  moduleCode,
  onSuccess,
}: ImportRollbackDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const rollbackMutation = useRollbackImport(importJobId);

  const handleRollback = async () => {
    await rollbackMutation.mutateAsync({ userId });
    setConfirmed(false);
    onSuccess?.();
    onClose();
  };

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="回滚导入数据">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
          <div className="text-sm text-red-800">
            <p className="font-medium">确认回滚此次导入？</p>
            <p className="mt-1">
              将恢复至导入前的数据状态。此操作不可逆。
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-[hsl(var(--border))] p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">导入任务:</span>
            <span className="font-mono text-xs">{importJobId}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">模块:</span>
            <Badge variant="default" className="text-xs">
              {moduleCode}
            </Badge>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-[hsl(var(--foreground))]">
            我已了解回滚将删除本次导入的所有数据，并恢复导入前状态
          </span>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose}>
            取消
          </Button>
          <Button
            variant="danger"
            onClick={handleRollback}
            disabled={!confirmed || rollbackMutation.isPending}
          >
            {rollbackMutation.isPending ? "回滚中..." : "确认回滚"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

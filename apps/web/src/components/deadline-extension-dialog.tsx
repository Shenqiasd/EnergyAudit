"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Calendar } from "lucide-react";

interface DeadlineExtensionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { newDeadline: string; reason: string }) => Promise<void>;
  isPending: boolean;
  entityType: "project" | "batch" | "rectification";
  currentDeadline?: string | null;
}

const entityLabels: Record<string, string> = {
  project: "项目",
  batch: "批次",
  rectification: "整改任务",
};

export function DeadlineExtensionDialog({
  open,
  onClose,
  onSubmit,
  isPending,
  entityType,
  currentDeadline,
}: DeadlineExtensionDialogProps) {
  const [newDeadline, setNewDeadline] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!newDeadline || !reason.trim()) return;
    await onSubmit({ newDeadline, reason: reason.trim() });
    setNewDeadline("");
    setReason("");
    onClose();
  };

  const handleClose = () => {
    setNewDeadline("");
    setReason("");
    onClose();
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "未设置";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  return (
    <Modal open={open} onClose={handleClose} title={`${entityLabels[entityType]}延期`}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--muted))] p-3 text-sm text-[hsl(var(--muted-foreground))]">
          <Calendar size={16} />
          <span>当前截止日期: {formatDate(currentDeadline)}</span>
        </div>

        <Input
          label="新截止日期"
          type="date"
          value={newDeadline}
          onChange={(e) => setNewDeadline(e.target.value)}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">
            延期原因
          </label>
          <textarea
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请输入延期原因..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!newDeadline || !reason.trim() || isPending}
          >
            {isPending ? "提交中..." : "确认延期"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

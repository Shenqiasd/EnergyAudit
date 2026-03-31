"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { useSubmitExceptions } from "@/lib/api/hooks/use-data-exceptions";
import { AlertTriangle } from "lucide-react";

interface ValidationWarning {
  id: string;
  ruleCode: string;
  message: string;
  severity: string;
  fieldCode?: string | null;
}

interface ExceptionSubmitDialogProps {
  open: boolean;
  onClose: () => void;
  dataRecordId: string;
  userId: string;
  warnings: ValidationWarning[];
  onSuccess?: () => void;
}

export function ExceptionSubmitDialog({
  open,
  onClose,
  dataRecordId,
  userId,
  warnings,
  onSuccess,
}: ExceptionSubmitDialogProps) {
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const submitMutation = useSubmitExceptions(dataRecordId);

  const handleExplanationChange = (warningId: string, value: string) => {
    setExplanations((prev) => ({ ...prev, [warningId]: value }));
  };

  const allFilled = warnings.every(
    (w) => explanations[w.id] && explanations[w.id].trim().length > 0,
  );

  const handleSubmit = async () => {
    const exceptions = warnings.map((w) => ({
      validationResultId: w.id,
      explanation: explanations[w.id]?.trim() ?? "",
    }));

    await submitMutation.mutateAsync({ exceptions, userId });
    setExplanations({});
    onSuccess?.();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="提交例外说明">
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--warning)/0.1)] p-3">
          <AlertTriangle size={16} className="shrink-0 text-[hsl(var(--warning))]" />
          <p className="text-sm text-[hsl(var(--warning))]">
            以下校验项存在警告，请逐条说明原因后提交例外申请。
            管理员审核通过后，数据可正常提交。
          </p>
        </div>

        <div className="max-h-96 space-y-4 overflow-auto">
          {warnings.map((warning) => (
            <div
              key={warning.id}
              className="rounded-lg border border-[hsl(var(--border))] p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="warning" className="text-xs">
                  警告
                </Badge>
                <span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
                  {warning.ruleCode}
                </span>
              </div>
              <p className="mb-2 text-sm text-[hsl(var(--foreground))]">
                {warning.message}
              </p>
              <textarea
                value={explanations[warning.id] ?? ""}
                onChange={(e) =>
                  handleExplanationChange(warning.id, e.target.value)
                }
                rows={2}
                className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                placeholder="请输入例外说明..."
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!allFilled || submitMutation.isPending}
          >
            {submitMutation.isPending ? "提交中..." : "提交例外申请"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

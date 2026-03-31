"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, Loader2, Save, Send } from "lucide-react";

interface StickyActionBarProps {
  autoSaveStatus?: "saving" | "saved" | "error" | "idle";
  autoSaveTime?: string;
  onSaveDraft?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  loading?: boolean;
}

export function StickyActionBar({
  autoSaveStatus = "idle",
  autoSaveTime,
  onSaveDraft,
  onPrevious,
  onNext,
  onSubmit,
  isFirstStep = false,
  isLastStep = false,
  loading = false,
}: StickyActionBarProps) {
  return (
    <div className="sticky bottom-0 z-30 -mx-6 mt-6 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 px-6 py-3 backdrop-blur-lg">
      <div className="flex items-center justify-between">
        {/* Auto-save indicator */}
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          {autoSaveStatus === "saving" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>保存中...</span>
            </>
          )}
          {autoSaveStatus === "saved" && (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              <span>
                自动保存于 {autoSaveTime ?? "刚刚"}
              </span>
            </>
          )}
          {autoSaveStatus === "error" && (
            <span className="text-[hsl(var(--danger))]">保存失败</span>
          )}
          {autoSaveStatus === "idle" && (
            <span>自动保存已启用</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {onSaveDraft && (
            <Button
              variant="outline"
              size="default"
              onClick={onSaveDraft}
              disabled={loading}
            >
              <Save className="mr-1.5 h-4 w-4" />
              保存草稿
            </Button>
          )}

          {!isFirstStep && onPrevious && (
            <Button
              variant="secondary"
              size="default"
              onClick={onPrevious}
              disabled={loading}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              上一步
            </Button>
          )}

          {isLastStep ? (
            onSubmit && (
              <Button
                variant="primary"
                size="default"
                onClick={onSubmit}
                loading={loading}
              >
                <Send className="mr-1.5 h-4 w-4" />
                提交
              </Button>
            )
          ) : (
            onNext && (
              <Button
                variant="primary"
                size="default"
                onClick={onNext}
                loading={loading}
              >
                下一步
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

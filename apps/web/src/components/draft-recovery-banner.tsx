"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { loadDraft, clearDraft } from "@/lib/draft-storage";
import { AlertTriangle } from "lucide-react";

import type { DraftEntry } from "@/lib/draft-storage";

interface DraftRecoveryBannerProps {
  projectId: string;
  moduleCode: string;
  /** Timestamp of the current server data (ISO string or ms). Used to compare with draft age. */
  serverDataTimestamp?: string | number | null;
  /** Called when user chooses to recover the draft */
  onRecover: (data: unknown) => void;
  /** Called after draft is discarded */
  onDiscard?: () => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Banner shown when entering a data entry page that has a saved draft.
 * Displays recovery and discard options.
 */
export function DraftRecoveryBanner({
  projectId,
  moduleCode,
  serverDataTimestamp,
  onRecover,
  onDiscard,
}: DraftRecoveryBannerProps) {
  const [draft, setDraft] = useState<DraftEntry | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const entry = loadDraft(projectId, moduleCode);
    if (!entry) return;

    // Only show if draft is newer than server data
    if (serverDataTimestamp) {
      const serverTs =
        typeof serverDataTimestamp === "string"
          ? new Date(serverDataTimestamp).getTime()
          : serverDataTimestamp;
      if (entry.metadata.savedAt <= serverTs) {
        // Draft is older than server data — auto-clear
        clearDraft(projectId, moduleCode);
        return;
      }
    }

    setDraft(entry);
  }, [projectId, moduleCode, serverDataTimestamp]);

  const handleRecover = useCallback(() => {
    if (!draft) return;
    onRecover(draft.data);
    setDismissed(true);
  }, [draft, onRecover]);

  const handleDiscard = useCallback(() => {
    clearDraft(projectId, moduleCode);
    setDraft(null);
    setDismissed(true);
    onDiscard?.();
  }, [projectId, moduleCode, onDiscard]);

  if (!draft || dismissed) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10 p-4">
      <AlertTriangle
        size={20}
        className="mt-0.5 shrink-0 text-[hsl(var(--warning))]"
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-[hsl(var(--foreground))]">
          检测到未保存的草稿（保存于 {formatTime(draft.metadata.savedAt)}），是否恢复？
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="secondary" onClick={handleDiscard}>
          丢弃
        </Button>
        <Button size="sm" onClick={handleRecover}>
          恢复
        </Button>
      </div>
    </div>
  );
}

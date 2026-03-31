"use client";

import { Cloud, CloudOff, Loader2, Check } from "lucide-react";

interface AutoSaveIndicatorProps {
  /** Whether a save is in progress */
  isSaving: boolean;
  /** Whether the browser is offline */
  isOffline: boolean;
  /** Timestamp (ms) of the last successful save, or null if never saved */
  lastSaved: number | null;
  /** Whether we just came back online and are syncing */
  isSyncing?: boolean;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "刚刚";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  return `${Math.floor(diff / 3600_000)} 小时前`;
}

/**
 * Small indicator showing auto-save status.
 * Displays different states: saved, saving, offline, syncing.
 */
export function AutoSaveIndicator({
  isSaving,
  isOffline,
  lastSaved,
  isSyncing,
}: AutoSaveIndicatorProps) {
  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-blue-600">
        <Loader2 size={14} className="animate-spin" />
        <span>重新连接，正在同步...</span>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600">
        <CloudOff size={14} />
        <span>离线模式</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
        <Loader2 size={14} className="animate-spin" />
        <span>保存中...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
        <Check size={14} className="text-green-500" />
        <span>已自动保存 ({formatRelativeTime(lastSaved)})</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
      <Cloud size={14} />
      <span>自动保存已启用</span>
    </div>
  );
}

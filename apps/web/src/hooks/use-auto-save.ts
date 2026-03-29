"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveDraft } from "@/lib/draft-storage";
import { useOnlineStatus } from "./use-online-status";

interface AutoSaveOptions {
  /** Auto-save interval in milliseconds (default: 30000 = 30 seconds) */
  interval?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
}

interface AutoSaveResult {
  /** Timestamp of the last successful auto-save */
  lastSaved: number | null;
  /** Whether a save is currently in progress */
  isSaving: boolean;
  /** Whether the browser is offline */
  isOffline: boolean;
  /** Manually trigger a save */
  saveNow: () => void;
}

/**
 * React hook that auto-saves form data to localStorage at a configurable interval.
 * Detects changes via shallow comparison of the data reference.
 */
export function useAutoSave<T>(
  projectId: string,
  moduleCode: string,
  data: T,
  options: AutoSaveOptions = {},
): AutoSaveResult {
  const { interval = 30000, enabled = true } = options;
  const { isOnline } = useOnlineStatus();

  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const dataRef = useRef<T>(data);
  const prevDataJsonRef = useRef<string>("");

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const performSave = useCallback(() => {
    if (!projectId || !moduleCode) return;

    const currentJson = JSON.stringify(dataRef.current);
    if (currentJson === prevDataJsonRef.current) return;

    setIsSaving(true);
    try {
      saveDraft(projectId, moduleCode, dataRef.current);
      prevDataJsonRef.current = currentJson;
      setLastSaved(Date.now());
    } finally {
      setIsSaving(false);
    }
  }, [projectId, moduleCode]);

  // Auto-save on interval
  useEffect(() => {
    if (!enabled || !projectId || !moduleCode) return;

    const timer = setInterval(() => {
      performSave();
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, interval, projectId, moduleCode, performSave]);

  return {
    lastSaved,
    isSaving,
    isOffline: !isOnline,
    saveNow: performSave,
  };
}

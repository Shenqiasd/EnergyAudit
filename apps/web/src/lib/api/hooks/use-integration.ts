"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

interface SyncStatus {
  enterpriseId: string;
  status: string;
  retryCount: number;
  nextRetryAt: string | null;
  lastSnapshot: string | null;
  error: string | null;
  lastSyncedAt: string | null;
}

interface SyncHistoryItem {
  id: string;
  syncType: string;
  status: string;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface SyncHistoryResponse {
  items: SyncHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function useSyncStatus(enterpriseId: string) {
  return useQuery<SyncStatus>({
    queryKey: ["sync-status", enterpriseId],
    queryFn: () =>
      apiClient.get<SyncStatus>(`/integrations/sync/${enterpriseId}/status`),
    enabled: !!enterpriseId,
    refetchInterval: 30000,
  });
}

export function useTriggerSync(enterpriseId: string) {
  const queryClient = useQueryClient();
  return useMutation<SyncStatus>({
    mutationFn: () =>
      apiClient.post<SyncStatus>(`/integrations/sync/${enterpriseId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["sync-status", enterpriseId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["sync-history", enterpriseId],
      });
    },
  });
}

export function useSyncHistory(enterpriseId: string, page = 1) {
  return useQuery<SyncHistoryResponse>({
    queryKey: ["sync-history", enterpriseId, page],
    queryFn: () =>
      apiClient.get<SyncHistoryResponse>(
        `/integrations/sync/${enterpriseId}/history`,
        { params: { page: String(page) } },
      ),
    enabled: !!enterpriseId,
  });
}

export type { SyncStatus, SyncHistoryItem, SyncHistoryResponse };

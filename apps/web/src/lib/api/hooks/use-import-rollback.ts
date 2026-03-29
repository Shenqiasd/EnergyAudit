"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

interface ImportJob {
  id: string;
  auditProjectId: string;
  moduleCode: string;
  fileAttachmentId: string;
  status: string;
  totalRows: number | null;
  successRows: number | null;
  failedRows: number | null;
  errors: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  isRolledBack: boolean;
  rolledBackAt: string | null;
  rolledBackBy: string | null;
}

interface CanRollbackResponse {
  canRollback: boolean;
  reason?: string;
}

interface RollbackResponse {
  success: boolean;
  importJobId: string;
  restoredItemCount: number;
}

export function useCanRollback(importJobId: string) {
  return useQuery<CanRollbackResponse>({
    queryKey: ["import-job-can-rollback", importJobId],
    queryFn: () =>
      apiClient.get<CanRollbackResponse>(
        `/data-entry/import-jobs/${importJobId}/can-rollback`,
      ),
    enabled: !!importJobId,
  });
}

export function useRollbackImport(importJobId: string) {
  const queryClient = useQueryClient();
  return useMutation<RollbackResponse, Error, { userId: string }>({
    mutationFn: (data) =>
      apiClient.post<RollbackResponse>(
        `/data-entry/import-jobs/${importJobId}/rollback`,
        data,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["import-job-can-rollback", importJobId],
      });
      void queryClient.invalidateQueries({ queryKey: ["import-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["data-records"] });
      void queryClient.invalidateQueries({ queryKey: ["data-record"] });
    },
  });
}

export type { ImportJob, CanRollbackResponse, RollbackResponse };

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

interface RectificationTask {
  id: string;
  auditProjectId: string;
  reviewTaskId: string;
  sourceIssueId: string | null;
  title: string;
  description: string | null;
  status: string;
  deadline: string | null;
  isOverdue: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RectificationProgress {
  id: string;
  rectificationTaskId: string;
  progressPercent: number;
  note: string;
  attachmentIds: string | null;
  recordedBy: string;
  createdAt: string;
}

interface RectificationTaskDetail extends RectificationTask {
  progress: RectificationProgress[];
}

interface RectificationListResponse {
  items: RectificationTask[];
  page: number;
  pageSize: number;
}

interface RectificationListQuery {
  projectId?: string;
  enterpriseId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

interface RectificationStats {
  total: number;
  statusCounts: Record<string, number>;
  completionRate: string;
  overdueCount: number;
}

interface GenerateResult {
  generatedCount: number;
  taskIds: string[];
}

export function useRectificationTasks(query: RectificationListQuery = {}) {
  const params: Record<string, string> = {};
  if (query.projectId) params.projectId = query.projectId;
  if (query.enterpriseId) params.enterpriseId = query.enterpriseId;
  if (query.status) params.status = query.status;
  if (query.page) params.page = String(query.page);
  if (query.pageSize) params.pageSize = String(query.pageSize);

  return useQuery<RectificationListResponse>({
    queryKey: ["rectification-tasks", query],
    queryFn: () =>
      apiClient.get<RectificationListResponse>("/rectifications", { params }),
  });
}

export function useRectificationTask(id: string) {
  return useQuery<RectificationTaskDetail>({
    queryKey: ["rectification-task", id],
    queryFn: () =>
      apiClient.get<RectificationTaskDetail>(`/rectifications/${id}`),
    enabled: !!id,
  });
}

export function useGenerateRectifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      reviewTaskId: string;
      auditProjectId: string;
      issues: Array<{
        issueId: string;
        title: string;
        description?: string;
        deadline?: string;
      }>;
    }) => apiClient.post<GenerateResult>("/rectifications/generate", data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rectification-tasks"] });
    },
  });
}

export function useClaimRectification(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.put<RectificationTaskDetail>(`/rectifications/${id}/claim`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rectification-task", id] });
      void queryClient.invalidateQueries({ queryKey: ["rectification-tasks"] });
    },
  });
}

export function useUpdateProgress(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      progressPercent: number;
      note: string;
      attachmentIds?: string;
      recordedBy: string;
    }) => apiClient.put<RectificationTaskDetail>(`/rectifications/${id}/progress`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rectification-task", id] });
    },
  });
}

export function useSubmitRectification(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.put<RectificationTaskDetail>(`/rectifications/${id}/submit`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rectification-task", id] });
      void queryClient.invalidateQueries({ queryKey: ["rectification-tasks"] });
    },
  });
}

export function useAcceptRectification(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.put<RectificationTaskDetail>(`/rectifications/${id}/accept`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rectification-task", id] });
      void queryClient.invalidateQueries({ queryKey: ["rectification-tasks"] });
    },
  });
}

export function useRejectRectification(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.put<RectificationTaskDetail>(`/rectifications/${id}/reject`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rectification-task", id] });
      void queryClient.invalidateQueries({ queryKey: ["rectification-tasks"] });
    },
  });
}

export function useExtendRectificationDeadline(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { newDeadline: string; reason: string }) =>
      apiClient.patch<{ id: string; deadline: string; isOverdue: boolean; reason: string }>(
        `/rectifications/${id}/extend-deadline`,
        data,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rectification-task", id] });
      void queryClient.invalidateQueries({ queryKey: ["rectification-tasks"] });
    },
  });
}

export function useRectificationStats(query: { projectId?: string; batchId?: string } = {}) {
  const params: Record<string, string> = {};
  if (query.projectId) params.projectId = query.projectId;
  if (query.batchId) params.batchId = query.batchId;

  return useQuery<RectificationStats>({
    queryKey: ["rectification-stats", query],
    queryFn: () =>
      apiClient.get<RectificationStats>("/rectifications/stats", { params }),
  });
}

export type {
  RectificationTask,
  RectificationProgress,
  RectificationTaskDetail,
  RectificationListResponse,
  RectificationListQuery,
  RectificationStats,
  GenerateResult,
};

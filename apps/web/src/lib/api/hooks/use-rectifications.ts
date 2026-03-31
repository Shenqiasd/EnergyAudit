"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { toast } from "@/lib/hooks/use-toast";

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
      toast({ title: "生成成功", description: "整改任务已生成", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "生成失败", description: error.message, variant: "destructive" });
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
      toast({ title: "认领成功", description: "整改任务已认领", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "认领失败", description: error.message, variant: "destructive" });
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
      toast({ title: "更新成功", description: "进度已更新", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
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
      toast({ title: "提交成功", description: "整改已提交审核", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "提交失败", description: error.message, variant: "destructive" });
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
      toast({ title: "通过成功", description: "整改已通过验收", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "操作失败", description: error.message, variant: "destructive" });
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
      toast({ title: "驳回成功", description: "整改已驳回", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "操作失败", description: error.message, variant: "destructive" });
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
      toast({ title: "延期成功", description: "整改截止日期已延长", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "延期失败", description: error.message, variant: "destructive" });
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

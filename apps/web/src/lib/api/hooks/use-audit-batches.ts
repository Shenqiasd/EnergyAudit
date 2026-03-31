"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { toast } from "@/lib/hooks/use-toast";

interface AuditBatch {
  id: string;
  name: string;
  year: number;
  status: string;
  businessType?: string;
  templateVersionId: string | null;
  description: string | null;
  filingDeadline: string | null;
  reviewDeadline: string | null;
  isOverdue?: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  projectCount?: number;
}

interface BatchStats {
  [status: string]: number;
}

interface AuditBatchDetail extends AuditBatch {
  stats: BatchStats;
  totalProjects: number;
}

interface BatchListResponse {
  items: AuditBatch[];
  total: number;
  page: number;
  pageSize: number;
}

interface BatchListParams {
  page?: number;
  pageSize?: number;
  year?: number;
  status?: string;
  businessType?: string;
}

interface CreateBatchInput {
  name: string;
  year: number;
  description?: string;
  filingDeadline?: string;
  reviewDeadline?: string;
  templateVersionId?: string;
  createdBy?: string;
  businessType?: string;
}

interface UpdateBatchInput {
  name?: string;
  description?: string;
  filingDeadline?: string;
  reviewDeadline?: string;
}

interface AssignEnterprisesInput {
  enterpriseIds: string[];
}

interface AssignResult {
  created: Array<{ enterpriseId: string; projectId: string; status: string }>;
  errors: Array<{ enterpriseId: string; error: string }>;
}

export function useAuditBatches(params: BatchListParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.pageSize) queryParams.pageSize = String(params.pageSize);
  if (params.year) queryParams.year = String(params.year);
  if (params.status) queryParams.status = params.status;
  if (params.businessType) queryParams.businessType = params.businessType;

  return useQuery<BatchListResponse>({
    queryKey: ["audit-batches", params],
    queryFn: () =>
      apiClient.get<BatchListResponse>("/audit-batches", { params: queryParams }),
  });
}

export function useAuditBatch(id: string) {
  return useQuery<AuditBatchDetail>({
    queryKey: ["audit-batch", id],
    queryFn: () => apiClient.get<AuditBatchDetail>(`/audit-batches/${id}`),
    enabled: !!id,
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBatchInput) =>
      apiClient.post<AuditBatch>("/audit-batches", data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["audit-batches"] });
      toast({ title: "创建成功", description: "审计批次已创建", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateBatch(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBatchInput) =>
      apiClient.put<AuditBatch>(`/audit-batches/${id}`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["audit-batches"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-batch", id] });
      toast({ title: "更新成功", description: "批次信息已更新", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useAssignEnterprises(batchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignEnterprisesInput) =>
      apiClient.post<AssignResult>(`/audit-batches/${batchId}/assign`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["audit-batches"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-batch", batchId] });
      void queryClient.invalidateQueries({ queryKey: ["audit-projects"] });
      toast({ title: "分配成功", description: "企业已分配到批次", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "分配失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useExtendBatchDeadline(batchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { newDeadline: string; reason: string; deadlineType?: 'filing' | 'review' }) =>
      apiClient.patch<AuditBatch>(`/audit-batches/${batchId}/extend-deadline`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["audit-batches"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-batch", batchId] });
      toast({ title: "延期成功", description: "截止日期已延长", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "延期失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useCloseBatch(batchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.put<AuditBatch>(`/audit-batches/${batchId}/close`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["audit-batches"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-batch", batchId] });
      toast({ title: "关闭成功", description: "批次已关闭", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "关闭失败", description: error.message, variant: "destructive" });
    },
  });
}

export type {
  AuditBatch,
  AuditBatchDetail,
  BatchListResponse,
  BatchListParams,
  CreateBatchInput,
  UpdateBatchInput,
  AssignEnterprisesInput,
  AssignResult,
  BatchStats,
};

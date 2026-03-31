"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { toast } from "@/lib/hooks/use-toast";

interface ReviewTask {
  id: string;
  auditProjectId: string;
  reportId: string;
  reviewerId: string;
  status: string;
  conclusion: string | null;
  totalScore: string | null;
  assignedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReviewScore {
  id: string;
  reviewTaskId: string;
  category: string;
  score: string;
  maxScore: string;
  comment: string | null;
}

interface ReviewIssue {
  id: string;
  reviewTaskId: string;
  description: string;
  severity: string;
  moduleCode: string | null;
  fieldCode: string | null;
  suggestion: string | null;
  requiresRectification: boolean;
  createdAt: string;
}

interface ReviewTaskDetail extends ReviewTask {
  scores: ReviewScore[];
  issues: ReviewIssue[];
}

interface ReviewTaskListResponse {
  items: ReviewTask[];
  page: number;
  pageSize: number;
}

interface ReviewTaskListQuery {
  projectId?: string;
  reviewerId?: string;
  status?: string;
  batchId?: string;
  page?: number;
  pageSize?: number;
}

interface ScoreInput {
  category: string;
  score: string;
  maxScore: string;
  comment?: string;
}

interface ScoresResult {
  scores: ReviewScore[];
  totalScore: number;
  totalMaxScore: number;
  averageScore: number;
}

export function useReviewTasks(query: ReviewTaskListQuery = {}) {
  const params: Record<string, string> = {};
  if (query.projectId) params.projectId = query.projectId;
  if (query.reviewerId) params.reviewerId = query.reviewerId;
  if (query.status) params.status = query.status;
  if (query.batchId) params.batchId = query.batchId;
  if (query.page) params.page = String(query.page);
  if (query.pageSize) params.pageSize = String(query.pageSize);

  return useQuery<ReviewTaskListResponse>({
    queryKey: ["review-tasks", query],
    queryFn: () =>
      apiClient.get<ReviewTaskListResponse>("/reviews", { params }),
  });
}

export function useReviewTask(id: string) {
  return useQuery<ReviewTaskDetail>({
    queryKey: ["review-task", id],
    queryFn: () => apiClient.get<ReviewTaskDetail>(`/reviews/${id}`),
    enabled: !!id,
  });
}

export function useCreateReviewTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { auditProjectId: string; reportId: string; reviewerId: string }) =>
      apiClient.post<ReviewTaskDetail>("/reviews", data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["review-tasks"] });
      toast({ title: "创建成功", description: "审核任务已创建", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useAssignReviewer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewerId: string) =>
      apiClient.put<ReviewTaskDetail>(`/reviews/${id}/assign`, { reviewerId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["review-task", id] });
      void queryClient.invalidateQueries({ queryKey: ["review-tasks"] });
      toast({ title: "分配成功", description: "审核员已分配", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "分配失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useStartReview(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.put<ReviewTaskDetail>(`/reviews/${id}/start`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["review-task", id] });
      void queryClient.invalidateQueries({ queryKey: ["review-tasks"] });
      toast({ title: "开始审核", description: "审核任务已开始", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "操作失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useSubmitReview(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { conclusion: string; totalScore?: string }) =>
      apiClient.put<ReviewTaskDetail>(`/reviews/${id}/submit`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["review-task", id] });
      void queryClient.invalidateQueries({ queryKey: ["review-tasks"] });
      toast({ title: "提交成功", description: "审核结论已提交", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "提交失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useConfirmReview(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.put<ReviewTaskDetail>(`/reviews/${id}/confirm`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["review-task", id] });
      void queryClient.invalidateQueries({ queryKey: ["review-tasks"] });
      toast({ title: "确认成功", description: "审核已确认", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "确认失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useReturnReview(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.put<ReviewTaskDetail>(`/reviews/${id}/return`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["review-task", id] });
      void queryClient.invalidateQueries({ queryKey: ["review-tasks"] });
      toast({ title: "退回成功", description: "审核已退回", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "退回失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useReviewScores(taskId: string) {
  return useQuery<ScoresResult>({
    queryKey: ["review-scores", taskId],
    queryFn: () => apiClient.get<ScoresResult>(`/reviews/${taskId}/scores`),
    enabled: !!taskId,
  });
}

export function useSubmitScores(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scores: ScoreInput[]) =>
      apiClient.post<ScoresResult>(`/reviews/${taskId}/scores`, { scores }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["review-scores", taskId] });
      void queryClient.invalidateQueries({ queryKey: ["review-task", taskId] });
      toast({ title: "评分成功", description: "审核评分已保存", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "评分失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useReviewIssues(taskId: string) {
  return useQuery<ReviewIssue[]>({
    queryKey: ["review-issues", taskId],
    queryFn: () => apiClient.get<ReviewIssue[]>(`/reviews/${taskId}/issues`),
    enabled: !!taskId,
  });
}

export function useCreateIssue(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      description: string;
      severity: string;
      moduleCode?: string;
      fieldCode?: string;
      suggestion?: string;
      requiresRectification?: boolean;
    }) => apiClient.post<ReviewIssue>(`/reviews/${taskId}/issues`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["review-issues", taskId] });
      void queryClient.invalidateQueries({ queryKey: ["review-task", taskId] });
      toast({ title: "添加成功", description: "问题已记录", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "添加失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useResolveIssue(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.put<ReviewIssue>(`/reviews/issues/${issueId}/resolve`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["review-issues"] });
      toast({ title: "解决成功", description: "问题已解决", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "操作失败", description: error.message, variant: "destructive" });
    },
  });
}

export type {
  ReviewTask,
  ReviewScore,
  ReviewIssue,
  ReviewTaskDetail,
  ReviewTaskListResponse,
  ReviewTaskListQuery,
  ScoreInput,
  ScoresResult,
};

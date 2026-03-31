"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { toast } from "@/lib/hooks/use-toast";

interface AuditProject {
  id: string;
  enterpriseId: string;
  batchId: string;
  status: string;
  templateVersionId: string | null;
  deadline: string | null;
  isOverdue: boolean;
  configComplete: boolean;
  createdAt: string;
  updatedAt: string;
  enterpriseName: string | null;
  batchName?: string | null;
  validNextStates?: string[];
}

interface ProjectListResponse {
  items: AuditProject[];
  total: number;
  page: number;
  pageSize: number;
}

interface ProjectListParams {
  page?: number;
  pageSize?: number;
  batchId?: string;
  status?: string;
  enterpriseId?: string;
  enterpriseName?: string;
}

interface ProjectMember {
  id: string;
  auditProjectId: string;
  userId: string;
  role: string;
  joinedAt: string;
  userName: string | null;
  userEmail: string | null;
}

interface AddMemberInput {
  userId: string;
  role: string;
}

interface TransitionInput {
  targetStatus: string;
  userId?: string;
  reason?: string;
}

interface TransitionResult {
  projectId: string;
  fromStatus: string;
  toStatus: string;
}

interface StatusTransition {
  id: string;
  projectId: string;
  fromStatus: string;
  toStatus: string;
  transitionedAt: string;
  userId: string | null;
  reason: string | null;
}

export function useAuditProjects(params: ProjectListParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.pageSize) queryParams.pageSize = String(params.pageSize);
  if (params.batchId) queryParams.batchId = params.batchId;
  if (params.status) queryParams.status = params.status;
  if (params.enterpriseId) queryParams.enterpriseId = params.enterpriseId;
  if (params.enterpriseName) queryParams.enterpriseName = params.enterpriseName;

  return useQuery<ProjectListResponse>({
    queryKey: ["audit-projects", params],
    queryFn: () =>
      apiClient.get<ProjectListResponse>("/audit-projects", { params: queryParams }),
  });
}

export function useAuditProject(id: string) {
  return useQuery<AuditProject>({
    queryKey: ["audit-project", id],
    queryFn: () => apiClient.get<AuditProject>(`/audit-projects/${id}`),
    enabled: !!id,
  });
}

export function useTransitionProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TransitionInput) =>
      apiClient.put<TransitionResult>(`/audit-projects/${id}/transition`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["audit-projects"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-project", id] });
      void queryClient.invalidateQueries({ queryKey: ["project-timeline", id] });
      toast({ title: "操作成功", description: "项目状态已更新", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "操作失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useProjectMembers(id: string) {
  return useQuery<ProjectMember[]>({
    queryKey: ["project-members", id],
    queryFn: () => apiClient.get<ProjectMember[]>(`/audit-projects/${id}/members`),
    enabled: !!id,
  });
}

export function useAddMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddMemberInput) =>
      apiClient.post(`/audit-projects/${projectId}/members`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      toast({ title: "添加成功", description: "成员已添加", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "添加失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      apiClient.delete(`/audit-projects/${projectId}/members/${memberId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      toast({ title: "移除成功", description: "成员已移除", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "移除失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useExtendProjectDeadline(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { newDeadline: string; reason: string }) =>
      apiClient.patch<{ id: string; deadline: string; isOverdue: boolean; reason: string }>(
        `/audit-projects/${id}/extend-deadline`,
        data,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["audit-projects"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-project", id] });
      toast({ title: "延期成功", description: "项目截止日期已延长", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "延期失败", description: error.message, variant: "destructive" });
    },
  });
}

interface EnterpriseProfile {
  id: string;
  auditProjectId: string;
  enterpriseId: string;
  name: string;
  unifiedSocialCreditCode: string;
  industryCode: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  snapshotAt: string;
}

export function useEnterpriseProfile(projectId: string) {
  return useQuery<EnterpriseProfile>({
    queryKey: ["enterprise-profile", projectId],
    queryFn: () =>
      apiClient.get<EnterpriseProfile>(`/audit-projects/${projectId}/enterprise-profile`),
    enabled: !!projectId,
  });
}

export function useProjectTimeline(id: string) {
  return useQuery<StatusTransition[]>({
    queryKey: ["project-timeline", id],
    queryFn: () => apiClient.get<StatusTransition[]>(`/audit-projects/${id}/timeline`),
    enabled: !!id,
  });
}

export type {
  AuditProject,
  ProjectListResponse,
  ProjectListParams,
  ProjectMember,
  AddMemberInput,
  TransitionInput,
  TransitionResult,
  StatusTransition,
  EnterpriseProfile,
};

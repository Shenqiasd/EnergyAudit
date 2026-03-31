"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { toast } from "@/lib/hooks/use-toast";

interface Report {
  id: string;
  auditProjectId: string;
  version: number;
  versionType: string;
  status: string;
  templateVersionId: string | null;
  fileAttachmentId: string | null;
  generatedAt: string | null;
  submittedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReportSection {
  id: string;
  reportId: string;
  sectionCode: string;
  sectionName: string;
  sortOrder: number;
  content: string | null;
  charts: Array<{ chartCode: string; chartType: string; title: string }> | null;
}

interface ReportDetail extends Report {
  sections: ReportSection[];
}

interface ReportListResponse {
  items: Report[];
  page: number;
  pageSize: number;
}

interface ReportVersion {
  id: string;
  reportId: string;
  versionType: string;
  versionNumber: number;
  isActive: boolean;
  fileUrl: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface ReportVersionDetail extends ReportVersion {
  sections: ReportSection[];
}

interface VersionDiff {
  sectionCode: string;
  sectionName: string;
  v1Content: string | null;
  v2Content: string | null;
  changed: boolean;
}

interface VersionComparison {
  version1: { id: string; versionNumber: number; versionType: string };
  version2: { id: string; versionNumber: number; versionType: string };
  diffs: VersionDiff[];
  totalSections: number;
  changedSections: number;
}

interface ReportListQuery {
  projectId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

interface GenerateResult {
  jobId: string;
  status: string;
  message: string;
}

export function useReports(query: ReportListQuery = {}) {
  const params: Record<string, string> = {};
  if (query.projectId) params.projectId = query.projectId;
  if (query.status) params.status = query.status;
  if (query.page) params.page = String(query.page);
  if (query.pageSize) params.pageSize = String(query.pageSize);

  return useQuery<ReportListResponse>({
    queryKey: ["reports", query],
    queryFn: () =>
      apiClient.get<ReportListResponse>("/reports", { params }),
  });
}

export function useReport(id: string) {
  return useQuery<ReportDetail>({
    queryKey: ["report", id],
    queryFn: () => apiClient.get<ReportDetail>(`/reports/${id}`),
    enabled: !!id,
  });
}

export function useGenerateReport(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<GenerateResult>(`/reports/generate/${projectId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast({ title: "生成成功", description: "报告已开始生成", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "生成失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useTransitionReportStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      apiClient.put<Report>(`/reports/${id}/status`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["report", id] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast({ title: "操作成功", description: "报告状态已更新", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "操作失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useUploadReport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { fileUrl: string; versionType?: string; createdBy?: string }) =>
      apiClient.post<ReportVersion>(`/reports/${id}/upload`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["report", id] });
      void queryClient.invalidateQueries({ queryKey: ["report-versions", id] });
      toast({ title: "上传成功", description: "报告已上传", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "上传失败", description: error.message, variant: "destructive" });
    },
  });
}

export function useReportVersions(id: string) {
  return useQuery<ReportVersion[]>({
    queryKey: ["report-versions", id],
    queryFn: () =>
      apiClient.get<ReportVersion[]>(`/reports/${id}/versions`),
    enabled: !!id,
  });
}

export function useReportVersionDetail(reportId: string, versionId: string) {
  return useQuery<ReportVersionDetail>({
    queryKey: ["report-version-detail", reportId, versionId],
    queryFn: () =>
      apiClient.get<ReportVersionDetail>(`/reports/${reportId}/versions/${versionId}`),
    enabled: !!reportId && !!versionId,
  });
}

export function useCompareVersions(reportId: string, v1: string, v2: string) {
  return useQuery<VersionComparison>({
    queryKey: ["version-comparison", reportId, v1, v2],
    queryFn: () =>
      apiClient.get<VersionComparison>(`/reports/${reportId}/versions/compare`, {
        params: { v1, v2 },
      }),
    enabled: !!reportId && !!v1 && !!v2,
  });
}

export function useActivateVersion(reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) =>
      apiClient.post(`/reports/${reportId}/versions/${versionId}/activate`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["report-versions", reportId] });
      void queryClient.invalidateQueries({ queryKey: ["report", reportId] });
      toast({ title: "激活成功", description: "版本已激活", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "激活失败", description: error.message, variant: "destructive" });
    },
  });
}

export type {
  Report,
  ReportSection,
  ReportDetail,
  ReportListResponse,
  ReportVersion,
  ReportVersionDetail,
  ReportListQuery,
  GenerateResult,
  VersionDiff,
  VersionComparison,
};

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

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
  fileUrl: string | null;
  createdBy: string | null;
  createdAt: string;
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

export type {
  Report,
  ReportSection,
  ReportDetail,
  ReportListResponse,
  ReportVersion,
  ReportListQuery,
  GenerateResult,
};

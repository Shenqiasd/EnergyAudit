"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient, getAuthHeaders } from "../client";

interface EnterpriseLedgerItem {
  enterpriseId: string;
  enterpriseName: string;
  industryCode: string | null;
  projectId: string;
  projectStatus: string;
  isOverdue: boolean;
  reviewScore: string | null;
  rectificationStatus: string | null;
  filingProgress: number;
}

interface ReviewLedgerItem {
  reviewTaskId: string;
  projectId: string;
  enterpriseId: string;
  enterpriseName: string;
  reviewerId: string;
  status: string;
  totalScore: string | null;
  issueCount: number;
  completedAt: string | null;
  createdAt: string;
}

interface RectificationLedgerItem {
  rectificationTaskId: string;
  projectId: string;
  enterpriseId: string;
  enterpriseName: string;
  title: string;
  description: string | null;
  status: string;
  isOverdue: boolean;
  progressPercent: number;
  deadline: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface EnterpriseLedgerQuery {
  batchId?: string;
  industryCode?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

interface ReviewLedgerQuery {
  batchId?: string;
  reviewerId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

interface RectificationLedgerQuery {
  batchId?: string;
  enterpriseId?: string;
  status?: string;
  isOverdue?: boolean;
  page?: number;
  pageSize?: number;
}

function toParams(query: object): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params[key] = String(value);
    }
  }
  return params;
}

export function useEnterpriseLedger(query: EnterpriseLedgerQuery = {}) {
  const params = toParams(query);

  return useQuery<PaginatedResponse<EnterpriseLedgerItem>>({
    queryKey: ["ledgers", "enterprise", query],
    queryFn: () =>
      apiClient.get<PaginatedResponse<EnterpriseLedgerItem>>(
        "/ledgers/enterprise",
        { params },
      ),
  });
}

export function useReviewLedger(query: ReviewLedgerQuery = {}) {
  const params = toParams(query);

  return useQuery<PaginatedResponse<ReviewLedgerItem>>({
    queryKey: ["ledgers", "review", query],
    queryFn: () =>
      apiClient.get<PaginatedResponse<ReviewLedgerItem>>(
        "/ledgers/review",
        { params },
      ),
  });
}

export function useRectificationLedger(query: RectificationLedgerQuery = {}) {
  const params = toParams(query);

  return useQuery<PaginatedResponse<RectificationLedgerItem>>({
    queryKey: ["ledgers", "rectification", query],
    queryFn: () =>
      apiClient.get<PaginatedResponse<RectificationLedgerItem>>(
        "/ledgers/rectification",
        { params },
      ),
  });
}

export function useExportLedger(type: "enterprise" | "review" | "rectification") {
  return useMutation({
    mutationFn: async (query: Record<string, unknown>) => {
      const params = toParams(query);
      const queryString = new URLSearchParams(params).toString();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
      const url = `${baseUrl}/ledgers/${type}/export${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) {
        throw new Error("导出失败");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${type}-ledger.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    },
  });
}

export type {
  EnterpriseLedgerItem,
  ReviewLedgerItem,
  RectificationLedgerItem,
  PaginatedResponse,
  EnterpriseLedgerQuery,
  ReviewLedgerQuery,
  RectificationLedgerQuery,
};

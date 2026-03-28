"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";

interface AuditLog {
  id: string;
  userId: string;
  userRole: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  detail: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

interface AuditLogFilters {
  page?: number;
  pageSize?: number;
  userId?: string;
  action?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  const queryParams: Record<string, string> = {};
  if (filters.page) queryParams.page = String(filters.page);
  if (filters.pageSize) queryParams.pageSize = String(filters.pageSize);
  if (filters.userId) queryParams.userId = filters.userId;
  if (filters.action) queryParams.action = filters.action;
  if (filters.targetType) queryParams.targetType = filters.targetType;
  if (filters.startDate) queryParams.startDate = filters.startDate;
  if (filters.endDate) queryParams.endDate = filters.endDate;

  return useQuery<AuditLogListResponse>({
    queryKey: ["audit-logs", filters],
    queryFn: () =>
      apiClient.get<AuditLogListResponse>("/audit-logs", {
        params: queryParams,
      }),
  });
}

export function useEntityLogs(
  entityType: string,
  entityId: string,
  page = 1,
) {
  return useQuery<AuditLogListResponse>({
    queryKey: ["audit-logs", "entity", entityType, entityId, page],
    queryFn: () =>
      apiClient.get<AuditLogListResponse>(
        `/audit-logs/entity/${entityType}/${entityId}`,
        { params: { page: String(page) } },
      ),
    enabled: !!entityType && !!entityId,
  });
}

export type { AuditLog, AuditLogListResponse, AuditLogFilters };

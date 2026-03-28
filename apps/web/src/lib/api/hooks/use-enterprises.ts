"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

interface Enterprise {
  id: string;
  unifiedSocialCreditCode: string;
  name: string;
  admissionStatus: string;
  industryCode: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  notes: string | null;
  expiryDate: string | null;
  lastLoginAt: string | null;
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EnterpriseBinding {
  id: string;
  enterpriseId: string;
  externalSystem: string;
  externalId: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  lastSuccessfulSnapshot: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EnterpriseDetail extends Enterprise {
  bindings: EnterpriseBinding[];
}

interface EnterpriseListResponse {
  items: Enterprise[];
  total: number;
  page: number;
  pageSize: number;
}

interface EnterpriseListParams {
  page?: number;
  pageSize?: number;
  name?: string;
  creditCode?: string;
  admissionStatus?: string;
}

interface CreateEnterpriseInput {
  name: string;
  unifiedSocialCreditCode: string;
  industryCode?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  notes?: string;
}

interface AdmissionActionInput {
  operatedBy: string;
  reason?: string;
}

export function useEnterprises(params: EnterpriseListParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.pageSize) queryParams.pageSize = String(params.pageSize);
  if (params.name) queryParams.name = params.name;
  if (params.creditCode) queryParams.creditCode = params.creditCode;
  if (params.admissionStatus) queryParams.admissionStatus = params.admissionStatus;

  return useQuery<EnterpriseListResponse>({
    queryKey: ["enterprises", params],
    queryFn: () =>
      apiClient.get<EnterpriseListResponse>("/enterprises", { params: queryParams }),
  });
}

export function useEnterprise(id: string) {
  return useQuery<EnterpriseDetail>({
    queryKey: ["enterprise", id],
    queryFn: () => apiClient.get<EnterpriseDetail>(`/enterprises/${id}`),
    enabled: !!id,
  });
}

export function useCreateEnterprise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEnterpriseInput) =>
      apiClient.post<Enterprise>("/enterprises", data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["enterprises"] });
    },
  });
}

export function useUpdateEnterprise(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateEnterpriseInput>) =>
      apiClient.put<Enterprise>(`/enterprises/${id}`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["enterprises"] });
      void queryClient.invalidateQueries({ queryKey: ["enterprise", id] });
    },
  });
}

export function useUpdateAdmission(id: string, action: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdmissionActionInput) =>
      apiClient.put(`/enterprises/${id}/admission/${action}`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["enterprises"] });
      void queryClient.invalidateQueries({ queryKey: ["enterprise", id] });
    },
  });
}

export function useSyncEnterprise(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post(`/enterprises/${id}/sync`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["enterprise", id] });
    },
  });
}

export function useEnterpriseBinding(id: string) {
  return useQuery<EnterpriseBinding[]>({
    queryKey: ["enterprise-binding", id],
    queryFn: () => apiClient.get<EnterpriseBinding[]>(`/enterprises/${id}/binding`),
    enabled: !!id,
  });
}

export type {
  Enterprise,
  EnterpriseBinding,
  EnterpriseDetail,
  EnterpriseListResponse,
  EnterpriseListParams,
  CreateEnterpriseInput,
  AdmissionActionInput,
};

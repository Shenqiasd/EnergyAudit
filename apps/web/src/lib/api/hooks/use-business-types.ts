"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

interface BusinessTypeConfig {
  id: string;
  businessType: string;
  label: string;
  description: string | null;
  defaultTemplateId: string | null;
  reportTemplateId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ModuleVisibilityItem {
  id: string;
  businessType: string;
  moduleCode: string;
  isVisible: boolean;
  isRequired: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateBusinessTypeInput {
  businessType: string;
  label: string;
  description?: string;
  defaultTemplateId?: string;
  reportTemplateId?: string;
}

interface UpdateBusinessTypeInput {
  label?: string;
  description?: string;
  defaultTemplateId?: string;
  reportTemplateId?: string;
  isActive?: boolean;
}

interface ModuleVisibilityInput {
  moduleCode: string;
  isVisible: boolean;
  isRequired: boolean;
  sortOrder: number;
}

export function useBusinessTypes() {
  return useQuery<BusinessTypeConfig[]>({
    queryKey: ["business-types"],
    queryFn: () =>
      apiClient.get<BusinessTypeConfig[]>("/business-types"),
  });
}

export function useBusinessType(type: string) {
  return useQuery<BusinessTypeConfig>({
    queryKey: ["business-type", type],
    queryFn: () =>
      apiClient.get<BusinessTypeConfig>(`/business-types/${type}`),
    enabled: !!type,
  });
}

export function useCreateBusinessType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBusinessTypeInput) =>
      apiClient.post<BusinessTypeConfig>("/business-types", data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["business-types"] });
    },
  });
}

export function useUpdateBusinessType(type: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBusinessTypeInput) =>
      apiClient.put<BusinessTypeConfig>(`/business-types/${type}`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["business-types"] });
      void queryClient.invalidateQueries({ queryKey: ["business-type", type] });
    },
  });
}

export function useModuleVisibility(businessType: string) {
  return useQuery<ModuleVisibilityItem[]>({
    queryKey: ["module-visibility", businessType],
    queryFn: () =>
      apiClient.get<ModuleVisibilityItem[]>(
        `/business-types/${businessType}/modules`,
      ),
    enabled: !!businessType,
  });
}

export function useSetModuleVisibility(businessType: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ModuleVisibilityInput[]) =>
      apiClient.put<ModuleVisibilityItem[]>(
        `/business-types/${businessType}/modules`,
        data,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["module-visibility", businessType],
      });
    },
  });
}

export type {
  BusinessTypeConfig,
  ModuleVisibilityItem,
  CreateBusinessTypeInput,
  UpdateBusinessTypeInput,
  ModuleVisibilityInput,
};

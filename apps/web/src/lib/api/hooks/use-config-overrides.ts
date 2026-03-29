"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

// ==================== Types ====================

interface ConfigOverride {
  id: string;
  scopeType: string;
  scopeId: string | null;
  targetType: string;
  targetCode: string;
  configJson: Record<string, unknown>;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EffectiveConfig {
  module: Record<string, unknown>;
  fields: Record<string, unknown>[];
  validationRules: Record<string, unknown>[];
}

interface SetOverrideInput {
  scopeType: string;
  scopeId?: string | null;
  targetType: string;
  targetCode: string;
  configJson: Record<string, unknown>;
  createdBy?: string;
}

// ==================== Config Override Hooks ====================

export function useConfigOverrides(
  scopeType: string,
  scopeId?: string,
  targetType?: string,
) {
  const params: Record<string, string> = { scopeType };
  if (scopeId) params.scopeId = scopeId;
  if (targetType) params.targetType = targetType;

  return useQuery<ConfigOverride[]>({
    queryKey: ["config-overrides", scopeType, scopeId, targetType],
    queryFn: () =>
      apiClient.get<ConfigOverride[]>("/config-overrides", { params }),
    enabled: !!scopeType,
  });
}

export function useSetConfigOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SetOverrideInput) =>
      apiClient.put<ConfigOverride>("/config-overrides", data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["config-overrides"] });
      void queryClient.invalidateQueries({ queryKey: ["config-effective"] });
    },
  });
}

export function useDeleteConfigOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/config-overrides/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["config-overrides"] });
      void queryClient.invalidateQueries({ queryKey: ["config-effective"] });
    },
  });
}

export function useEffectiveConfig(
  moduleCode: string,
  params?: { enterpriseId?: string; batchId?: string; industryCode?: string },
) {
  const queryParams: Record<string, string> = {};
  if (params?.enterpriseId) queryParams.enterpriseId = params.enterpriseId;
  if (params?.batchId) queryParams.batchId = params.batchId;
  if (params?.industryCode) queryParams.industryCode = params.industryCode;

  return useQuery<EffectiveConfig>({
    queryKey: ["config-effective", moduleCode, params],
    queryFn: () =>
      apiClient.get<EffectiveConfig>(`/config-effective/${moduleCode}`, {
        params: queryParams,
      }),
    enabled: !!moduleCode,
  });
}

// ==================== Re-export types ====================

export type {
  ConfigOverride,
  EffectiveConfig,
  SetOverrideInput,
};

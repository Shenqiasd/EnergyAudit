"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

// ==================== Types ====================

interface DictionaryItem {
  id: string;
  category: string;
  code: string;
  name: string;
  parentCode: string | null;
  sortOrder: number;
  isActive: boolean;
  metadata: string | null;
  children: DictionaryItem[];
}

interface EnergyDefinition {
  id: string;
  enterpriseId: string;
  energyCode: string;
  name: string;
  energyType: string;
  conversionFactor: string;
  measurementUnit: string;
  isActive: boolean;
  sortOrder: number | null;
}

interface ProductDefinition {
  id: string;
  enterpriseId: string;
  productCode: string;
  name: string;
  measurementUnit: string;
  unitDefinitionId: string | null;
  processDescription: string | null;
  isActive: boolean;
  sortOrder: number | null;
}

interface UnitDefinition {
  id: string;
  enterpriseId: string;
  unitCode: string;
  name: string;
  unitType: string;
  energyBoundaryDescription: string | null;
  associatedEnergyCodes: string | null;
  isActive: boolean;
  sortOrder: number | null;
}

interface CarbonEmissionFactor {
  id: string;
  energyCode: string;
  name: string;
  emissionFactor: string;
  oxidationRate: string;
  standardSource: string | null;
  applicableYear: number | null;
  measurementUnit: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConfigCompleteness {
  isComplete: boolean;
  energyDefinitions: { count: number; required: number; complete: boolean };
  productDefinitions: { count: number; required: number; complete: boolean };
  unitDefinitions: { count: number; required: number; complete: boolean };
  missingItems: string[];
}

// ==================== Dictionary Hooks ====================

export function useDictionaries(category: string) {
  return useQuery<DictionaryItem[]>({
    queryKey: ["dictionaries", category],
    queryFn: () =>
      apiClient.get<DictionaryItem[]>("/dictionaries", {
        params: { category },
      }),
    enabled: !!category,
  });
}

export function useCreateDictionary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      category: string;
      code: string;
      name: string;
      parentCode?: string;
      sortOrder?: number;
      metadata?: string;
    }) => apiClient.post<DictionaryItem>("/dictionaries", data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["dictionaries", variables.category],
      });
    },
  });
}

export function useUpdateDictionary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      category: string;
      name?: string;
      parentCode?: string;
      sortOrder?: number;
      isActive?: boolean;
      metadata?: string;
    }) => apiClient.put<DictionaryItem>(`/dictionaries/${id}`, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["dictionaries", variables.category],
      });
    },
  });
}

export function useDeleteDictionary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, category }: { id: string; category: string }) =>
      apiClient.delete(`/dictionaries/${id}`),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["dictionaries", variables.category],
      });
    },
  });
}

// ==================== Energy Definition Hooks ====================

export function useEnergyDefinitions(enterpriseId: string) {
  return useQuery<EnergyDefinition[]>({
    queryKey: ["energy-definitions", enterpriseId],
    queryFn: () =>
      apiClient.get<EnergyDefinition[]>(
        `/enterprises/${enterpriseId}/energy-definitions`,
      ),
    enabled: !!enterpriseId,
  });
}

export function useCreateEnergyDefinition(enterpriseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      energyCode: string;
      name: string;
      energyType: string;
      conversionFactor: string;
      measurementUnit: string;
      sortOrder?: number;
    }) =>
      apiClient.post<EnergyDefinition>(
        `/enterprises/${enterpriseId}/energy-definitions`,
        data,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["energy-definitions", enterpriseId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["config-completeness", enterpriseId],
      });
    },
  });
}

export function useUpdateEnergyDefinition(enterpriseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      energyType?: string;
      conversionFactor?: string;
      measurementUnit?: string;
      isActive?: boolean;
      sortOrder?: number;
    }) =>
      apiClient.put<EnergyDefinition>(
        `/enterprises/${enterpriseId}/energy-definitions/${id}`,
        data,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["energy-definitions", enterpriseId],
      });
    },
  });
}

export function useDeleteEnergyDefinition(enterpriseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(
        `/enterprises/${enterpriseId}/energy-definitions/${id}`,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["energy-definitions", enterpriseId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["config-completeness", enterpriseId],
      });
    },
  });
}

// ==================== Product Definition Hooks ====================

export function useProductDefinitions(enterpriseId: string) {
  return useQuery<ProductDefinition[]>({
    queryKey: ["product-definitions", enterpriseId],
    queryFn: () =>
      apiClient.get<ProductDefinition[]>(
        `/enterprises/${enterpriseId}/product-definitions`,
      ),
    enabled: !!enterpriseId,
  });
}

export function useCreateProductDefinition(enterpriseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      productCode: string;
      name: string;
      measurementUnit: string;
      unitDefinitionId?: string;
      processDescription?: string;
      sortOrder?: number;
    }) =>
      apiClient.post<ProductDefinition>(
        `/enterprises/${enterpriseId}/product-definitions`,
        data,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["product-definitions", enterpriseId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["config-completeness", enterpriseId],
      });
    },
  });
}

export function useUpdateProductDefinition(enterpriseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      measurementUnit?: string;
      unitDefinitionId?: string;
      processDescription?: string;
      isActive?: boolean;
      sortOrder?: number;
    }) =>
      apiClient.put<ProductDefinition>(
        `/enterprises/${enterpriseId}/product-definitions/${id}`,
        data,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["product-definitions", enterpriseId],
      });
    },
  });
}

export function useDeleteProductDefinition(enterpriseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(
        `/enterprises/${enterpriseId}/product-definitions/${id}`,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["product-definitions", enterpriseId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["config-completeness", enterpriseId],
      });
    },
  });
}

// ==================== Unit Definition Hooks ====================

export function useUnitDefinitions(enterpriseId: string) {
  return useQuery<UnitDefinition[]>({
    queryKey: ["unit-definitions", enterpriseId],
    queryFn: () =>
      apiClient.get<UnitDefinition[]>(
        `/enterprises/${enterpriseId}/unit-definitions`,
      ),
    enabled: !!enterpriseId,
  });
}

export function useCreateUnitDefinition(enterpriseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      unitCode: string;
      name: string;
      unitType: string;
      energyBoundaryDescription?: string;
      associatedEnergyCodes?: string;
      sortOrder?: number;
    }) =>
      apiClient.post<UnitDefinition>(
        `/enterprises/${enterpriseId}/unit-definitions`,
        data,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["unit-definitions", enterpriseId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["config-completeness", enterpriseId],
      });
    },
  });
}

export function useUpdateUnitDefinition(enterpriseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      unitType?: string;
      energyBoundaryDescription?: string;
      associatedEnergyCodes?: string;
      isActive?: boolean;
      sortOrder?: number;
    }) =>
      apiClient.put<UnitDefinition>(
        `/enterprises/${enterpriseId}/unit-definitions/${id}`,
        data,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["unit-definitions", enterpriseId],
      });
    },
  });
}

export function useDeleteUnitDefinition(enterpriseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(
        `/enterprises/${enterpriseId}/unit-definitions/${id}`,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["unit-definitions", enterpriseId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["config-completeness", enterpriseId],
      });
    },
  });
}

// ==================== Carbon Emission Factor Hooks ====================

export function useCarbonFactors(year?: number) {
  return useQuery<CarbonEmissionFactor[]>({
    queryKey: ["carbon-factors", year],
    queryFn: () =>
      apiClient.get<CarbonEmissionFactor[]>("/carbon-emission-factors", {
        params: year ? { year: String(year) } : undefined,
      }),
  });
}

export function useCreateCarbonFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      energyCode: string;
      name: string;
      emissionFactor: string;
      oxidationRate?: string;
      standardSource?: string;
      applicableYear?: number;
      measurementUnit: string;
      isDefault?: boolean;
    }) => apiClient.post<CarbonEmissionFactor>("/carbon-emission-factors", data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["carbon-factors"] });
    },
  });
}

export function useUpdateCarbonFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      emissionFactor?: string;
      oxidationRate?: string;
      standardSource?: string;
      applicableYear?: number;
      measurementUnit?: string;
      isDefault?: boolean;
      isActive?: boolean;
    }) => apiClient.put<CarbonEmissionFactor>(`/carbon-emission-factors/${id}`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["carbon-factors"] });
    },
  });
}

// ==================== Config Completeness Hooks ====================

export function useConfigCompleteness(enterpriseId: string) {
  return useQuery<ConfigCompleteness>({
    queryKey: ["config-completeness", enterpriseId],
    queryFn: () =>
      apiClient.get<ConfigCompleteness>(
        `/enterprises/${enterpriseId}/config-completeness`,
      ),
    enabled: !!enterpriseId,
  });
}

// ==================== Re-export types ====================

export type {
  DictionaryItem,
  EnergyDefinition,
  ProductDefinition,
  UnitDefinition,
  CarbonEmissionFactor,
  ConfigCompleteness,
};

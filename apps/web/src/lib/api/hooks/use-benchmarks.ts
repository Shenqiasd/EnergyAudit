"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

// ==================== Types ====================

interface BenchmarkValue {
  id: string;
  industryCode: string;
  indicatorCode: string;
  indicatorName: string;
  benchmarkValue: string;
  unit: string | null;
  source: string | null;
  applicableYear: number | null;
  createdAt: string;
}

interface BenchmarkComparisonItem {
  indicatorName: string;
  actualValue: number;
  benchmarkValue: number;
  unit: string;
  gapPercent: number;
  status: "above" | "below" | "equal";
}

interface BenchmarkListParams {
  industryCode?: string;
  indicatorCode?: string;
  applicableYear?: number;
}

// ==================== Hooks ====================

export function useBenchmarks(params: BenchmarkListParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.industryCode) queryParams.industryCode = params.industryCode;
  if (params.indicatorCode) queryParams.indicatorCode = params.indicatorCode;
  if (params.applicableYear) queryParams.applicableYear = String(params.applicableYear);

  return useQuery<BenchmarkValue[]>({
    queryKey: ["benchmarks", params],
    queryFn: () =>
      apiClient.get<BenchmarkValue[]>("/benchmarks", { params: queryParams }),
  });
}

export function useBenchmarksByIndustry(industryCode: string, applicableYear?: number) {
  const queryParams: Record<string, string> = {};
  if (applicableYear) queryParams.applicableYear = String(applicableYear);

  return useQuery<BenchmarkValue[]>({
    queryKey: ["benchmarks", "industry", industryCode, applicableYear],
    queryFn: () =>
      apiClient.get<BenchmarkValue[]>(`/benchmarks/industry/${industryCode}`, {
        params: queryParams,
      }),
    enabled: !!industryCode,
  });
}

export function useBenchmarkComparison(enterpriseId: string, projectId: string) {
  return useQuery<BenchmarkComparisonItem[]>({
    queryKey: ["benchmarks", "compare", enterpriseId, projectId],
    queryFn: () =>
      apiClient.get<BenchmarkComparisonItem[]>(
        `/benchmarks/compare/${enterpriseId}/${projectId}`,
      ),
    enabled: !!enterpriseId && !!projectId,
  });
}

export function useCreateBenchmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      industryCode: string;
      indicatorCode: string;
      indicatorName: string;
      benchmarkValue: string;
      unit?: string;
      source?: string;
      applicableYear?: number;
    }) => apiClient.post<BenchmarkValue>("/benchmarks", data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["benchmarks"] });
    },
  });
}

export function useUpdateBenchmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      indicatorName?: string;
      benchmarkValue?: string;
      unit?: string;
      source?: string;
      applicableYear?: number;
    }) => apiClient.put<BenchmarkValue>(`/benchmarks/${id}`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["benchmarks"] });
    },
  });
}

export function useDeleteBenchmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/benchmarks/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["benchmarks"] });
    },
  });
}

export type {
  BenchmarkValue,
  BenchmarkComparisonItem,
  BenchmarkListParams,
};

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

interface ChartOutput {
  chartCode: string;
  chartType: string;
  title: string;
  data: unknown;
}

export function useProjectCharts(projectId: string) {
  return useQuery<ChartOutput[]>({
    queryKey: ["project-charts", projectId],
    queryFn: () =>
      apiClient.get<ChartOutput[]>(`/charts/${projectId}`),
    enabled: !!projectId,
  });
}

export function useChartData(projectId: string, chartCode: string) {
  return useQuery<ChartOutput>({
    queryKey: ["chart-data", projectId, chartCode],
    queryFn: () =>
      apiClient.get<ChartOutput>(`/charts/${projectId}/${chartCode}`),
    enabled: !!projectId && !!chartCode,
  });
}

export function useGenerateCharts(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<ChartOutput[]>(`/charts/${projectId}/generate`),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["project-charts", projectId],
      });
    },
  });
}

export type { ChartOutput };

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

interface ConversionItem {
  energyCode: string;
  energyName: string;
  physicalAmount: number;
  tce: number;
}

interface CarbonItem {
  energyCode: string;
  energyName: string;
  emission: number;
}

interface EnergyIntensity {
  totalTce: number;
  outputValue: number;
  intensityPerOutput: number;
}

interface ProductEnergy {
  productCode: string;
  productName: string;
  unitEnergy: number;
}

interface CalculationRunResult {
  snapshotId: string;
  comprehensiveEnergy: {
    totalTce: number;
    items: ConversionItem[];
  };
  carbonEmission: {
    totalEmission: number;
    items: CarbonItem[];
  };
  energyIntensity: EnergyIntensity;
  productEnergy: ProductEnergy[];
}

interface CalculationSnapshot {
  id: string;
  auditProjectId: string;
  calculationType: string;
  result: string;
  ruleVersionId: string | null;
  parametersSnapshot: string | null;
  calculatedAt: string;
  isLatest: boolean;
}

interface SnapshotDetail extends Omit<CalculationSnapshot, "result" | "parametersSnapshot"> {
  result: Record<string, unknown>;
  parametersSnapshot: Record<string, unknown> | null;
}

interface BenchmarkComparison {
  indicatorCode: string;
  currentValue: number;
  benchmarkValue: number;
  difference: number;
  status: "above" | "below" | "equal";
}

export function useRunCalculation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<CalculationRunResult>(
        `/calculations/run/${projectId}`,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["calculation-snapshots", projectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["benchmark-comparison", projectId],
      });
    },
  });
}

export function useCalculationSnapshots(projectId: string) {
  return useQuery<CalculationSnapshot[]>({
    queryKey: ["calculation-snapshots", projectId],
    queryFn: () =>
      apiClient.get<CalculationSnapshot[]>(
        `/calculations/snapshots/${projectId}`,
      ),
    enabled: !!projectId,
  });
}

export function useCalculationSnapshot(snapshotId: string) {
  return useQuery<SnapshotDetail>({
    queryKey: ["calculation-snapshot", snapshotId],
    queryFn: () =>
      apiClient.get<SnapshotDetail>(
        `/calculations/snapshot/${snapshotId}`,
      ),
    enabled: !!snapshotId,
  });
}

export function useBenchmarkComparison(projectId: string) {
  return useQuery<BenchmarkComparison[]>({
    queryKey: ["benchmark-comparison", projectId],
    queryFn: () =>
      apiClient.get<BenchmarkComparison[]>(
        `/calculations/benchmarks/${projectId}`,
      ),
    enabled: !!projectId,
  });
}

export type {
  CalculationRunResult,
  CalculationSnapshot,
  SnapshotDetail,
  BenchmarkComparison,
  ConversionItem,
  CarbonItem,
  EnergyIntensity,
  ProductEnergy,
};

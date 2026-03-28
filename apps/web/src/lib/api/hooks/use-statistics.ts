"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";

interface DashboardSummary {
  activeBatches: number;
  projectCompletionRate: number;
  pendingReviewTasks: number;
  overdueAlerts: number;
}

interface StatusDistributionItem {
  status: string;
  count: number;
}

interface FilingProgressItem {
  moduleCode: string;
  total: number;
  submitted: number;
  progress: number;
}

interface BatchStatistics {
  totalProjects: number;
  completedProjects: number;
  completionRate: number;
  overdueProjects: number;
  overdueRate: number;
  averageReviewScore: number | null;
  statusDistribution: StatusDistributionItem[];
  filingProgress: FilingProgressItem[];
}

interface IndustryDistributionItem {
  industryCode: string;
  totalConsumption: number;
  enterpriseCount: number;
}

interface IndustryComplianceItem {
  industryCode: string;
  totalEnterprises: number;
  compliantEnterprises: number;
  complianceRate: number;
}

interface IndustryRankingItem {
  rank: number;
  industryCode: string;
  enterpriseCount: number;
}

interface IndustryStatistics {
  distribution: IndustryDistributionItem[];
  compliance: IndustryComplianceItem[];
  ranking: IndustryRankingItem[];
}

interface CarbonEmissionByType {
  energyType: string;
  emissions: number;
}

interface CarbonEmissionByEnterprise {
  enterpriseId: string;
  enterpriseName: string;
  emissions: number;
}

interface CarbonTrendItem {
  year: number;
  totalEmissions: number;
}

interface CarbonStatistics {
  totalEmissions: number;
  byEnergyType: CarbonEmissionByType[];
  byEnterprise: CarbonEmissionByEnterprise[];
  trends: CarbonTrendItem[];
}

interface RankingItem {
  rank: number;
  enterpriseId: string;
  enterpriseName: string;
  averageScore: number;
}

interface AlertItem {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  createdAt: string;
  relatedId: string;
}

interface TimelineItem {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  detail: string | null;
  userId: string;
  userRole: string;
  createdAt: string;
}

interface IndustryStatisticsQuery {
  batchId?: string;
  year?: string;
}

interface CarbonStatisticsQuery {
  batchId?: string;
  year?: string;
}

interface RankingsQuery {
  metric?: string;
  batchId?: string;
}

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ["statistics", "dashboard"],
    queryFn: () =>
      apiClient.get<DashboardSummary>("/statistics/dashboard"),
  });
}

export function useBatchStatistics(batchId: string) {
  return useQuery<BatchStatistics>({
    queryKey: ["statistics", "batch", batchId],
    queryFn: () =>
      apiClient.get<BatchStatistics>(`/statistics/batch/${batchId}`),
    enabled: !!batchId,
  });
}

export function useIndustryStatistics(query: IndustryStatisticsQuery = {}) {
  const params: Record<string, string> = {};
  if (query.batchId) params.batchId = query.batchId;
  if (query.year) params.year = query.year;

  return useQuery<IndustryStatistics>({
    queryKey: ["statistics", "industry", query],
    queryFn: () =>
      apiClient.get<IndustryStatistics>("/statistics/industry", { params }),
  });
}

export function useCarbonStatistics(query: CarbonStatisticsQuery = {}) {
  const params: Record<string, string> = {};
  if (query.batchId) params.batchId = query.batchId;
  if (query.year) params.year = query.year;

  return useQuery<CarbonStatistics>({
    queryKey: ["statistics", "carbon", query],
    queryFn: () =>
      apiClient.get<CarbonStatistics>("/statistics/carbon", { params }),
  });
}

export function useRankings(query: RankingsQuery = {}) {
  const params: Record<string, string> = {};
  if (query.metric) params.metric = query.metric;
  if (query.batchId) params.batchId = query.batchId;

  return useQuery<RankingItem[]>({
    queryKey: ["statistics", "rankings", query],
    queryFn: () =>
      apiClient.get<RankingItem[]>("/statistics/rankings", { params }),
  });
}

export function useAlerts() {
  return useQuery<AlertItem[]>({
    queryKey: ["statistics", "alerts"],
    queryFn: () => apiClient.get<AlertItem[]>("/statistics/alerts"),
  });
}

export function useTimeline() {
  return useQuery<TimelineItem[]>({
    queryKey: ["statistics", "timeline"],
    queryFn: () => apiClient.get<TimelineItem[]>("/statistics/timeline"),
  });
}

export type {
  DashboardSummary,
  BatchStatistics,
  IndustryStatistics,
  CarbonStatistics,
  RankingItem,
  AlertItem,
  TimelineItem,
  StatusDistributionItem,
  FilingProgressItem,
  IndustryDistributionItem,
  IndustryComplianceItem,
  CarbonEmissionByType,
  CarbonEmissionByEnterprise,
  CarbonTrendItem,
  IndustryStatisticsQuery,
  CarbonStatisticsQuery,
  RankingsQuery,
};

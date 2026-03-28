"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

interface Job {
  id: string;
  type: string;
  status: string;
  payload: Record<string, unknown>;
  result: unknown;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface JobListResponse {
  items: Job[];
  total: number;
  page: number;
  pageSize: number;
}

interface JobFilters {
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function useJobs(filters: JobFilters = {}) {
  const queryParams: Record<string, string> = {};
  if (filters.type) queryParams.type = filters.type;
  if (filters.status) queryParams.status = filters.status;
  if (filters.page) queryParams.page = String(filters.page);
  if (filters.pageSize) queryParams.pageSize = String(filters.pageSize);

  return useQuery<JobListResponse>({
    queryKey: ["jobs", filters],
    queryFn: () =>
      apiClient.get<JobListResponse>("/jobs", { params: queryParams }),
    refetchInterval: filters.status === "processing" ? 5000 : undefined,
  });
}

export function useJob(id: string) {
  return useQuery<Job>({
    queryKey: ["job", id],
    queryFn: () => apiClient.get<Job>(`/jobs/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === "processing" || data?.status === "queued"
        ? 3000
        : undefined;
    },
  });
}

export function useEnqueueJob() {
  const queryClient = useQueryClient();
  return useMutation<Job, Error, { type: string; data?: Record<string, unknown> }>({
    mutationFn: (payload) => apiClient.post<Job>("/jobs", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useRetryJob(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Job>({
    mutationFn: () => apiClient.post<Job>(`/jobs/${id}/retry`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["job", id] });
    },
  });
}

export type { Job, JobListResponse, JobFilters };

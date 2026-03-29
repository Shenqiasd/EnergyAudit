"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

interface DataModule {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  sortOrder: number;
  isEnabled: boolean;
  fieldSchema: unknown;
  createdAt: string;
  updatedAt: string;
  recordStatus?: string;
  recordId?: string | null;
}

interface DataField {
  id: string;
  moduleId: string;
  code: string;
  name: string;
  fieldType: string;
  constraints: Record<string, unknown> | null;
  displayRules: Record<string, unknown> | null;
  sortOrder: number;
  createdAt: string;
}

interface ModuleFieldsResponse {
  module: DataModule | null;
  fields: DataField[];
}

interface DataRecord {
  id: string;
  auditProjectId: string;
  moduleCode: string;
  status: string;
  templateVersionId: string | null;
  submittedAt: string | null;
  returnReason: string | null;
  returnedBy: string | null;
  returnedAt: string | null;
  lockHolderId: string | null;
  lockAcquiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DataItem {
  id: string;
  dataRecordId: string;
  fieldCode: string;
  rawValue: string | null;
  calculatedValue: string | null;
  manualOverrideValue: string | null;
  finalValue: string | null;
  unit: string | null;
}

interface DataRecordDetail extends DataRecord {
  items: DataItem[];
}

interface DataRecordListResponse {
  items: DataRecord[];
  total: number;
  page: number;
  pageSize: number;
}

interface RecordListParams {
  projectId?: string;
  moduleCode?: string;
  page?: number;
  pageSize?: number;
}

interface SaveRecordInput {
  items: Array<{
    fieldCode: string;
    rawValue: string | null;
    unit?: string;
  }>;
}

interface ValidationError {
  ruleCode: string;
  layer: number;
  severity: string;
  message: string;
  fieldCodes?: string[];
}

interface ValidationResult {
  isValid: boolean;
  canSave: boolean;
  canSubmit: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
}

interface SubmitResult {
  submitted: boolean;
  record?: DataRecord;
  validation: ValidationResult;
  message?: string;
}

interface LockInfo {
  locked: boolean;
  userId?: string;
  lockedAt?: string;
  expiresAt?: string;
}

export function useDataModules(projectId?: string) {
  const params: Record<string, string> = {};
  if (projectId) params.projectId = projectId;

  return useQuery<DataModule[]>({
    queryKey: ["data-modules", projectId],
    queryFn: () =>
      apiClient.get<DataModule[]>("/data-entry/modules", { params }),
  });
}

export function useModuleFields(moduleCode: string) {
  return useQuery<ModuleFieldsResponse>({
    queryKey: ["module-fields", moduleCode],
    queryFn: () =>
      apiClient.get<ModuleFieldsResponse>(
        `/data-entry/modules/${moduleCode}/fields`,
      ),
    enabled: !!moduleCode,
  });
}

export function useDataRecords(params: RecordListParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.projectId) queryParams.projectId = params.projectId;
  if (params.moduleCode) queryParams.moduleCode = params.moduleCode;
  if (params.page) queryParams.page = String(params.page);
  if (params.pageSize) queryParams.pageSize = String(params.pageSize);

  return useQuery<DataRecordListResponse>({
    queryKey: ["data-records", params],
    queryFn: () =>
      apiClient.get<DataRecordListResponse>("/data-entry/records", {
        params: queryParams,
      }),
  });
}

export function useDataRecord(id: string) {
  return useQuery<DataRecordDetail>({
    queryKey: ["data-record", id],
    queryFn: () =>
      apiClient.get<DataRecordDetail>(`/data-entry/records/${id}`),
    enabled: !!id,
  });
}

export function useCreateRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { auditProjectId: string; moduleCode: string }) =>
      apiClient.post<DataRecord>("/data-entry/records", data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["data-records"] });
      void queryClient.invalidateQueries({ queryKey: ["data-modules"] });
    },
  });
}

export function useSaveRecord(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveRecordInput) =>
      apiClient.put<DataRecord>(`/data-entry/records/${id}`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["data-record", id] });
      void queryClient.invalidateQueries({ queryKey: ["data-records"] });
    },
  });
}

export function useSubmitRecord(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<SubmitResult>(`/data-entry/records/${id}/submit`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["data-record", id] });
      void queryClient.invalidateQueries({ queryKey: ["data-records"] });
      void queryClient.invalidateQueries({ queryKey: ["data-modules"] });
    },
  });
}

export function useReturnRecord(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { reason: string; returnedBy?: string }) =>
      apiClient.post<DataRecord>(`/data-entry/records/${id}/return`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["data-record", id] });
      void queryClient.invalidateQueries({ queryKey: ["data-records"] });
      void queryClient.invalidateQueries({ queryKey: ["data-modules"] });
    },
  });
}

export function useAcquireLock(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string }) =>
      apiClient.post<LockInfo>(`/data-entry/records/${id}/lock`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["data-record", id] });
    },
  });
}

export function useReleaseLock(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string }) =>
      apiClient.delete<{ released: boolean }>(
        `/data-entry/records/${id}/lock`,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["data-record", id] });
    },
  });
}

export function useValidateRecord(id: string) {
  return useMutation({
    mutationFn: () =>
      apiClient.post<ValidationResult>(
        `/data-entry/records/${id}/validate`,
      ),
  });
}

export function useCalculateRecord(id: string) {
  return useMutation({
    mutationFn: () =>
      apiClient.post<{ results: unknown[]; snapshotId: string }>(
        `/data-entry/records/${id}/calculate`,
      ),
  });
}

export type {
  DataModule,
  DataField,
  ModuleFieldsResponse,
  DataRecord,
  DataItem,
  DataRecordDetail,
  DataRecordListResponse,
  RecordListParams,
  SaveRecordInput,
  ValidationError,
  ValidationResult,
  SubmitResult,
  LockInfo,
};

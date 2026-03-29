"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

// ==================== Types ====================

interface ValidationException {
  id: string;
  dataRecordId: string;
  validationResultId: string;
  explanation: string;
  submittedBy: string;
  approvedBy: string | null;
  approvalStatus: string;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface PendingExceptionItem {
  exception: ValidationException;
  validationResult: {
    id: string;
    ruleCode: string;
    ruleType: string;
    moduleCode: string;
    fieldCode: string | null;
    severity: string;
    message: string;
  } | null;
  dataRecord: {
    id: string;
    auditProjectId: string;
    moduleCode: string;
    status: string;
  } | null;
}

interface SubmitExceptionInput {
  validationResultId: string;
  explanation: string;
}

// ==================== Exception Hooks ====================

export function useRecordExceptions(dataRecordId: string) {
  return useQuery<ValidationException[]>({
    queryKey: ["data-exceptions", dataRecordId],
    queryFn: () =>
      apiClient.get<ValidationException[]>(
        `/data-entry/records/${dataRecordId}/exceptions`,
      ),
    enabled: !!dataRecordId,
  });
}

export function useSubmitExceptions(dataRecordId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      exceptions: SubmitExceptionInput[];
      userId: string;
    }) =>
      apiClient.post<ValidationException[]>(
        `/data-entry/records/${dataRecordId}/exceptions`,
        data,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["data-exceptions", dataRecordId],
      });
      void queryClient.invalidateQueries({ queryKey: ["data-records"] });
      void queryClient.invalidateQueries({
        queryKey: ["pending-exceptions"],
      });
    },
  });
}

export function usePendingExceptions() {
  return useQuery<PendingExceptionItem[]>({
    queryKey: ["pending-exceptions"],
    queryFn: () =>
      apiClient.get<PendingExceptionItem[]>("/data-entry/exceptions/pending"),
  });
}

export function useApproveException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      exceptionId,
      approverId,
    }: {
      exceptionId: string;
      approverId: string;
    }) =>
      apiClient.post<ValidationException>(
        `/data-entry/exceptions/${exceptionId}/approve`,
        { approverId },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["pending-exceptions"],
      });
      void queryClient.invalidateQueries({ queryKey: ["data-exceptions"] });
    },
  });
}

export function useRejectException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      exceptionId,
      approverId,
      reason,
    }: {
      exceptionId: string;
      approverId: string;
      reason?: string;
    }) =>
      apiClient.post<ValidationException>(
        `/data-entry/exceptions/${exceptionId}/reject`,
        { approverId, reason },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["pending-exceptions"],
      });
      void queryClient.invalidateQueries({ queryKey: ["data-exceptions"] });
    },
  });
}

// ==================== Re-export types ====================

export type {
  ValidationException,
  PendingExceptionItem,
  SubmitExceptionInput,
};

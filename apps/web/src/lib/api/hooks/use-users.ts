"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

interface UserAccount {
  id: string;
  enterpriseId: string | null;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  status: string;
  externalIdentityId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserListResponse {
  items: UserAccount[];
  total: number;
  page: number;
  pageSize: number;
}

interface UserListParams {
  page?: number;
  pageSize?: number;
  role?: string;
  enterpriseId?: string;
  name?: string;
}

interface CreateUserInput {
  name: string;
  email: string;
  phone?: string;
  role: string;
  enterpriseId?: string;
}

interface UpdateUserRolesInput {
  role: string;
}

export function useUsers(params: UserListParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.pageSize) queryParams.pageSize = String(params.pageSize);
  if (params.role) queryParams.role = params.role;
  if (params.enterpriseId) queryParams.enterpriseId = params.enterpriseId;
  if (params.name) queryParams.name = params.name;

  return useQuery<UserListResponse>({
    queryKey: ["users", params],
    queryFn: () =>
      apiClient.get<UserListResponse>("/users", { params: queryParams }),
  });
}

export function useUser(id: string) {
  return useQuery<UserAccount>({
    queryKey: ["user", id],
    queryFn: () => apiClient.get<UserAccount>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserInput) =>
      apiClient.post<UserAccount>("/users", data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateUserInput>) =>
      apiClient.put<UserAccount>(`/users/${id}`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["user", id] });
    },
  });
}

export function useUpdateUserRoles(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserRolesInput) =>
      apiClient.put<UserAccount>(`/users/${id}/roles`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["user", id] });
    },
  });
}

export type {
  UserAccount,
  UserListResponse,
  UserListParams,
  CreateUserInput,
  UpdateUserRolesInput,
};

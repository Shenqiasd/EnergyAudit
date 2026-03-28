"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

interface Notification {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  content: string;
  relatedType: string | null;
  relatedId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
}

interface NotificationListQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

interface UnreadCountResponse {
  count: number;
}

export function useNotifications(query: NotificationListQuery = {}) {
  const params: Record<string, string> = {};
  if (query.page) params.page = String(query.page);
  if (query.limit) params.limit = String(query.limit);
  if (query.isRead !== undefined) params.isRead = String(query.isRead);
  if (query.type) params.type = query.type;

  return useQuery<NotificationListResponse>({
    queryKey: ["notifications", query],
    queryFn: () =>
      apiClient.get<NotificationListResponse>("/notifications", { params }),
  });
}

export function useUnreadCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: ["notifications-unread-count"],
    queryFn: () =>
      apiClient.get<UnreadCountResponse>("/notifications/unread-count"),
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch<Notification>(`/notifications/${id}/read`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<{ updatedCount: number }>("/notifications/mark-all-read"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<{ deleted: boolean }>(`/notifications/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });
}

export type {
  Notification,
  NotificationListResponse,
  NotificationListQuery,
  UnreadCountResponse,
};

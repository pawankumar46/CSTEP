"use client";

import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

/**
 * Loads notifications via REST, then keeps the list in sync over WebSocket.
 * Use from `NotificationDropdown` (or any client header).
 */
export function useNotifications(enabled: boolean = true) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const active = enabled && isAuthenticated;

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const error = useNotificationStore((s) => s.error);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const upsertNotification = useNotificationStore((s) => s.upsertNotification);
  const reset = useNotificationStore((s) => s.reset);

  const refresh = useCallback(async () => {
    if (!active) return;
    await fetchNotifications(user?.role);
  }, [active, fetchNotifications, user?.role]);

  useEffect(() => {
    if (!active) {
      reset();
      return;
    }
    void refresh();
  }, [active, refresh, reset]);

  useNotificationSocket(
    (notification) => {
      upsertNotification(notification);
    },
    active,
    user?.role,
  );

  return {
    notifications,
    unreadCount,
    loading: isLoading,
    error,
    refresh,
    markRead: markAsRead,
    markAllRead: markAllAsRead,
  };
}

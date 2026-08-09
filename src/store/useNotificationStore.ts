import { create } from "zustand";
import * as notificationService from "@/services/notification.service";
import type { Notification, UserRole } from "@/types";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (role?: UserRole) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  upsertNotification: (notification: Notification) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (role) => {
    set({ isLoading: true, error: null });
    try {
      const [notifications, unreadCount] = await Promise.all([
        notificationService.getNotifications({ role }),
        notificationService.getUnreadNotificationCount(),
      ]);
      set({ notifications, unreadCount, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load notifications",
      });
    }
  },

  markAsRead: async (id) => {
    const current = get().notifications.find((n) => n.id === id);
    if (!current || current.read) return;

    set({
      notifications: get().notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });

    try {
      const updated = await notificationService.markNotificationRead(id);
      set({
        notifications: get().notifications.map((n) =>
          n.id === id ? { ...updated, href: updated.href ?? n.href } : n,
        ),
      });
    } catch {
      // Keep optimistic UI
    }
  },

  markAllAsRead: async () => {
    set({
      notifications: get().notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    });
    try {
      await notificationService.markAllNotificationsRead();
    } catch {
      // Keep optimistic UI
    }
  },

  upsertNotification: (notification) => {
    set((state) => {
      const index = state.notifications.findIndex((n) => n.id === notification.id);
      if (index === -1) {
        return {
          notifications: [notification, ...state.notifications],
          unreadCount: notification.read
            ? state.unreadCount
            : state.unreadCount + 1,
        };
      }
      const previous = state.notifications[index];
      const next = [...state.notifications];
      next[index] = notification;
      let unreadCount = state.unreadCount;
      if (!previous.read && notification.read) {
        unreadCount = Math.max(0, unreadCount - 1);
      } else if (previous.read && !notification.read) {
        unreadCount += 1;
      }
      return { notifications: next, unreadCount };
    });
  },

  reset: () =>
    set({ notifications: [], unreadCount: 0, isLoading: false, error: null }),
}));

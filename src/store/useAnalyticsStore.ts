import { create } from "zustand";
import * as analyticsService from "@/services/analytics.service";
import type { AnalyticsData, AuditLog, EventAnalytics, Permission } from "@/types";

interface AnalyticsState {
  analytics: AnalyticsData | null;
  eventAnalytics: EventAnalytics | null;
  auditLogs: AuditLog[];
  permissions: Permission[];
  isLoading: boolean;
  eventAnalyticsLoading: boolean;
  error: string | null;
  eventAnalyticsError: string | null;
  fetchAnalytics: () => Promise<void>;
  fetchEventAnalytics: (eventId: string) => Promise<void>;
  clearEventAnalytics: () => void;
  fetchAuditLogs: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  analytics: null,
  eventAnalytics: null,
  auditLogs: [],
  permissions: [],
  isLoading: false,
  eventAnalyticsLoading: false,
  error: null,
  eventAnalyticsError: null,

  fetchAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const analytics = await analyticsService.getAnalytics();
      set({ analytics, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch analytics",
        isLoading: false,
      });
    }
  },

  fetchEventAnalytics: async (eventId) => {
    set({ eventAnalyticsLoading: true, eventAnalyticsError: null, eventAnalytics: null });
    try {
      const eventAnalytics = await analyticsService.getEventAnalytics(eventId);
      set({ eventAnalytics, eventAnalyticsLoading: false });
    } catch (err) {
      set({
        eventAnalyticsError: err instanceof Error ? err.message : "Failed to fetch event analytics",
        eventAnalyticsLoading: false,
      });
    }
  },

  clearEventAnalytics: () => {
    set({ eventAnalytics: null, eventAnalyticsError: null, eventAnalyticsLoading: false });
  },

  fetchAuditLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const auditLogs = await analyticsService.getAuditLogs();
      set({ auditLogs, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch audit logs",
        isLoading: false,
      });
    }
  },

  fetchPermissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const permissions = await analyticsService.getPermissions();
      set({ permissions, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch permissions",
        isLoading: false,
      });
    }
  },
}));

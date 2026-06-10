import { create } from "zustand";
import * as analyticsService from "@/services/analytics.service";
import type { AnalyticsData, AuditLog, Permission } from "@/types";

interface AnalyticsState {
  analytics: AnalyticsData | null;
  auditLogs: AuditLog[];
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
  fetchAnalytics: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  analytics: null,
  auditLogs: [],
  permissions: [],
  isLoading: false,
  error: null,

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

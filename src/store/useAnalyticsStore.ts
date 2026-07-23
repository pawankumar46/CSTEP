import { create } from "zustand";
import * as analyticsService from "@/services/analytics.service";
import type {
  AnalyticsData,
  AuditLog,
  EventAnalytics,
  Permission,
  RegistrationAttendanceInsights,
  RegistrationCounts,
  RegistrationDemographics,
  RegistrationTrend,
  StreamingParticipationMode,
  StreamingParticipationTrend,
  StreamingSummary,
} from "@/types";

interface AnalyticsState {
  analytics: AnalyticsData | null;
  eventAnalytics: EventAnalytics | null;
  registrationCounts: RegistrationCounts | null;
  registrationTrend: RegistrationTrend | null;
  registrationAttendanceInsights: RegistrationAttendanceInsights | null;
  registrationDemographics: RegistrationDemographics | null;
  streamingSummary: StreamingSummary | null;
  streamingParticipationTrend: StreamingParticipationTrend | null;
  auditLogs: AuditLog[];
  permissions: Permission[];
  isLoading: boolean;
  eventAnalyticsLoading: boolean;
  registrationCountsLoading: boolean;
  registrationTrendLoading: boolean;
  registrationAttendanceLoading: boolean;
  registrationDemographicsLoading: boolean;
  streamingSummaryLoading: boolean;
  streamingParticipationTrendLoading: boolean;
  error: string | null;
  eventAnalyticsError: string | null;
  registrationCountsError: string | null;
  registrationTrendError: string | null;
  registrationAttendanceError: string | null;
  registrationDemographicsError: string | null;
  streamingSummaryError: string | null;
  streamingParticipationTrendError: string | null;
  fetchAnalytics: () => Promise<void>;
  fetchEventAnalytics: (eventId: string) => Promise<void>;
  fetchRegistrationCounts: (eventId: string) => Promise<void>;
  fetchRegistrationTrend: (eventId: string, granularity?: "daily" | "weekly" | "monthly") => Promise<void>;
  fetchRegistrationAttendanceInsights: (eventId: string) => Promise<void>;
  fetchRegistrationDemographics: (eventId: string) => Promise<void>;
  fetchStreamingSummary: (eventId: string) => Promise<void>;
  fetchStreamingParticipationTrend: (
    eventId: string,
    params?: {
      mode?: StreamingParticipationMode;
      intervalMinutes?: number;
      date?: string;
    },
  ) => Promise<void>;
  clearEventAnalytics: () => void;
  clearRegistrationCounts: () => void;
  clearRegistrationTrend: () => void;
  clearRegistrationAttendanceInsights: () => void;
  clearRegistrationDemographics: () => void;
  clearStreamingSummary: () => void;
  clearStreamingParticipationTrend: () => void;
  fetchAuditLogs: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  analytics: null,
  eventAnalytics: null,
  registrationCounts: null,
  registrationTrend: null,
  registrationAttendanceInsights: null,
  registrationDemographics: null,
  streamingSummary: null,
  streamingParticipationTrend: null,
  auditLogs: [],
  permissions: [],
  isLoading: false,
  eventAnalyticsLoading: false,
  registrationCountsLoading: false,
  registrationTrendLoading: false,
  registrationAttendanceLoading: false,
  registrationDemographicsLoading: false,
  streamingSummaryLoading: false,
  streamingParticipationTrendLoading: false,
  error: null,
  eventAnalyticsError: null,
  registrationCountsError: null,
  registrationTrendError: null,
  registrationAttendanceError: null,
  registrationDemographicsError: null,
  streamingSummaryError: null,
  streamingParticipationTrendError: null,

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

  fetchRegistrationCounts: async (eventId) => {
    set({ registrationCountsLoading: true, registrationCountsError: null });
    try {
      const registrationCounts = await analyticsService.getRegistrationCounts(eventId);
      set({ registrationCounts, registrationCountsLoading: false });
    } catch (err) {
      set({
        registrationCounts: null,
        registrationCountsError:
          err instanceof Error ? err.message : "Failed to fetch registration counts",
        registrationCountsLoading: false,
      });
    }
  },

  fetchRegistrationTrend: async (eventId, granularity = "daily") => {
    set({ registrationTrendLoading: true, registrationTrendError: null });
    try {
      const registrationTrend = await analyticsService.getRegistrationTrend(eventId, granularity);
      set({ registrationTrend, registrationTrendLoading: false });
    } catch (err) {
      set({
        registrationTrend: null,
        registrationTrendError:
          err instanceof Error ? err.message : "Failed to fetch registration trend",
        registrationTrendLoading: false,
      });
    }
  },

  fetchRegistrationAttendanceInsights: async (eventId) => {
    set({ registrationAttendanceLoading: true, registrationAttendanceError: null });
    try {
      const registrationAttendanceInsights =
        await analyticsService.getRegistrationAttendanceInsights(eventId);
      set({ registrationAttendanceInsights, registrationAttendanceLoading: false });
    } catch (err) {
      set({
        registrationAttendanceInsights: null,
        registrationAttendanceError:
          err instanceof Error ? err.message : "Failed to fetch attendance insights",
        registrationAttendanceLoading: false,
      });
    }
  },

  fetchRegistrationDemographics: async (eventId) => {
    set({ registrationDemographicsLoading: true, registrationDemographicsError: null });
    try {
      const registrationDemographics =
        await analyticsService.getRegistrationDemographics(eventId);
      set({ registrationDemographics, registrationDemographicsLoading: false });
    } catch (err) {
      set({
        registrationDemographics: null,
        registrationDemographicsError:
          err instanceof Error ? err.message : "Failed to fetch demographics",
        registrationDemographicsLoading: false,
      });
    }
  },

  fetchStreamingSummary: async (eventId) => {
    set({ streamingSummaryLoading: true, streamingSummaryError: null });
    try {
      const streamingSummary = await analyticsService.getStreamingSummary(eventId);
      set({ streamingSummary, streamingSummaryLoading: false });
    } catch (err) {
      set({
        streamingSummary: null,
        streamingSummaryError:
          err instanceof Error ? err.message : "Failed to fetch streaming summary",
        streamingSummaryLoading: false,
      });
    }
  },

  fetchStreamingParticipationTrend: async (eventId, params = {}) => {
    set({ streamingParticipationTrendLoading: true, streamingParticipationTrendError: null });
    try {
      const streamingParticipationTrend =
        await analyticsService.getStreamingParticipationTrend(eventId, params);
      set({ streamingParticipationTrend, streamingParticipationTrendLoading: false });
    } catch (err) {
      set({
        streamingParticipationTrend: null,
        streamingParticipationTrendError:
          err instanceof Error ? err.message : "Failed to fetch participation trend",
        streamingParticipationTrendLoading: false,
      });
    }
  },

  clearEventAnalytics: () => {
    set({ eventAnalytics: null, eventAnalyticsError: null, eventAnalyticsLoading: false });
  },

  clearRegistrationCounts: () => {
    set({
      registrationCounts: null,
      registrationCountsError: null,
      registrationCountsLoading: false,
    });
  },

  clearRegistrationTrend: () => {
    set({
      registrationTrend: null,
      registrationTrendError: null,
      registrationTrendLoading: false,
    });
  },

  clearRegistrationAttendanceInsights: () => {
    set({
      registrationAttendanceInsights: null,
      registrationAttendanceError: null,
      registrationAttendanceLoading: false,
    });
  },

  clearRegistrationDemographics: () => {
    set({
      registrationDemographics: null,
      registrationDemographicsError: null,
      registrationDemographicsLoading: false,
    });
  },

  clearStreamingSummary: () => {
    set({
      streamingSummary: null,
      streamingSummaryError: null,
      streamingSummaryLoading: false,
    });
  },

  clearStreamingParticipationTrend: () => {
    set({
      streamingParticipationTrend: null,
      streamingParticipationTrendError: null,
      streamingParticipationTrendLoading: false,
    });
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

import { apiClient } from "@/lib/api-client";
import {
  buildStatusDistribution,
  buildSummaryFromDashboard,
  mapApiDashboardAnalytics,
  mapApiEventAnalytics,
} from "@/lib/analytics-mappers";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import { delay } from "@/lib/utils";
import { mockAnalytics, mockAuditLogs, mockPermissions } from "@/mock/analytics";
import type { AnalyticsData, AuditLog, DashboardAnalytics, EventAnalytics, Permission } from "@/types";

export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
  try {
    const { data } = await apiClient.get<Record<string, unknown>>("/analytics/dashboard/");
    return mapApiDashboardAnalytics(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getEventAnalytics = async (eventId: string): Promise<EventAnalytics> => {
  try {
    const { data } = await apiClient.get<Record<string, unknown>>(`/analytics/events/${eventId}/`);
    return mapApiEventAnalytics(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getAnalytics = async (): Promise<AnalyticsData> => {
  const dashboard = await getDashboardAnalytics();
  const summary = buildSummaryFromDashboard(dashboard);

  return {
    ...mockAnalytics,
    summary,
    dashboard,
    statusDistribution: buildStatusDistribution(summary),
  };
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  await delay(500);
  return [...mockAuditLogs];
};

export const getPermissions = async (): Promise<Permission[]> => {
  await delay(400);
  return [...mockPermissions];
};

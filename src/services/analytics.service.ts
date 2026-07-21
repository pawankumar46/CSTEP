import { apiClient } from "@/lib/api-client";
import {
  buildStatusDistribution,
  buildSummaryFromDashboard,
  mapApiDashboardAnalytics,
  mapApiEventAnalytics,
} from "@/lib/analytics-mappers";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import { readPublicEnv } from "@/lib/env";
import { delay } from "@/lib/utils";
import {
  MOCK_ANALYTICS_DASHBOARD_RAW,
  MOCK_ANALYTICS_EVENT_11_RAW,
} from "@/mock/analytics-api-fixtures";
import { mockAnalytics, mockAuditLogs, mockPermissions } from "@/mock/analytics";
import type { AnalyticsData, AuditLog, DashboardAnalytics, EventAnalytics, Permission } from "@/types";

function useAnalyticsMock(): boolean {
  return readPublicEnv("NEXT_PUBLIC_ANALYTICS_USE_MOCK") === "true";
}

export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
  if (useAnalyticsMock()) {
    await delay(300);
    return mapApiDashboardAnalytics(MOCK_ANALYTICS_DASHBOARD_RAW as unknown as Record<string, unknown>);
  }

  try {
    const { data } = await apiClient.get<Record<string, unknown>>("/analytics/dashboard/");
    return mapApiDashboardAnalytics(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getEventAnalytics = async (eventId: string): Promise<EventAnalytics> => {
  if (useAnalyticsMock()) {
    await delay(300);
    const raw =
      eventId === "11" || eventId === String(MOCK_ANALYTICS_EVENT_11_RAW.event.id)
        ? MOCK_ANALYTICS_EVENT_11_RAW
        : { ...MOCK_ANALYTICS_EVENT_11_RAW, event: { ...MOCK_ANALYTICS_EVENT_11_RAW.event, id: eventId } };
    return mapApiEventAnalytics(raw as unknown as Record<string, unknown>);
  }

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

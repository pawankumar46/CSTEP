import { apiClient } from "@/lib/api-client";
import { buildStatusDistribution, mapApiUserSummary } from "@/lib/analytics-mappers";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import { delay } from "@/lib/utils";
import { mockAnalytics, mockAuditLogs, mockPermissions } from "@/mock/analytics";
import type { AnalyticsData, AnalyticsSummary, AuditLog, Permission } from "@/types";

export const getUserSummary = async (): Promise<AnalyticsSummary> => {
  try {
    const { data } = await apiClient.get<Record<string, unknown>>("/analytics/user-summary/");
    return mapApiUserSummary(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getAnalytics = async (): Promise<AnalyticsData> => {
  const summary = await getUserSummary();

  return {
    ...mockAnalytics,
    summary,
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

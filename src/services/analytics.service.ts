import { apiClient } from "@/lib/api-client";
import {
  buildStatusDistribution,
  buildSummaryFromDashboard,
  mapApiDashboardAnalytics,
  mapApiEventAnalytics,
  mapApiRegistrationCounts,
  mapApiRegistrationTrend,
  mapApiRegistrationAttendanceInsights,
  mapApiRegistrationDemographics,
  mapApiStreamingSummary,
  mapApiStreamingParticipationTrend,
  mapApiAttendanceModeUsersPage,
} from "@/lib/analytics-mappers";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import { delay } from "@/lib/utils";
import {
  MOCK_ANALYTICS_DASHBOARD_RAW,
  MOCK_ANALYTICS_EVENT_11_RAW,
} from "@/mock/analytics-api-fixtures";
import { mockAnalytics, mockAuditLogs, mockPermissions } from "@/mock/analytics";
import type {
  AnalyticsData,
  AttendanceMode,
  AttendanceModeUsersPage,
  AuditLog,
  DashboardAnalytics,
  EventAnalytics,
  Permission,
  RegistrationAttendanceInsights,
  RegistrationCounts,
  RegistrationDemographics,
  RegistrationTrend,
  StreamingParticipationMode,
  StreamingParticipationTrend,
  StreamingSummary,
  AttendanceModeUserRow,
} from "@/types";

/** Overview charts still use fixtures until each section is wired to a live API. */
export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
  await delay(200);
  return mapApiDashboardAnalytics(MOCK_ANALYTICS_DASHBOARD_RAW as unknown as Record<string, unknown>);
};

export const getEventAnalytics = async (eventId: string): Promise<EventAnalytics> => {
  await delay(200);
  const raw =
    eventId === "11" || eventId === String(MOCK_ANALYTICS_EVENT_11_RAW.event.id)
      ? MOCK_ANALYTICS_EVENT_11_RAW
      : { ...MOCK_ANALYTICS_EVENT_11_RAW, event: { ...MOCK_ANALYTICS_EVENT_11_RAW.event, id: eventId } };
  return mapApiEventAnalytics(raw as unknown as Record<string, unknown>);
};

/** Live: GET /analytics/registrations/counts/?event_id= */
export const getRegistrationCounts = async (eventId: string): Promise<RegistrationCounts> => {
  try {
    const { data } = await apiClient.get<unknown>("/analytics/registrations/counts/", {
      params: { event_id: eventId },
    });
    return mapApiRegistrationCounts(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

/** Live: GET /analytics/registrations/trend/?event_id=&granularity=daily */
export const getRegistrationTrend = async (
  eventId: string,
  granularity: "daily" | "weekly" | "monthly" = "daily",
): Promise<RegistrationTrend> => {
  try {
    const { data } = await apiClient.get<unknown>("/analytics/registrations/trend/", {
      params: { event_id: eventId, granularity },
    });
    return mapApiRegistrationTrend(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

/** Live: GET /analytics/registrations/insights/?event_id= — attendance mode subset. */
export const getRegistrationAttendanceInsights = async (
  eventId: string,
): Promise<RegistrationAttendanceInsights> => {
  try {
    const { data } = await apiClient.get<unknown>("/analytics/registrations/insights/", {
      params: { event_id: eventId },
    });
    return mapApiRegistrationAttendanceInsights(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

/** Live: GET /analytics/registrations/demographics/?event_id= */
export const getRegistrationDemographics = async (
  eventId: string,
): Promise<RegistrationDemographics> => {
  try {
    const { data } = await apiClient.get<unknown>("/analytics/registrations/demographics/", {
      params: { event_id: eventId },
    });
    return mapApiRegistrationDemographics(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

/** Live: GET /analytics/streaming/summary/?event_id= */
export const getStreamingSummary = async (eventId: string): Promise<StreamingSummary> => {
  try {
    const { data } = await apiClient.get<unknown>("/analytics/streaming/summary/", {
      params: { event_id: eventId },
    });
    return mapApiStreamingSummary(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export interface GetStreamingParticipationTrendParams {
  mode?: StreamingParticipationMode;
  intervalMinutes?: number;
  /** YYYY-MM-DD — omit to let API default to today */
  date?: string;
}

/** Live: GET /analytics/streaming/participation-trend/?event_id=&mode=&interval_minutes=&date= */
export const getStreamingParticipationTrend = async (
  eventId: string,
  params: GetStreamingParticipationTrendParams = {},
): Promise<StreamingParticipationTrend> => {
  const mode = params.mode ?? "all";
  const intervalMinutes = params.intervalMinutes ?? 15;
  try {
    const { data } = await apiClient.get<unknown>("/analytics/streaming/participation-trend/", {
      params: {
        event_id: eventId,
        mode,
        interval_minutes: intervalMinutes,
        ...(params.date ? { date: params.date } : {}),
      },
    });
    return mapApiStreamingParticipationTrend(data, {
      date: params.date,
      mode,
      intervalMinutes,
    });
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export interface GetAttendanceModeUsersParams {
  eventId: string;
  /** YYYY-MM-DD — omit for all days */
  dayDate?: string;
  /** PHYSICAL / VIRTUAL app value — omit for all modes */
  attendanceMode?: AttendanceMode;
  page?: number;
  pageSize?: number;
}

/** Live: GET /analytics/registrations/users/?event_id=&days__day__date=&days__attendance_mode= */
export const getAttendanceModeUsers = async (
  params: GetAttendanceModeUsersParams,
): Promise<AttendanceModeUsersPage> => {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  try {
    const query: Record<string, string | number> = {
      event_id: params.eventId,
      page,
      page_size: pageSize,
    };
    if (params.dayDate) {
      query["days__day__date"] = params.dayDate;
    }
    if (params.attendanceMode) {
      query["days__attendance_mode"] = params.attendanceMode.toUpperCase();
    }

    const { data } = await apiClient.get<unknown>("/analytics/registrations/users/", {
      params: query,
    });
    return mapApiAttendanceModeUsersPage(data, { page, pageSize });
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

const ATTENDANCE_MODE_EXPORT_PAGE_SIZE = 100;

/** Fetches every page for the current attendance-mode filters (for Export all). */
export const getAllAttendanceModeUsers = async (
  params: Omit<GetAttendanceModeUsersParams, "page" | "pageSize">,
): Promise<AttendanceModeUserRow[]> => {
  const first = await getAttendanceModeUsers({
    ...params,
    page: 1,
    pageSize: ATTENDANCE_MODE_EXPORT_PAGE_SIZE,
  });
  const rows = [...first.rows];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await getAttendanceModeUsers({
      ...params,
      page,
      pageSize: ATTENDANCE_MODE_EXPORT_PAGE_SIZE,
    });
    rows.push(...next.rows);
  }
  return rows;
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

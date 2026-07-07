import type {
  AnalyticsSummary,
  DashboardAnalytics,
  DistributionDataPoint,
  EventAnalytics,
  EventAnalyticsAssistance,
} from "@/types";
import { FOOD_PREFERENCES, TRANSLATION_LANGUAGES } from "@/lib/registration-options";
import type { AnalyticsDistributionRow } from "@/lib/event-analytics-export";

const REGISTRATION_STATUS_CHART: { key: string; name: string; color: string }[] = [
  { key: "ACCEPTED", name: "Accepted", color: "#22c55e" },
  { key: "PENDING", name: "Pending", color: "#3b82f6" },
  { key: "HELD", name: "On Hold", color: "#f59e0b" },
  { key: "REJECTED", name: "Rejected", color: "#ef4444" },
];

const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  LIVE: "Live",
  ENDED: "Ended",
  CANCELLED: "Cancelled",
};

const USER_ROLE_LABELS: Record<string, string> = {
  BASE_USER: "Base User",
  MODERATOR: "Moderator",
  EVENT_ADMIN: "Event Admin",
  SUPER_ADMIN: "Super Admin",
};

function mapCountRecord(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([key, value]) => [
      key,
      Number(value ?? 0),
    ]),
  );
}

export function mapApiDashboardAnalytics(raw: Record<string, unknown>): DashboardAnalytics {
  const events = (raw.events ?? {}) as Record<string, unknown>;
  const registrations = (raw.registrations ?? {}) as Record<string, unknown>;
  const users = (raw.users ?? {}) as Record<string, unknown>;
  const viewers = (raw.viewers ?? {}) as Record<string, unknown>;
  const topEvents = Array.isArray(raw.top_events_by_registrations)
    ? raw.top_events_by_registrations
    : [];

  return {
    events: {
      total: Number(events.total ?? 0),
      byStatus: mapCountRecord(events.by_status),
    },
    registrations: {
      total: Number(registrations.total ?? 0),
      byStatus: mapCountRecord(registrations.by_status),
    },
    users: {
      total: Number(users.total ?? 0),
      byRole: mapCountRecord(users.by_role),
    },
    topEventsByRegistrations: topEvents.map((item) => {
      const event = item as Record<string, unknown>;
      return {
        id: String(event.id ?? ""),
        title: String(event.title ?? "Untitled Event"),
        status: String(event.status ?? ""),
        registrationCount: Number(event.registration_count ?? 0),
      };
    }),
    viewers: {
      totalSessions: Number(viewers.total_sessions ?? 0),
      currentlyWatching: Number(viewers.currently_watching ?? 0),
    },
  };
}

export function buildSummaryFromDashboard(dashboard: DashboardAnalytics): AnalyticsSummary {
  const { byStatus } = dashboard.registrations;

  return {
    totalUsers: dashboard.users.total,
    eventParticipants: dashboard.registrations.total,
    accepted: byStatus.ACCEPTED ?? 0,
    rejected: byStatus.REJECTED ?? 0,
    onHold: byStatus.HELD ?? 0,
    pending: byStatus.PENDING ?? 0,
  };
}

export function buildStatusDistribution(summary: AnalyticsSummary): DistributionDataPoint[] {
  return [
    { name: "Accepted", value: summary.accepted, color: "#22c55e" },
    { name: "Rejected", value: summary.rejected, color: "#ef4444" },
    { name: "On Hold", value: summary.onHold, color: "#f59e0b" },
    { name: "Pending", value: summary.pending, color: "#3b82f6" },
  ].filter((item) => item.value > 0);
}

export function buildRegistrationStatusDistribution(
  byStatus: Record<string, number>,
): DistributionDataPoint[] {
  return REGISTRATION_STATUS_CHART.map(({ key, name, color }) => ({
    name,
    value: byStatus[key] ?? 0,
    color,
  })).filter((item) => item.value > 0);
}

export function buildEventStatusDistribution(
  byStatus: Record<string, number>,
): DistributionDataPoint[] {
  return Object.entries(byStatus)
    .map(([key, value]) => ({
      name: EVENT_STATUS_LABELS[key] ?? key.replace(/_/g, " "),
      value,
    }))
    .filter((item) => item.value > 0);
}

export function buildUserRoleDistribution(
  byRole: Record<string, number>,
): DistributionDataPoint[] {
  return Object.entries(byRole)
    .map(([key, value]) => ({
      name: USER_ROLE_LABELS[key] ?? key.replace(/_/g, " "),
      value,
    }))
    .filter((item) => item.value > 0);
}

const ATTENDANCE_MODE_LABELS: Record<string, string> = {
  PHYSICAL: "Physical",
  VIRTUAL: "Virtual",
  HYBRID: "Hybrid",
  RECORDED: "Recorded",
  UNDECIDED: "Undecided",
};

const PARTICIPATION_TIME_LABELS: Record<string, string> = {
  HALF_DAY: "Half Day",
  FULL_DAY: "Full Day",
  MULTIPLE_DAYS: "Multiple Days",
};

const TRANSPORT_MODE_LABELS: Record<string, string> = {
  TAXI: "Taxi",
  FLIGHT: "Flight",
  TRAIN: "Train",
  SELF_ARRANGED: "Self Arranged",
};

const FOOD_PREFERENCE_LABELS: Record<string, string> = Object.fromEntries(
  FOOD_PREFERENCES.map((item) => [item.value.toUpperCase(), item.label]),
);

const LANGUAGE_LABELS: Record<string, string> = Object.fromEntries(
  TRANSLATION_LANGUAGES.map((item) => [item.value.toUpperCase(), item.label]),
);

const FOOD_CHART_COLORS = [
  "#22c55e", "#84cc16", "#10b981", "#14b8a6", "#0ea5e9",
  "#6366f1", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899",
  "#f97316", "#06b6d4", "#a855f7",
];

function mapAssistanceCategory(
  raw: unknown,
  extraKey?: "by_transport_mode" | "by_language",
): EventAnalyticsAssistance {
  const category = (raw ?? {}) as Record<string, unknown>;
  const result: EventAnalyticsAssistance = {
    total: Number(category.total ?? 0),
    byStatus: mapCountRecord(category.by_status),
  };

  if (extraKey && category[extraKey]) {
    if (extraKey === "by_transport_mode") {
      result.byTransportMode = mapCountRecord(category[extraKey]);
    } else {
      result.byLanguage = mapCountRecord(category[extraKey]);
    }
  }

  return result;
}

export function mapApiEventAnalytics(raw: Record<string, unknown>): EventAnalytics {
  const event = (raw.event ?? {}) as Record<string, unknown>;
  const registrations = (raw.registrations ?? {}) as Record<string, unknown>;
  const assistance = (raw.assistance_requests ?? {}) as Record<string, unknown>;
  const streaming = (raw.streaming ?? {}) as Record<string, unknown>;
  const participationDates = Array.isArray(raw.participation_dates) ? raw.participation_dates : [];

  return {
    event: {
      id: String(event.id ?? ""),
      title: String(event.title ?? "Untitled Event"),
      status: String(event.status ?? ""),
    },
    registrations: {
      total: Number(registrations.total ?? 0),
      byStatus: mapCountRecord(registrations.by_status),
      byAttendanceMode: mapCountRecord(registrations.by_attendance_mode),
      byFoodPreference: mapCountRecord(registrations.by_food_preference),
      byParticipationTime: mapCountRecord(registrations.by_participation_time),
    },
    participationDates: participationDates.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        date: String(row.date ?? ""),
        count: Number(row.count ?? 0),
      };
    }),
    assistanceRequests: {
      travel: mapAssistanceCategory(assistance.travel, "by_transport_mode"),
      medical: mapAssistanceCategory(assistance.medical),
      translation: mapAssistanceCategory(assistance.translation, "by_language"),
      accommodation: mapAssistanceCategory(assistance.accommodation),
    },
    streaming: {
      broadcastSessions: Number(streaming.broadcast_sessions ?? 0),
      primaryBroadcastActive: Boolean(streaming.primary_broadcast_active),
      totalViewerSessions: Number(streaming.total_viewer_sessions ?? 0),
      uniqueViewers: Number(streaming.unique_viewers ?? 0),
      currentlyWatching: Number(streaming.currently_watching ?? 0),
      avgWatchDurationSeconds: Number(streaming.avg_watch_duration_seconds ?? 0),
      totalWatchTimeSeconds: Number(streaming.total_watch_time_seconds ?? 0),
      peakConcurrentViewers: Number(streaming.peak_concurrent_viewers ?? 0),
      logins: Number(streaming.logins ?? 0),
    },
  };
}

export function buildDistributionFromRecord(
  record: Record<string, number>,
  labels: Record<string, string>,
  colors?: string[],
): DistributionDataPoint[] {
  return Object.entries(record)
    .map(([key, value], index) => ({
      name: labels[key] ?? key.replace(/_/g, " "),
      value,
      color: colors?.[index % colors.length],
    }))
    .filter((item) => item.value > 0);
}

export function buildAttendanceModeDistribution(
  byMode: Record<string, number>,
): DistributionDataPoint[] {
  return buildDistributionFromRecord(byMode, ATTENDANCE_MODE_LABELS);
}

export function buildFoodPreferenceDistribution(
  byFood: Record<string, number>,
): DistributionDataPoint[] {
  return buildDistributionFromRecord(byFood, FOOD_PREFERENCE_LABELS, FOOD_CHART_COLORS);
}

export function buildParticipationTimeDistribution(
  byTime: Record<string, number>,
): DistributionDataPoint[] {
  return buildDistributionFromRecord(byTime, PARTICIPATION_TIME_LABELS);
}

export function buildTransportModeDistribution(
  byMode: Record<string, number>,
): DistributionDataPoint[] {
  return buildDistributionFromRecord(byMode, TRANSPORT_MODE_LABELS);
}

export function buildLanguageDistribution(
  byLanguage: Record<string, number>,
): DistributionDataPoint[] {
  return buildDistributionFromRecord(byLanguage, LANGUAGE_LABELS);
}

export function buildParticipationDateTrend(
  dates: { date: string; count: number }[],
): DistributionDataPoint[] {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return dates
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: item.date ? formatter.format(new Date(item.date)) : "Unknown",
      value: item.count,
    }));
}

export function formatWatchDuration(seconds: number): string {
  if (seconds <= 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function buildDistributionTableRows(
  data: DistributionDataPoint[],
): AnalyticsDistributionRow[] {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return data.map((item) => ({
    category: item.name,
    count: item.value,
    sharePercent: total > 0 ? Math.round((item.value / total) * 1000) / 10 : 0,
  }));
}

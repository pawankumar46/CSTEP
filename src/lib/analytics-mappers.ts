import { formatEventDayDateLabel } from "@/lib/participation-dates";
import type {
  AnalyticsSummary,
  DashboardAnalytics,
  DistributionDataPoint,
  EventAnalytics,
  EventAnalyticsAssistance,
  ParticipationTimeSession,
  Registration,
  RegistrationCounts,
  RegistrationInsights,
  RegistrationIntervalBucket,
  RegistrationIntervalDay,
  RegistrationTrend,
  RegistrationAttendanceInsights,
  RegistrationDemographics,
  StreamingSummary,
  StreamingParticipationMode,
  StreamingParticipationTrend,
  DemographicShareRow,
  AttendanceModeInsightName,
  AttendanceModeInsightSlice,
  AttendanceModeByDateInsight,
  AttendanceMode,
  AttendanceModeUserDay,
  AttendanceModeUserRow,
  AttendanceModeUsersPage,
  RegistrationStatus,
} from "@/types";
import { FOOD_PREFERENCES, TRANSLATION_LANGUAGES } from "@/lib/registration-options";
import type { AnalyticsDistributionRow } from "@/lib/event-analytics-export";

const REGISTRATION_STATUS_CHART: { key: string; name: string; color: string }[] = [
  { key: "ACCEPTED", name: "Accepted", color: "#22c55e" },
  { key: "PENDING", name: "Pending", color: "#3b82f6" },
  { key: "HOLD", name: "Hold", color: "#f59e0b" },
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
      total: Number(events.total_count ?? events.total ?? 0),
      byStatus: mapCountRecord(events.by_status),
    },
    registrations: {
      total: Number(registrations.total_count ?? registrations.total ?? 0),
      byStatus: mapCountRecord(registrations.by_status),
    },
    users: {
      total: Number(users.total_count ?? users.total ?? 0),
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
      totalSessions: Number(viewers.total_sessions_count ?? viewers.total_sessions ?? 0),
      currentlyWatching: Number(viewers.currently_watching_count ?? viewers.currently_watching ?? 0),
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
    onHold: byStatus.HOLD ?? 0,
    pending: byStatus.PENDING ?? 0,
  };
}

export function buildStatusDistribution(summary: AnalyticsSummary): DistributionDataPoint[] {
  return [
    { name: "Accepted", value: summary.accepted, color: "#22c55e" },
    { name: "Rejected", value: summary.rejected, color: "#ef4444" },
    { name: "Hold", value: summary.onHold, color: "#f59e0b" },
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

export function mapApiParticipationTimeSessions(raw: unknown): ParticipationTimeSession[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item, index) => {
    const row = item as Record<string, unknown>;
    const loggedOut = row.logged_out_at;
    return {
      id: String(row.id ?? `participation-time-${index}`),
      userName: String(row.user_name ?? "Guest"),
      email: row.email ? String(row.email) : undefined,
      loggedInAt: String(row.logged_in_at ?? ""),
      loggedOutAt:
        loggedOut == null || loggedOut === "" ? null : String(loggedOut),
      durationSeconds: Number(row.duration_seconds ?? 0),
    };
  });
}

export function mapApiRegistrationIntervalsByDay(raw: unknown): RegistrationIntervalDay[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const row = item as Record<string, unknown>;
      const bucketsRaw = Array.isArray(row.buckets) ? row.buckets : [];
      const buckets = bucketsRaw.map((bucketItem) => {
        const b = bucketItem as Record<string, unknown>;
        return {
          bucketStart: String(b.bucket_start ?? b.start ?? ""),
          count: Number(b.count ?? 0),
        };
      });

      return {
        date: String(row.date ?? ""),
        intervalMinutes: Number(row.interval_minutes ?? 15),
        buckets,
      };
    })
    .filter((day) => day.date && day.buckets.length > 0);
}

export function mapApiRegistrationInsights(raw: unknown): RegistrationInsights {
  const insights = (raw ?? {}) as Record<string, unknown>;
  const byDayRaw = Array.isArray(insights.by_day_last_7) ? insights.by_day_last_7 : [];

  return {
    byDayLast7: byDayRaw.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        date: String(row.date ?? ""),
        count: Number(row.count ?? 0),
      };
    }).filter((row) => row.date),
    byAttendanceMode: mapCountRecord(insights.by_attendance_mode),
    byState: mapCountRecord(insights.by_state),
    byGender: mapCountRecord(insights.by_gender),
    byDesignation: mapCountRecord(insights.by_designation),
  };
}

export function mapApiRegistrationCounts(raw: unknown): RegistrationCounts {
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object)
      ? (raw as { data: unknown }).data
      : raw;
  const row = (nested ?? {}) as Record<string, unknown>;
  return {
    total: Number(row.total ?? 0),
    accepted: Number(row.accepted ?? 0),
    pending: Number(row.pending ?? 0),
    onHold: Number(row.on_hold ?? row.held ?? row.hold ?? 0),
    rejected: Number(row.rejected ?? 0),
  };
}

export function mapApiRegistrationTrend(raw: unknown): RegistrationTrend {
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object) && !("results" in (raw as object))
      ? (raw as { data: unknown }).data
      : raw;
  const row = (nested ?? {}) as Record<string, unknown>;
  const resultsRaw = Array.isArray(row.results) ? row.results : [];

  return {
    granularity: String(row.granularity ?? "daily"),
    results: resultsRaw
      .map((item) => {
        const point = item as Record<string, unknown>;
        const rawDate = String(point.date ?? "");
        return {
          date: rawDate.slice(0, 10) || rawDate,
          count: Number(point.count ?? 0),
        };
      })
      .filter((point) => point.date),
  };
}

const ATTENDANCE_MODE_API_ALIASES: Record<string, AttendanceModeInsightName> = {
  "physical (on-site)": "Physical",
  physical: "Physical",
  "virtual (online)": "Virtual",
  virtual: "Virtual",
  "mixed (physical + virtual)": "Mixed",
  mixed: "Mixed",
};

function normalizeAttendanceModeName(raw: string): AttendanceModeInsightName | null {
  const key = raw.trim().toLowerCase();
  if (key === "total" || key === "hybrid" || key.includes("recorded")) return null;
  return ATTENDANCE_MODE_API_ALIASES[key] ?? null;
}

export function mapApiRegistrationAttendanceInsights(raw: unknown): RegistrationAttendanceInsights {
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object) && !("attendance_mode" in (raw as object))
      ? (raw as { data: unknown }).data
      : raw;
  const row = (nested ?? {}) as Record<string, unknown>;
  const modeRows = Array.isArray(row.attendance_mode) ? row.attendance_mode : [];
  const byDateRows = Array.isArray(row.attendance_mode_by_date) ? row.attendance_mode_by_date : [];

  const attendanceMode: AttendanceModeInsightSlice[] = [];
  for (const item of modeRows) {
    const modeRow = item as Record<string, unknown>;
    const name = normalizeAttendanceModeName(String(modeRow.mode ?? ""));
    if (!name) continue;
    attendanceMode.push({
      name,
      count: Number(modeRow.count ?? 0),
      share: modeRow.share != null ? Number(modeRow.share) : undefined,
    });
  }

  const order: AttendanceModeInsightName[] = ["Physical", "Virtual", "Mixed"];
  attendanceMode.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

  const attendanceModeByDate: AttendanceModeByDateInsight[] = byDateRows.map((item) => {
    const day = item as Record<string, unknown>;
    let physical = 0;
    let virtual = 0;
    let mixed = 0;

    for (const [key, value] of Object.entries(day)) {
      if (key === "date" || key === "total") continue;
      const name = normalizeAttendanceModeName(key);
      const count = Number(value ?? 0);
      if (name === "Physical") physical = count;
      if (name === "Virtual") virtual = count;
      if (name === "Mixed") mixed = count;
    }

    return {
      date: String(day.date ?? "").slice(0, 10),
      total: Number(day.total ?? physical + virtual + mixed),
      physical,
      virtual,
      mixed,
    };
  }).filter((day) => day.date);

  return { attendanceMode, attendanceModeByDate };
}

export function buildAttendanceModeSlicesChart(
  slices: AttendanceModeInsightSlice[],
): DistributionDataPoint[] {
  const colors: Record<AttendanceModeInsightName, string> = {
    Physical: "#0ea5e9",
    Virtual: "#8b5cf6",
    Mixed: "#f59e0b",
  };

  return slices
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: item.name,
      value: item.count,
      color: colors[item.name],
    }));
}

export function buildAttendanceModeByDateChart(
  day: AttendanceModeByDateInsight | undefined,
): DistributionDataPoint[] {
  if (!day) return [];
  return buildAttendanceModeSlicesChart([
    { name: "Physical", count: day.physical },
    { name: "Virtual", count: day.virtual },
    { name: "Mixed", count: day.mixed },
  ]);
}

function mapDemographicShareRows(raw: unknown): DemographicShareRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        label: String(row.label ?? "").trim(),
        count: Number(row.count ?? 0),
        share: row.share != null ? Number(row.share) : undefined,
      };
    })
    .filter((row) => row.label);
}

export function mapApiRegistrationDemographics(raw: unknown): RegistrationDemographics {
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object) && !("by_gender" in (raw as object))
      ? (raw as { data: unknown }).data
      : raw;
  const row = (nested ?? {}) as Record<string, unknown>;
  return {
    total: Number(row.total ?? 0),
    byGender: mapDemographicShareRows(row.by_gender),
    byDesignation: mapDemographicShareRows(row.by_designation),
    byState: mapDemographicShareRows(row.by_state),
  };
}

export function mapApiStreamingSummary(raw: unknown): StreamingSummary {
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object) && !("currently_watching" in (raw as object))
      ? (raw as { data: unknown }).data
      : raw;
  const row = (nested ?? {}) as Record<string, unknown>;
  const avgSeconds = Number(row.avg_watch_time_seconds ?? 0);
  const totalSeconds = Number(row.total_watch_time_seconds ?? 0);
  return {
    currentlyWatching: Number(row.currently_watching ?? 0),
    uniqueViewers: Number(row.unique_viewers ?? 0),
    broadcastSessions: Number(row.broadcast_sessions ?? 0),
    peakConcurrentViewers: Number(row.peak_concurrent_viewers ?? 0),
    avgWatchTimeSeconds: avgSeconds,
    avgWatchTimeDisplay: String(row.avg_watch_time_display ?? formatWatchDuration(avgSeconds)),
    totalWatchTimeSeconds: totalSeconds,
    totalWatchTimeDisplay: String(row.total_watch_time_display ?? formatWatchDuration(totalSeconds)),
    liveBroadcast: Boolean(row.live_broadcast),
  };
}

function normalizeParticipationMode(raw: unknown): StreamingParticipationMode {
  const value = String(raw ?? "all").trim().toLowerCase();
  if (value === "physical") return "physical";
  if (value === "virtual") return "virtual";
  return "all";
}

function mapParticipationTrendBuckets(raw: unknown): RegistrationIntervalBucket[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        bucketStart: String(
          row.bucket_start ?? row.start ?? row.timestamp ?? row.time ?? row.datetime ?? "",
        ),
        count: Number(row.count ?? row.value ?? 0),
      };
    })
    .filter((bucket) => bucket.bucketStart);
}

/** Maps `{ mode, results }` from GET /analytics/streaming/participation-trend/. */
export function mapApiStreamingParticipationTrend(
  raw: unknown,
  fallbacks?: {
    date?: string;
    mode?: StreamingParticipationMode;
    intervalMinutes?: number;
  },
): StreamingParticipationTrend {
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object) && !("results" in (raw as object))
      ? (raw as { data: unknown }).data
      : raw;
  const row = (nested ?? {}) as Record<string, unknown>;
  // API shape: { mode, results: [{ bucket_start, count }, ...] }
  const bucketsRaw = Array.isArray(row.results)
    ? row.results
    : Array.isArray(row.buckets)
      ? row.buckets
      : [];
  const buckets = mapParticipationTrendBuckets(bucketsRaw);
  const dateFromBuckets = buckets[0]?.bucketStart?.slice(0, 10);

  return {
    date: String(row.date ?? fallbacks?.date ?? dateFromBuckets ?? "").slice(0, 10),
    mode: normalizeParticipationMode(row.mode ?? fallbacks?.mode),
    intervalMinutes: Number(row.interval_minutes ?? fallbacks?.intervalMinutes ?? 15),
    buckets,
  };
}

function formatAttendanceUserName(user: Record<string, unknown>): string {
  const parts = [
    user.salutation,
    user.first_name,
    user.middle_name,
    user.last_name,
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);
  return parts.join(" ") || "Unknown";
}

function mapAttendanceUserStatus(value: unknown): RegistrationStatus {
  const normalized = String(value ?? "PENDING").toUpperCase();
  if (normalized === "ACCEPTED") return "accepted";
  if (normalized === "REJECTED") return "rejected";
  if (normalized === "HOLD" || normalized === "ON_HOLD" || normalized === "HELD") return "on_hold";
  return "pending";
}

function mapAttendanceUserDay(raw: unknown): AttendanceModeUserDay | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const mode = String(row.attendance_mode ?? "").toUpperCase();
  if (mode !== "PHYSICAL" && mode !== "VIRTUAL") return null;
  const date = String(row.date ?? "").slice(0, 10);
  if (!date) return null;
  return {
    id: String(row.id ?? `${date}-${mode}`),
    date,
    attendanceMode: mode === "VIRTUAL" ? "virtual" : "physical",
  };
}

export function mapApiAttendanceModeUserRow(raw: unknown): AttendanceModeUserRow {
  const row = (raw ?? {}) as Record<string, unknown>;
  const user =
    row.user && typeof row.user === "object"
      ? (row.user as Record<string, unknown>)
      : {};
  const days = Array.isArray(row.days)
    ? row.days.map(mapAttendanceUserDay).filter((day): day is AttendanceModeUserDay => day != null)
    : [];

  return {
    id: String(row.id ?? ""),
    userName: formatAttendanceUserName(user),
    phone: String(user.phone_number ?? ""),
    email: String(user.email ?? ""),
    designation: String(user.designation ?? ""),
    orgName: String(user.org_name ?? ""),
    city: String(user.city ?? ""),
    state: String(user.state ?? ""),
    eventName: String(row.event_name ?? ""),
    status: mapAttendanceUserStatus(row.status),
    days,
    createdAt: String(row.created_at ?? ""),
  };
}

export function mapApiAttendanceModeUsersPage(
  raw: unknown,
  fallbacks?: { page?: number; pageSize?: number },
): AttendanceModeUsersPage {
  const pageSize = fallbacks?.pageSize ?? 10;
  if (Array.isArray(raw)) {
    const rows = raw.map(mapApiAttendanceModeUserRow);
    return {
      rows,
      page: 1,
      pageSize,
      total: rows.length,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    };
  }

  const row = (raw ?? {}) as Record<string, unknown>;
  const results = Array.isArray(row.results) ? row.results : [];
  const rows = results.map(mapApiAttendanceModeUserRow);
  const total = Number(row.count ?? rows.length);
  const totalPages = Number(row.total_pages ?? Math.max(1, Math.ceil(total / pageSize)));
  const page = Number(row.current_page ?? fallbacks?.page ?? 1);

  return {
    rows,
    page,
    pageSize,
    total,
    totalPages,
    hasNext: Boolean(row.next) || page < totalPages,
    hasPrevious: Boolean(row.previous) || page > 1,
  };
}

export function formatAttendanceModeUserDays(days: AttendanceModeUserDay[]): string {
  if (days.length === 0) return "—";
  return days
    .map((day) => {
      const label = formatEventDayDateLabel(day.date);
      const mode = day.attendanceMode === "virtual" ? "Virtual" : "Physical";
      return `${label} (${mode})`;
    })
    .join(", ");
}

export function buildDemographicDonutChart(
  rows: DemographicShareRow[],
): DistributionDataPoint[] {
  const colors = ["#3b82f6", "#ec4899", "#94a3b8", "#22c55e", "#f59e0b", "#a855f7"];
  return rows
    .filter((row) => row.count > 0)
    .map((row, index) => {
      const lower = row.label.toLowerCase();
      let color = colors[index % colors.length];
      if (lower === "male") color = "#3b82f6";
      else if (lower === "female") color = "#ec4899";
      else if (lower.includes("prefer") || lower.includes("not")) color = "#94a3b8";
      else if (lower === "other") color = "#a855f7";
      return { name: row.label, value: row.count, color };
    });
}

export function buildDemographicBarChart(
  rows: DemographicShareRow[],
  topN = 8,
): DistributionDataPoint[] {
  const sorted = [...rows]
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  if (sorted.length === 0) return [];

  const top = sorted.slice(0, topN);
  const othersValue = sorted.slice(topN).reduce((sum, row) => sum + row.count, 0);
  const palette = ["#3b82f6", "#0ea5e9", "#06b6d4", "#14b8a6", "#22c55e", "#84cc16", "#f59e0b", "#a855f7"];

  const points = top.map((row, index) => ({
    name: row.label,
    value: row.count,
    color: palette[index % palette.length],
  }));

  if (othersValue > 0) {
    points.push({ name: "Others", value: othersValue, color: "#94a3b8" });
  }

  return points;
}

/** All demographic rows (no “Others” bucket), sorted by count descending. */
export function buildDemographicBarChartAll(
  rows: DemographicShareRow[],
): DistributionDataPoint[] {
  const sorted = [...rows]
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  const palette = ["#3b82f6", "#0ea5e9", "#06b6d4", "#14b8a6", "#22c55e", "#84cc16", "#f59e0b", "#a855f7"];

  return sorted.map((row, index) => ({
    name: row.label,
    value: row.count,
    color: palette[index % palette.length],
  }));
}

function emptyRegistrationInsights(): RegistrationInsights {
  return {
    byDayLast7: [],
    byAttendanceMode: {},
    byState: {},
    byGender: {},
    byDesignation: {},
  };
}

export function mapApiEventAnalytics(raw: Record<string, unknown>): EventAnalytics {
  const event = (raw.event ?? {}) as Record<string, unknown>;
  const registrations = (raw.registrations ?? {}) as Record<string, unknown>;
  const assistance = (raw.assistance_requests ?? {}) as Record<string, unknown>;
  const streaming = (raw.streaming ?? {}) as Record<string, unknown>;
  const participationDates = Array.isArray(raw.participation_dates) ? raw.participation_dates : [];
  const days = Array.isArray(raw.days) ? raw.days : [];
  const sessions = Array.isArray(raw.sessions) ? raw.sessions : [];

  return {
    event: {
      id: String(event.id ?? ""),
      title: String(event.title ?? "Untitled Event"),
      status: String(event.status ?? ""),
    },
    registrations: {
      total: Number(registrations.total_count ?? registrations.total ?? 0),
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
    days: days.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(row.session__day__id ?? row.day_id ?? ""),
        date: String(row.session__day__date ?? row.date ?? ""),
        registrationsCount: Number(row.registrations_count ?? 0),
        sessionsCount: Number(row.sessions_count ?? 0),
        byAttendanceMode: row.by_attendance_mode
          ? mapCountRecord(row.by_attendance_mode)
          : undefined,
      };
    }),
    sessions: sessions.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(row.session__id ?? row.id ?? ""),
        title: String(row.session__title ?? row.title ?? "Untitled Session"),
        dayDate: String(row.session__day__date ?? row.date ?? ""),
        registrationsCount: Number(row.registrations_count ?? 0),
      };
    }),
    assistanceRequests: {
      travel: mapAssistanceCategory(assistance.travel, "by_transport_mode"),
      medical: mapAssistanceCategory(assistance.medical),
      translation: mapAssistanceCategory(assistance.translation, "by_language"),
      accommodation: mapAssistanceCategory(assistance.accommodation),
    },
    streaming: {
      broadcastSessions: Number(streaming.broadcast_sessions_count ?? streaming.broadcast_sessions ?? 0),
      primaryBroadcastActive: Boolean(streaming.primary_broadcast_active),
      totalViewerSessions: Number(streaming.total_viewer_sessions_count ?? streaming.total_viewer_sessions ?? 0),
      uniqueViewers: Number(streaming.unique_viewers_count ?? streaming.unique_viewers ?? 0),
      currentlyWatching: Number(streaming.currently_watching_count ?? streaming.currently_watching ?? 0),
      avgWatchDurationSeconds: Number(streaming.avg_watch_duration_seconds ?? 0),
      totalWatchTimeSeconds: Number(streaming.total_watch_time_seconds ?? 0),
      peakConcurrentViewers: Number(streaming.peak_concurrent_viewers_count ?? streaming.peak_concurrent_viewers ?? 0),
      logins: Number(streaming.logins_count ?? streaming.logins ?? 0),
    },
    participationTimeSessions: mapApiParticipationTimeSessions(raw.participation_time),
    registrationIntervalsByDay: mapApiRegistrationIntervalsByDay(raw.registration_intervals_by_day),
    registrationInsights: raw.registration_insights
      ? mapApiRegistrationInsights(raw.registration_insights)
      : emptyRegistrationInsights(),
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

export function registrationMatchesEventDate(
  registration: Registration,
  isoDate: string,
): boolean {
  if (registration.days?.some((day) => day.date === isoDate)) return true;
  if (registration.sessionRegistrations?.some((session) => session.date === isoDate)) {
    return true;
  }
  const formatted = formatEventDayDateLabel(isoDate);
  const label = registration.participationDateLabel ?? "";
  if (label.includes(isoDate) || label.includes(formatted)) return true;
  return false;
}

export function filterRegistrationsByEventDate(
  registrations: Registration[],
  isoDate: string | null,
): Registration[] {
  if (!isoDate || isoDate === "all") return registrations;
  return registrations.filter((registration) => registrationMatchesEventDate(registration, isoDate));
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

export function buildParticipationDatesFromEventDays(
  days: { date: string; registrationsCount: number }[],
): DistributionDataPoint[] {
  return days
    .filter((item) => item.registrationsCount > 0)
    .map((item) => ({
      name: item.date ? formatEventDayDateLabel(item.date) : "Unknown",
      value: item.registrationsCount,
    }));
}

export interface AttendanceDayModeTableRow {
  isoDate: string;
  dateLabel: string;
  physical: number;
  virtual: number;
  total: number;
}

export function buildAttendanceDayModeRows(
  days: {
    date: string;
    registrationsCount: number;
    byAttendanceMode?: Record<string, number>;
  }[],
): AttendanceDayModeTableRow[] {
  return [...days]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => {
      const physical = day.byAttendanceMode?.PHYSICAL ?? 0;
      const virtual = day.byAttendanceMode?.VIRTUAL ?? 0;
      const modeSum = physical + virtual;
      const total = modeSum > 0 ? modeSum : day.registrationsCount;
      return {
        isoDate: day.date,
        dateLabel: day.date ? formatEventDayDateLabel(day.date) : "Unknown",
        physical,
        virtual,
        total,
      };
    });
}

export function buildDayTrend(
  days: { date: string; registrationsCount: number }[],
): DistributionDataPoint[] {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  });

  return days.map((item) => ({
    name: item.date ? formatter.format(new Date(item.date)) : "Unknown",
    value: item.registrationsCount,
  }));
}

export function buildSessionParticipationTrend(
  days: { date: string; sessionsCount: number }[],
): DistributionDataPoint[] {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  });

  return days.map((item) => ({
    name: item.date ? formatter.format(new Date(item.date)) : "Unknown",
    value: item.sessionsCount,
  }));
}

const INTERVAL_TIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});

export function formatRegistrationIntervalLabel(bucketStart: string): string {
  if (!bucketStart) return "—";
  const date = new Date(bucketStart);
  if (Number.isNaN(date.getTime())) return bucketStart;
  return INTERVAL_TIME_FORMATTER.format(date);
}

export function buildRegistrationIntervalTrend(
  day: RegistrationIntervalDay | undefined,
): DistributionDataPoint[] {
  if (!day?.buckets.length) return [];

  return day.buckets.map((bucket) => ({
    name: formatRegistrationIntervalLabel(bucket.bucketStart),
    value: bucket.count,
  }));
}

export function formatRegistrationIntervalDayLabel(isoDate: string): string {
  if (!isoDate) return "Unknown";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(isoDate));
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type RegistrationTrendGranularity = "daily" | "weekly" | "monthly";

export function buildRollingDayRegistrationTrend(
  days: { date: string; count: number }[],
  referenceDate: Date = new Date(),
): DistributionDataPoint[] {
  const dayFormatter = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  });
  const countByDate = new Map(days.map((item) => [item.date, item.count]));
  const today = new Date(referenceDate);
  today.setHours(12, 0, 0, 0);
  const todayIso = toLocalIsoDate(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayIso = toLocalIsoDate(yesterday);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const iso = toLocalIsoDate(date);
    let name = dayFormatter.format(date);
    if (iso === todayIso) name = "Today";
    else if (iso === yesterdayIso) name = "Yesterday";
    return {
      name,
      value: countByDate.get(iso) ?? 0,
    };
  });
}

function parseTrendDate(isoDate: string): Date | null {
  const dateOnly = isoDate.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const date = new Date(`${dateOnly}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(isoDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTrendBucketLabel(
  isoDate: string,
  granularity: RegistrationTrendGranularity,
): string {
  const date = parseTrendDate(isoDate);
  if (!date) return isoDate.slice(0, 10) || isoDate;

  if (granularity === "monthly") {
    return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(date);
  }
  if (granularity === "weekly") {
    return `Week of ${new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(date)}`;
  }
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(date);
}

/** Build chart points for daily (last 7 days) or weekly/monthly API buckets. */
export function buildRegistrationTrendChart(
  results: { date: string; count: number }[],
  granularity: RegistrationTrendGranularity,
  referenceDate: Date = new Date(),
): DistributionDataPoint[] {
  if (granularity === "daily") {
    return buildRollingDayRegistrationTrend(results, referenceDate);
  }

  const limit = granularity === "weekly" ? 8 : 6;
  const sorted = [...results]
    .filter((item) => item.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const slice = sorted.slice(-limit);

  return slice.map((item) => ({
    name: formatTrendBucketLabel(item.date, granularity),
    value: item.count,
  }));
}

const ATTENDANCE_MODE_CHART_LABELS: Record<string, string> = {
  PHYSICAL: "Physical",
  VIRTUAL: "Virtual",
};

const GENDER_CHART_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

const INSIGHT_CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#06b6d4", "#84cc16"];

export function buildAttendanceModeInsightChart(
  byMode: Record<string, number>,
): DistributionDataPoint[] {
  return (["PHYSICAL", "VIRTUAL"] as const)
    .map((key, index) => ({
      name: ATTENDANCE_MODE_CHART_LABELS[key],
      value: byMode[key] ?? 0,
      color: INSIGHT_CHART_COLORS[index],
    }))
    .filter((item) => item.value > 0);
}

export function buildGenderInsightChart(
  byGender: Record<string, number>,
): DistributionDataPoint[] {
  return (["MALE", "FEMALE", "OTHER"] as const)
    .map((key, index) => ({
      name: GENDER_CHART_LABELS[key],
      value: byGender[key] ?? 0,
      color: INSIGHT_CHART_COLORS[index],
    }))
    .filter((item) => item.value > 0);
}

export function buildStateInsightChart(
  byState: Record<string, number>,
  topN = 5,
): DistributionDataPoint[] {
  const sorted = Object.entries(byState)
    .map(([name, value]) => ({ name, value: Number(value) || 0 }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  if (sorted.length === 0) return [];

  const top = sorted.slice(0, topN);
  const othersValue = sorted.slice(topN).reduce((sum, item) => sum + item.value, 0);
  const rows = top.map((item, index) => ({
    ...item,
    color: INSIGHT_CHART_COLORS[index % INSIGHT_CHART_COLORS.length],
  }));

  if (othersValue > 0) {
    rows.push({
      name: "Others",
      value: othersValue,
      color: "#94a3b8",
    });
  }

  return rows;
}

export function buildDesignationInsightChart(
  byDesignation: Record<string, number>,
): DistributionDataPoint[] {
  return Object.entries(byDesignation)
    .map(([name, value], index) => ({
      name,
      value: Number(value) || 0,
      color: INSIGHT_CHART_COLORS[index % INSIGHT_CHART_COLORS.length],
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function formatWatchDuration(seconds: number): string {
  if (seconds <= 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatParticipationDateTime(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
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

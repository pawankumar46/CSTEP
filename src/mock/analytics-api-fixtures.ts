import type {
  ApiAnalyticsDashboardResponse,
  ApiAnalyticsEventResponse,
} from "@/lib/analytics-api-contract";
import { MOCK_REGISTRATION_INTERVALS_BY_DAY } from "@/mock/analytics-registration-intervals";

/** UI demo / BE reference — matches Analytics Overview screens. */
export const MOCK_ANALYTICS_DASHBOARD_RAW: ApiAnalyticsDashboardResponse = {
  events: {
    total_count: 1,
    by_status: {
      DRAFT: 1,
      SCHEDULED: 0,
      LIVE: 0,
      ENDED: 0,
      CANCELLED: 0,
    },
  },
  registrations: {
    total_count: 32,
    by_status: {
      PENDING: 0,
      ACCEPTED: 32,
      HELD: 0,
      REJECTED: 0,
    },
  },
  users: {
    total_count: 47,
    by_role: {
      BASE_USER: 43,
      MODERATOR: 1,
      EVENT_ADMIN: 2,
      SUPER_ADMIN: 1,
    },
  },
  top_events_by_registrations: [
    {
      id: 11,
      title: "CSTEP - ICAS CONFERENCE 2026",
      status: "DRAFT",
      registration_count: 32,
    },
  ],
  viewers: {
    total_sessions_count: 0,
    currently_watching_count: 0,
  },
};

export const MOCK_ANALYTICS_EVENT_11_RAW: ApiAnalyticsEventResponse = {
  event: {
    id: 11,
    title: "CSTEP - ICAS CONFERENCE 2026",
    status: "DRAFT",
  },
  registrations: {
    total_count: 32,
    by_status: {
      PENDING: 0,
      ACCEPTED: 32,
      HELD: 0,
      REJECTED: 0,
    },
    by_attendance_mode: {
      PHYSICAL: 45,
      VIRTUAL: 16,
      HYBRID: 0,
      RECORDED: 0,
    },
  },
  days: [
    {
      session__day__id: 10,
      session__day__date: "2026-08-19",
      registrations_count: 1,
      sessions_count: 8,
      by_attendance_mode: { PHYSICAL: 1, VIRTUAL: 0 },
    },
    {
      session__day__id: 7,
      session__day__date: "2026-08-20",
      registrations_count: 32,
      sessions_count: 208,
      by_attendance_mode: { PHYSICAL: 28, VIRTUAL: 12 },
    },
    {
      session__day__id: 8,
      session__day__date: "2026-08-21",
      registrations_count: 28,
      sessions_count: 203,
      by_attendance_mode: { PHYSICAL: 16, VIRTUAL: 4 },
    },
  ],
  sessions: [],
  streaming: {
    broadcast_sessions_count: 0,
    primary_broadcast_active: false,
    total_viewer_sessions_count: 0,
    unique_viewers_count: 0,
    currently_watching_count: 0,
    avg_watch_duration_seconds: 0,
    total_watch_time_seconds: 0,
    peak_concurrent_viewers_count: 0,
    logins_count: 0,
  },
  participation_time: [
    {
      id: "pt-demo-1",
      user_name: "Ananya Sharma",
      email: "ananya.sharma@example.com",
      logged_in_at: "2026-08-20T09:05:00+05:30",
      logged_out_at: "2026-08-20T10:42:00+05:30",
      duration_seconds: 5820,
    },
    {
      id: "pt-demo-2",
      user_name: "Rahul Mehta",
      email: "rahul.mehta@example.com",
      logged_in_at: "2026-08-20T14:18:00+05:30",
      logged_out_at: "2026-08-20T15:03:00+05:30",
      duration_seconds: 2700,
    },
  ],
  registration_intervals_by_day: MOCK_REGISTRATION_INTERVALS_BY_DAY.map((day) => ({
    date: day.date,
    interval_minutes: day.intervalMinutes,
    buckets: day.buckets.map((b) => ({
      bucket_start: b.bucketStart,
      count: b.count,
    })),
  })),
};

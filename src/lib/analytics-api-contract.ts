/**
 * Target Django REST shapes for Analytics Overview UI.
 * Backend should match these keys; mappers in analytics-mappers.ts normalize into app types.
 */

export type ApiCountRecord = Record<string, number>;

export interface ApiAnalyticsDashboardResponse {
  events: {
    total_count: number;
    by_status: ApiCountRecord;
  };
  registrations: {
    total_count: number;
    by_status: ApiCountRecord;
  };
  users: {
    total_count: number;
    by_role: ApiCountRecord;
  };
  top_events_by_registrations: {
    id: number | string;
    title: string;
    status: string;
    registration_count: number;
  }[];
  viewers: {
    total_sessions_count: number;
    currently_watching_count: number;
  };
}

export interface ApiAnalyticsEventDayRow {
  session__day__id: number | string;
  session__day__date: string;
  registrations_count: number;
  sessions_count: number;
  /** Per-day Physical / Virtual counts for date filter on overview (recommended for BE). */
  by_attendance_mode?: ApiCountRecord;
}

export interface ApiAnalyticsEventSessionRow {
  session__id: number | string;
  session__title: string;
  session__day__date: string;
  registrations_count: number;
}

export interface ApiAnalyticsEventResponse {
  event: {
    id: number | string;
    title: string;
    status: string;
  };
  registrations: {
    total_count: number;
    by_status: ApiCountRecord;
    by_attendance_mode: ApiCountRecord;
    by_participation_time?: ApiCountRecord;
    by_food_preference?: ApiCountRecord;
  };
  days: ApiAnalyticsEventDayRow[];
  sessions?: ApiAnalyticsEventSessionRow[];
  assistance_requests?: Record<string, unknown>;
  streaming: {
    broadcast_sessions_count: number;
    primary_broadcast_active: boolean;
    total_viewer_sessions_count: number;
    unique_viewers_count: number;
    currently_watching_count: number;
    avg_watch_duration_seconds: number;
    total_watch_time_seconds: number;
    peak_concurrent_viewers_count: number;
    logins_count: number;
  };
  /** Live viewer login sessions (Live Event Insights — participation time table). */
  participation_time?: ApiParticipationTimeViewerRow[];
  /** Registrations per time bucket for Participation Trend chart (15-minute intervals). */
  registration_intervals_by_day?: ApiRegistrationIntervalDay[];
}

export interface ApiRegistrationIntervalBucket {
  bucket_start: string;
  count: number;
}

export interface ApiRegistrationIntervalDay {
  date: string;
  interval_minutes?: number;
  buckets: ApiRegistrationIntervalBucket[];
}

export interface ApiParticipationTimeViewerRow {
  id?: number | string;
  user_name: string;
  email?: string;
  logged_in_at: string;
  logged_out_at: string | null;
  duration_seconds: number;
}

/** Optional query for attendance-mode analytics list (future BE). */
export interface ApiRegistrationsListQuery {
  event: string;
  attendance_mode?: "PHYSICAL" | "VIRTUAL";
  /** ISO date YYYY-MM-DD — filter registrations that include this event day */
  participation_date?: string;
  page?: number;
  page_size?: number;
}

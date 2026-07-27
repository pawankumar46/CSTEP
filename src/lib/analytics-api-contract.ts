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
  /** Registration Insights charts (day / mode / state / gender / designation). */
  registration_insights?: ApiRegistrationInsights;
}

export interface ApiRegistrationDayCount {
  date: string;
  count: number;
}

export interface ApiRegistrationInsights {
  /** Rolling last 7 calendar days of registration creates (ISO date YYYY-MM-DD). */
  by_day_last_7?: ApiRegistrationDayCount[];
  by_attendance_mode?: ApiCountRecord;
  by_state?: ApiCountRecord;
  by_gender?: ApiCountRecord;
  by_designation?: ApiCountRecord;
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

/** Optional query for attendance-mode analytics list (legacy). */
export interface ApiRegistrationsListQuery {
  event: string;
  attendance_mode?: "PHYSICAL" | "VIRTUAL";
  /** ISO date YYYY-MM-DD — filter registrations that include this event day */
  participation_date?: string;
  page?: number;
  page_size?: number;
}

/** GET /analytics/registrations/users/?event_id=&days__day__date=&days__attendance_mode= */
export interface ApiAttendanceModeUserDay {
  id: number | string;
  date: string;
  attendance_mode: "PHYSICAL" | "VIRTUAL" | string;
}

export interface ApiAttendanceModeUserRow {
  id: number | string;
  user: {
    salutation?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    phone_number?: string;
    email?: string;
    gender?: string;
    role?: string;
    city?: string;
    state?: string;
    country?: string;
    designation?: string;
    org_type?: string;
    org_name?: string;
    created_at?: string;
    updated_at?: string;
  };
  event_name?: string;
  status?: string;
  days?: ApiAttendanceModeUserDay[];
  created_at?: string;
  updated_at?: string;
}

export interface ApiAttendanceModeUsersResponse {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: ApiAttendanceModeUserRow[];
}

/** GET /analytics/registrations/counts/?event_id= */
export interface ApiRegistrationCountsResponse {
  total: number;
  accepted: number;
  pending: number;
  on_hold: number;
  rejected: number;
  /** Not shown in Overview UI */
  undecided_mode?: number;
}

/** GET /analytics/registrations/trend/?event_id=&granularity=daily */
export interface ApiRegistrationTrendPoint {
  date: string;
  count: number;
}

export interface ApiRegistrationTrendResponse {
  granularity: "daily" | "weekly" | "monthly" | string;
  results: ApiRegistrationTrendPoint[];
}

/** GET /analytics/registrations/insights/?event_id= */
export interface ApiRegistrationInsightShareRow {
  status?: string;
  mode?: string;
  count: number;
  share?: number;
}

export interface ApiAttendanceModeByDateRow {
  date: string;
  total: number;
  [modeOrKey: string]: string | number;
}

export interface ApiRegistrationInsightsResponse {
  registration_status?: ApiRegistrationInsightShareRow[];
  attendance_mode?: ApiRegistrationInsightShareRow[];
  attendance_mode_by_date?: ApiAttendanceModeByDateRow[];
  participation_time?: unknown[];
  participation_dates?: unknown[];
}

/** GET /analytics/registrations/demographics/?event_id= */
export interface ApiDemographicShareRow {
  label: string;
  count: number;
  share?: number;
}

export interface ApiRegistrationDemographicsResponse {
  total: number;
  by_gender?: ApiDemographicShareRow[];
  by_org_type?: ApiDemographicShareRow[];
  by_designation?: ApiDemographicShareRow[];
  by_state?: ApiDemographicShareRow[];
  by_city?: ApiDemographicShareRow[];
  by_country?: ApiDemographicShareRow[];
}

/** GET /analytics/events/feedback/?event=&day= */
export interface ApiEventFeedbackDayRow {
  event_day_id: number | string;
  day_number: number;
  event_date?: string;
  total_feedback: number;
  average_rating: number;
}

export interface ApiEventFeedbackSessionRow {
  schedule_item_id: number | string;
  title: string;
  total_feedback: number;
  average_rating: number;
}

export interface ApiEventFeedbackByDateRow {
  date: string;
  count: number;
}

export interface ApiEventFeedbackAnalyticsResponse {
  event_id: number | string;
  overall?: {
    total_feedback?: number;
    average_rating?: number;
    rating_distribution?: Record<string, number>;
    feedback_by_date?: ApiEventFeedbackByDateRow[];
  };
  by_day?: ApiEventFeedbackDayRow[];
  by_session?: ApiEventFeedbackSessionRow[];
}

/** GET /analytics/streaming/summary/?event_id= */
export interface ApiStreamingSummaryResponse {
  currently_watching: number;
  unique_viewers: number;
  broadcast_sessions: number;
  peak_concurrent_viewers: number;
  avg_watch_time_seconds: number;
  avg_watch_time_display: string;
  total_watch_time_seconds: number;
  total_watch_time_display: string;
  live_broadcast: boolean;
}

/** GET /analytics/streaming/participation-trend/?event_id=&mode=&interval_minutes=&date= */
export interface ApiStreamingParticipationTrendBucket {
  bucket_start: string;
  count: number;
}

/** Observed response: `{ "mode": "all", "results": [] }` (and filled `results` when data exists). */
export interface ApiStreamingParticipationTrendResponse {
  mode: "all" | "physical" | "virtual" | string;
  results: ApiStreamingParticipationTrendBucket[];
  date?: string;
  interval_minutes?: number;
}

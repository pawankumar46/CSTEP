import {
  DEFAULT_FEEDBACK_EVENT_ID,
  DEFAULT_FEEDBACK_EVENT_NAME,
  FEEDBACK_DAY_OVERALL_TITLE,
  FEEDBACK_EVENT_OVERALL_TITLE,
  formatFeedbackEventDate,
  getFeedbackSessionDisplayName,
} from "@/lib/feedback-options";
import { formatDateTime } from "@/lib/utils";
import type { StreamingFeedbackFormValues } from "@/features/feedback/streaming-feedback.schema";
import type { EventFeedbackAnalytics, Feedback } from "@/types";

export interface FeedbackSummaryRespondent {
  userName: string;
  userEmail?: string;
  userPhone?: string;
  rating: number;
  comments: string;
}

export interface FeedbackSummaryRow {
  eventDate: string;
  eventDateLabel: string;
  sessionName: string;
  avgRating: number;
  responseCount: number;
  respondents: FeedbackSummaryRespondent[];
}

export interface FeedbackTableRow {
  eventDate: string;
  eventName: string;
  sessionName: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  rating: number;
  comments: string;
}

export interface FeedbackHighlightCount {
  rating: 1 | 2 | 3 | 4 | 5;
  label: string;
  count: number;
}

export interface FeedbackSessionResponse {
  id: string;
  userName: string;
  rating: number;
  comments: string;
}

export interface FeedbackSessionSummary {
  key: string;
  sessionTitle: string;
  scheduleItemId?: string;
  responseCount: number;
  avgRating: number;
  responses: FeedbackSessionResponse[];
}

export interface FeedbackRespondentRow {
  id: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  sessionTitle: string;
  rating: number;
  roundedRating: number;
  comments: string;
  submittedAt: string;
}

export type FeedbackRatingFilter = "all" | 1 | 2 | 3 | 4 | 5;

export interface FeedbackFilters {
  userName: string;
  sessionName: string;
  eventName: string;
  eventDate: string;
}

export const ALL_FEEDBACK_FILTER = "all";

export function formatStarRatingDisplay(rating: number): string {
  if (rating <= 0) return "No Rating";
  return "*".repeat(Math.round(rating));
}

export function buildFeedbackSummaryRows(feedback: Feedback[]): FeedbackSummaryRow[] {
  if (feedback.length === 0) return [];

  const grouped = new Map<
    string,
    {
      eventDate: string;
      sessionName: string;
      total: number;
      count: number;
      respondents: FeedbackSummaryRespondent[];
    }
  >();

  for (const item of feedback) {
    const eventDate = item.sessionDate || "unknown";
    const sessionName = item.sessionTitle || "Session";
    const key = `${eventDate}|${sessionName}`;
    const existing = grouped.get(key) ?? {
      eventDate,
      sessionName,
      total: 0,
      count: 0,
      respondents: [],
    };
    existing.total += item.rating;
    existing.count += 1;
    existing.respondents.push({
      userName: item.userName,
      userEmail: item.userEmail,
      userPhone: item.userPhone,
      rating: item.rating,
      comments: item.comments,
    });
    grouped.set(key, existing);
  }

  return [...grouped.values()]
    .sort((a, b) => {
      const dateCompare = a.eventDate.localeCompare(b.eventDate);
      if (dateCompare !== 0) return dateCompare;
      return a.sessionName.localeCompare(b.sessionName);
    })
    .map((group) => ({
      eventDate: group.eventDate,
      eventDateLabel: formatFeedbackEventDate(group.eventDate),
      sessionName: getFeedbackSessionDisplayName(group.sessionName),
      avgRating: Math.round((group.total / group.count) * 10) / 10,
      responseCount: group.count,
      respondents: group.respondents,
    }));
}

export function buildFeedbackTableRows(feedback: Feedback[]): FeedbackTableRow[] {
  return feedback.map((item) => ({
    eventDate: formatFeedbackEventDate(item.sessionDate),
    eventName: item.eventName,
    sessionName: getFeedbackSessionDisplayName(item.sessionTitle, item.eventName),
    userName: item.userName,
    userEmail: item.userEmail,
    userPhone: item.userPhone,
    rating: item.rating,
    comments: item.comments,
  }));
}

function getFeedbackSessionGroupKey(item: Feedback): string {
  if (item.scheduleItemId?.trim()) return `schedule:${item.scheduleItemId.trim()}`;
  return `title:${getFeedbackSessionDisplayName(item.sessionTitle, item.eventName)}`;
}

/** Highlight count cards for rounded ratings 5★–1★. */
export function buildFeedbackHighlightCounts(feedback: Feedback[]): FeedbackHighlightCount[] {
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const item of feedback) {
    const rounded = Math.round(item.rating);
    if (rounded >= 1 && rounded <= 5) {
      counts[rounded as 1 | 2 | 3 | 4 | 5] += 1;
    }
  }

  return ([5, 4, 3, 2, 1] as const).map((rating) => ({
    rating,
    label: `${rating} star`,
    count: counts[rating],
  }));
}

export function buildAnalyticsFeedbackHighlightCounts(
  analytics: EventFeedbackAnalytics,
): FeedbackHighlightCount[] {
  return ([5, 4, 3, 2, 1] as const).map((rating) => ({
    rating,
    label: `${rating} star`,
    count: Number(
      analytics.overall.ratingDistribution[`${rating}.0`]
        ?? analytics.overall.ratingDistribution[String(rating)]
        ?? 0,
    ),
  }));
}

export function buildAnalyticsFeedbackSessionSummaries(
  analytics: EventFeedbackAnalytics,
  feedback: Feedback[],
): FeedbackSessionSummary[] {
  return analytics.bySession
    .map((session) => {
      const responses = feedback
        .filter(
          (item) =>
            item.scheduleItemId === session.scheduleItemId
            || (!item.scheduleItemId && item.sessionTitle === session.title),
        )
        .map((item) => ({
          id: item.id,
          userName: item.userName,
          rating: item.rating,
          comments: item.comments.trim(),
        }));

      return {
        key: `schedule:${session.scheduleItemId}`,
        sessionTitle: session.title,
        scheduleItemId: session.scheduleItemId,
        responseCount: session.totalFeedback,
        avgRating: session.averageRating,
        responses,
      };
    })
    .sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return a.sessionTitle.localeCompare(b.sessionTitle);
    });
}

/** Per-session averages sorted highest first. */
export function buildFeedbackSessionSummaries(feedback: Feedback[]): FeedbackSessionSummary[] {
  const grouped = new Map<
    string,
    {
      key: string;
      sessionTitle: string;
      scheduleItemId?: string;
      total: number;
      count: number;
      responses: FeedbackSessionResponse[];
    }
  >();

  for (const item of feedback) {
    const key = getFeedbackSessionGroupKey(item);
    const sessionTitle = getFeedbackSessionDisplayName(item.sessionTitle, item.eventName);
    const existing = grouped.get(key) ?? {
      key,
      sessionTitle,
      scheduleItemId: item.scheduleItemId,
      total: 0,
      count: 0,
      responses: [],
    };
    existing.total += item.rating;
    existing.count += 1;
    existing.responses.push({
      id: item.id,
      userName: item.userName,
      rating: item.rating,
      comments: item.comments.trim(),
    });
    grouped.set(key, existing);
  }

  return [...grouped.values()]
    .map((group) => ({
      key: group.key,
      sessionTitle: group.sessionTitle,
      scheduleItemId: group.scheduleItemId,
      responseCount: group.count,
      avgRating: Math.round((group.total / group.count) * 10) / 10,
      responses: group.responses,
    }))
    .sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return a.sessionTitle.localeCompare(b.sessionTitle);
    });
}

/** Flat respondent rows for the details table. */
export function buildFeedbackRespondentRows(feedback: Feedback[]): FeedbackRespondentRow[] {
  return [...feedback]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => ({
      id: item.id,
      userName: item.userName,
      userEmail: item.userEmail,
      userPhone: item.userPhone,
      sessionTitle: getFeedbackSessionDisplayName(item.sessionTitle, item.eventName),
      rating: item.rating,
      roundedRating: Math.round(item.rating),
      comments: item.comments.trim(),
      submittedAt: formatDateTime(item.createdAt),
    }));
}

export function filterFeedbackByRating(
  rows: FeedbackRespondentRow[],
  filter: FeedbackRatingFilter,
): FeedbackRespondentRow[] {
  if (filter === "all") return rows;
  return rows.filter((row) => row.roundedRating === filter);
}

export function filterFeedback(
  feedback: Feedback[],
  filters: FeedbackFilters,
): Feedback[] {
  return feedback.filter((item) => {
    if (filters.userName !== ALL_FEEDBACK_FILTER && item.userName !== filters.userName) {
      return false;
    }
    if (filters.eventName !== ALL_FEEDBACK_FILTER && item.eventName !== filters.eventName) {
      return false;
    }
    if (filters.eventDate !== ALL_FEEDBACK_FILTER && item.sessionDate !== filters.eventDate) {
      return false;
    }
    if (filters.sessionName !== ALL_FEEDBACK_FILTER) {
      const displayName = getFeedbackSessionDisplayName(item.sessionTitle, item.eventName);
      if (item.sessionTitle !== filters.sessionName && displayName !== filters.sessionName) {
        return false;
      }
    }
    return true;
  });
}

export function getFeedbackFilterOptions(feedback: Feedback[]) {
  const userNames = [...new Set(feedback.map((item) => item.userName))].sort();
  const eventNames = [...new Set(feedback.map((item) => item.eventName))].sort();
  const sessionNames = [
    ...new Set(
      feedback.map((item) => getFeedbackSessionDisplayName(item.sessionTitle, item.eventName)),
    ),
  ].sort();
  const eventDates = [
    ...new Set(feedback.map((item) => item.sessionDate)),
  ].sort();

  return { userNames, eventNames, sessionNames, eventDates };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function composeUserName(user: Record<string, unknown> | null): string {
  if (!user) return "";
  const full = pickString(user.full_name, user.fullName, user.name, user.user_name, user.username);
  if (full) return full;
  const first = pickString(user.first_name, user.firstName);
  const last = pickString(user.last_name, user.lastName);
  const combined = [first, last].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  return pickString(user.email);
}

/** Map `GET /events/feedback/` row → app `Feedback` (supports current + enriched fields). */
export function mapApiFeedbackToFeedback(raw: unknown): Feedback {
  const row = asRecord(raw) ?? {};
  const dayRecord =
    asRecord(row.day) ??
    asRecord(row.event_day) ??
    asRecord(row.event_date_detail) ??
    asRecord(row.event_date_obj);
  const scheduleRecord =
    asRecord(row.schedule_item) ??
    asRecord(row.session) ??
    asRecord(row.schedule_item_detail);
  const userRecord =
    asRecord(row.user) ??
    asRecord(row.user_details) ??
    asRecord(row.created_by) ??
    asRecord(row.submitted_by);

  const eventDayId = pickString(
    row.event_date,
    dayRecord?.id,
    row.event_day_id,
    row.day_id,
  );
  const scheduleItemId = pickString(
    typeof row.schedule_item === "object" ? undefined : row.schedule_item,
    scheduleRecord?.id,
    row.schedule_item_id,
    row.session_id,
  );

  const isOverallRating = Boolean(
    row.is_overall_rating ?? row.isOverallRating ?? false,
  );

  const sessionDate = pickString(
    row.event_day_date,
    dayRecord?.date,
    row.day_date,
    row.session_date,
    row.date,
  );

  const isDayOverall =
    isOverallRating
    && Boolean(sessionDate)
    && sessionDate !== "overall"
    && !scheduleItemId;

  const sessionTitle = isDayOverall
    ? FEEDBACK_DAY_OVERALL_TITLE
    : isOverallRating
      ? pickString(
          row.schedule_item_title,
          row.session_name,
          row.session_title,
          FEEDBACK_EVENT_OVERALL_TITLE,
        ) || FEEDBACK_EVENT_OVERALL_TITLE
      : pickString(
          row.schedule_item_title,
          row.session_name,
          row.session_title,
          scheduleRecord?.title,
          scheduleRecord?.name,
          scheduleItemId ? `Session ${scheduleItemId}` : "",
        ) || "Session";

  const userName =
    pickString(row.user_full_name, row.user_name, row.userName) ||
    composeUserName(userRecord) ||
    "Attendee";
  const userEmail = pickString(
    row.user_email,
    row.email,
    userRecord?.email,
    userRecord?.user_email,
  );
  const userPhone = pickString(
    row.user_phone,
    row.phone,
    userRecord?.phone,
    userRecord?.mobile,
    userRecord?.phone_number,
  );

  const userId = pickString(
    row.user_id,
    row.userId,
    typeof row.user === "object" ? undefined : row.user,
    userRecord?.id,
    userRecord?.pk,
  );

  return {
    id: pickString(row.id) || `fb-${Date.now()}`,
    userId: userId || "unknown",
    userName,
    userEmail: userEmail || undefined,
    userPhone: userPhone || undefined,
    eventId: pickString(
      typeof row.event === "object" ? undefined : row.event,
      row.event_id,
      asRecord(row.event)?.id,
    ) || DEFAULT_FEEDBACK_EVENT_ID,
    eventName:
      pickString(
        row.event_title,
        row.event_name,
        asRecord(row.event)?.title,
        asRecord(row.event)?.name,
      ) || DEFAULT_FEEDBACK_EVENT_NAME,
    sessionDate: sessionDate || (isOverallRating ? "overall" : eventDayId),
    sessionTitle,
    rating: Number(row.rating ?? 0),
    comments: pickString(row.comment, row.comments),
    createdAt: pickString(row.created_at, row.createdAt) || new Date().toISOString(),
    eventDayId: eventDayId || undefined,
    scheduleItemId: scheduleItemId || undefined,
    isOverallRating,
  };
}

export function mapApiFeedbackList(data: unknown): Feedback[] {
  if (Array.isArray(data)) {
    return data.map(mapApiFeedbackToFeedback);
  }
  const root = asRecord(data);
  const results = root && Array.isArray(root.results) ? root.results : [];
  return results.map(mapApiFeedbackToFeedback);
}

export function extractFeedbackTotalPages(data: unknown): number {
  const root = asRecord(data);
  const total = Number(root?.total_pages ?? 1);
  return Number.isFinite(total) && total > 0 ? total : 1;
}

/** `POST /events/feedback/` body — `schedule_item` omitted for day overall feedback. */
export interface CreateEventFeedbackPayload {
  event: number;
  event_date: number;
  schedule_item?: number;
  rating: number;
  comment: string;
  /** `true` for day overall ratings (no schedule_item). */
  is_overall_rating?: boolean;
}

/** `PUT /events/feedback/:id/` — same body as create. */
export type UpdateEventFeedbackPayload = CreateEventFeedbackPayload;

export interface FeedbackUpsertPayloads {
  creates: CreateEventFeedbackPayload[];
  updates: { id: string; payload: UpdateEventFeedbackPayload }[];
}

function toPositiveIntId(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${label} for feedback submission`);
  }
  return parsed;
}

function toFeedbackPayload(
  event: number,
  eventDayId: string,
  rating: number,
  comments: string,
  options?: { scheduleItemId?: string; isOverallRating?: boolean },
): CreateEventFeedbackPayload {
  const payload: CreateEventFeedbackPayload = {
    event,
    event_date: toPositiveIntId(eventDayId, "event day"),
    rating,
    comment: comments.trim(),
  };
  if (options?.scheduleItemId?.trim()) {
    payload.schedule_item = toPositiveIntId(options.scheduleItemId, "schedule item");
  }
  if (options?.isOverallRating) {
    payload.is_overall_rating = true;
  }
  return payload;
}

/** Map rated sessions + day overall rows to create and update payloads. */
export function mapStreamingFeedbackToUpsertPayloads(
  data: {
    sessions: Record<
      string,
      {
        sessionId: string;
        eventDayId: string;
        rating: number;
        comments: string;
        feedbackId?: string;
      }
    >;
    dailyOverall: Record<
      string,
      {
        eventDayId: string;
        rating: number;
        comments: string;
        feedbackId?: string;
      }
    >;
  },
  eventId: string,
): FeedbackUpsertPayloads {
  const event = toPositiveIntId(eventId, "event");
  const creates: CreateEventFeedbackPayload[] = [];
  const updates: { id: string; payload: UpdateEventFeedbackPayload }[] = [];

  for (const session of Object.values(data.sessions)) {
    if (session.rating <= 0) continue;
    if (!session.sessionId.trim() || !session.eventDayId.trim()) {
      throw new Error(
        "Session feedback is missing day or schedule item ids. Please reload and try again.",
      );
    }
    const payload = toFeedbackPayload(
      event,
      session.eventDayId,
      session.rating,
      session.comments,
      { scheduleItemId: session.sessionId },
    );
    if (session.feedbackId?.trim()) {
      updates.push({ id: session.feedbackId.trim(), payload });
    } else {
      creates.push(payload);
    }
  }

  for (const dayOverall of Object.values(data.dailyOverall)) {
    if (dayOverall.rating <= 0) continue;
    if (!dayOverall.eventDayId.trim()) {
      throw new Error(
        "Day overall feedback is missing the event day id. Please reload and try again.",
      );
    }
    const payload = toFeedbackPayload(
      event,
      dayOverall.eventDayId,
      dayOverall.rating,
      dayOverall.comments,
      { isOverallRating: true },
    );
    if (dayOverall.feedbackId?.trim()) {
      updates.push({ id: dayOverall.feedbackId.trim(), payload });
    } else {
      creates.push(payload);
    }
  }

  return { creates, updates };
}

/** @deprecated Prefer `mapStreamingFeedbackToUpsertPayloads` (supports PUT updates). */
export function mapStreamingFeedbackToCreatePayloads(
  data: {
    sessions: Record<
      string,
      {
        sessionId: string;
        eventDayId: string;
        rating: number;
        comments: string;
        feedbackId?: string;
      }
    >;
    dailyOverall: Record<
      string,
      {
        eventDayId: string;
        rating: number;
        comments: string;
        feedbackId?: string;
      }
    >;
  },
  eventId: string,
): CreateEventFeedbackPayload[] {
  return mapStreamingFeedbackToUpsertPayloads(data, eventId).creates;
}

/** Pre-fill streaming feedback form from `GET /events/feedback/` rows for this user/day. */
export function mergeExistingFeedbackIntoForm(
  form: StreamingFeedbackFormValues,
  existing: Feedback[],
): StreamingFeedbackFormValues {
  const next: StreamingFeedbackFormValues = {
    sessions: { ...form.sessions },
    dailyOverall: { ...form.dailyOverall },
    eventOverall: { ...form.eventOverall },
  };

  for (const item of existing) {
    if (item.isOverallRating) {
      const isDayOverall =
        item.sessionTitle === FEEDBACK_DAY_OVERALL_TITLE
        || (
          Boolean(item.sessionDate)
          && item.sessionDate !== "overall"
          && !item.scheduleItemId
        );

      if (isDayOverall && item.sessionDate && next.dailyOverall[item.sessionDate]) {
        next.dailyOverall[item.sessionDate] = {
          rating: item.rating,
          comments: item.comments,
          eventDayId:
            item.eventDayId || next.dailyOverall[item.sessionDate].eventDayId,
          feedbackId: item.id,
        };
        continue;
      }

      if (
        item.sessionDate === "overall"
        || item.sessionTitle === FEEDBACK_EVENT_OVERALL_TITLE
      ) {
        next.eventOverall = { rating: item.rating, comments: item.comments };
      }
      continue;
    }

    const scheduleId = item.scheduleItemId?.trim();
    if (scheduleId && next.sessions[scheduleId]) {
      next.sessions[scheduleId] = {
        ...next.sessions[scheduleId],
        rating: item.rating,
        comments: item.comments,
        eventDayId: item.eventDayId || next.sessions[scheduleId].eventDayId,
        feedbackId: item.id,
      };
    }
  }

  return next;
}

/** ISO dates that already have saved day-overall feedback (read-only in form). */
export function getSubmittedDailyOverallDates(existing: Feedback[]): Set<string> {
  const dates = new Set<string>();
  for (const item of existing) {
    if (!item.isOverallRating || item.scheduleItemId) continue;
    if (item.sessionDate && item.sessionDate !== "overall") {
      dates.add(item.sessionDate);
    }
  }
  return dates;
}

/** Session schedule-item ids that already have saved feedback (read-only in form). */
export function getSubmittedFeedbackSessionIds(existing: Feedback[]): Set<string> {
  const ids = new Set<string>();
  for (const item of existing) {
    if (item.isOverallRating) continue;
    const scheduleId = item.scheduleItemId?.trim();
    if (scheduleId) ids.add(scheduleId);
  }
  return ids;
}


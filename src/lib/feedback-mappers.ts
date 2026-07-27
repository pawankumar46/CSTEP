import {
  DEFAULT_FEEDBACK_EVENT_ID,
  DEFAULT_FEEDBACK_EVENT_NAME,
  FEEDBACK_EVENT_OVERALL_TITLE,
  formatFeedbackEventDate,
  getFeedbackSessionDisplayName,
} from "@/lib/feedback-options";
import type { Feedback } from "@/types";

export interface FeedbackSummaryRespondent {
  userName: string;
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
  rating: number;
  comments: string;
}

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
    rating: item.rating,
    comments: item.comments,
  }));
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

  const sessionTitle = isOverallRating
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

/** `POST /events/feedback/` body */
export interface CreateEventFeedbackPayload {
  event: number;
  event_date: number;
  schedule_item: number;
  rating: number;
  comment: string;
}

function toPositiveIntId(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${label} for feedback submission`);
  }
  return parsed;
}

/** Map rated sessions to `POST /events/feedback/` payloads (one per rated schedule item). */
export function mapStreamingFeedbackToCreatePayloads(
  data: {
    sessions: Record<
      string,
      {
        sessionId: string;
        eventDayId: string;
        rating: number;
        comments: string;
      }
    >;
  },
  eventId: string,
): CreateEventFeedbackPayload[] {
  const event = toPositiveIntId(eventId, "event");
  const payloads: CreateEventFeedbackPayload[] = [];

  for (const session of Object.values(data.sessions)) {
    if (session.rating <= 0) continue;
    if (!session.sessionId.trim() || !session.eventDayId.trim()) {
      throw new Error(
        "Session feedback is missing day or schedule item ids. Please reload and try again.",
      );
    }
    payloads.push({
      event,
      event_date: toPositiveIntId(session.eventDayId, "event day"),
      schedule_item: toPositiveIntId(session.sessionId, "schedule item"),
      rating: session.rating,
      comment: session.comments.trim(),
    });
  }

  return payloads;
}


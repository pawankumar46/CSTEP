import {
  DEFAULT_FEEDBACK_EVENT_NAME,
  FEEDBACK_DATE_OPTIONS,
  FEEDBACK_DAY_OVERALL_TITLE,
  FEEDBACK_EVENT_OVERALL_TITLE,
  FEEDBACK_SESSIONS_BY_DATE,
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
  const eventNames =
    feedback.length > 0
      ? [...new Set(feedback.map((item) => item.eventName))]
      : [DEFAULT_FEEDBACK_EVENT_NAME];

  const rows: FeedbackSummaryRow[] = [];

  for (const eventName of eventNames) {
    const eventFeedback = feedback.filter((item) => item.eventName === eventName);
    const grouped = new Map<
      string,
      { total: number; count: number; respondents: FeedbackSummaryRespondent[] }
    >();

    for (const item of eventFeedback) {
      const key = `${item.sessionDate}|${item.sessionTitle}`;
      const existing = grouped.get(key) ?? { total: 0, count: 0, respondents: [] };
      existing.total += item.rating;
      existing.count += 1;
      existing.respondents.push({
        userName: item.userName,
        rating: item.rating,
        comments: item.comments,
      });
      grouped.set(key, existing);
    }

    for (const dateOption of FEEDBACK_DATE_OPTIONS) {
      const sessions = FEEDBACK_SESSIONS_BY_DATE[dateOption.value] ?? [];

      for (const session of sessions) {
        const key = `${dateOption.value}|${session.title}`;
        const stats = grouped.get(key);
        rows.push({
          eventDate: dateOption.value,
          eventDateLabel: formatFeedbackEventDate(dateOption.value),
          sessionName: session.title,
          avgRating: stats ? Math.round((stats.total / stats.count) * 10) / 10 : 0,
          responseCount: stats?.count ?? 0,
          respondents: stats?.respondents ?? [],
        });
      }

      const dayOverallKey = `${dateOption.value}|${FEEDBACK_DAY_OVERALL_TITLE}`;
      const dayOverallStats = grouped.get(dayOverallKey);
      rows.push({
        eventDate: dateOption.value,
        eventDateLabel: formatFeedbackEventDate(dateOption.value),
        sessionName: FEEDBACK_DAY_OVERALL_TITLE,
        avgRating: dayOverallStats
          ? Math.round((dayOverallStats.total / dayOverallStats.count) * 10) / 10
          : 0,
        responseCount: dayOverallStats?.count ?? 0,
        respondents: dayOverallStats?.respondents ?? [],
      });
    }

    const eventOverallKey = `overall|${FEEDBACK_EVENT_OVERALL_TITLE}`;
    const eventOverallStats = grouped.get(eventOverallKey);
    rows.push({
      eventDate: "overall",
      eventDateLabel: "—",
      sessionName: getFeedbackSessionDisplayName(FEEDBACK_EVENT_OVERALL_TITLE, eventName),
      avgRating: eventOverallStats
        ? Math.round((eventOverallStats.total / eventOverallStats.count) * 10) / 10
        : 0,
      responseCount: eventOverallStats?.count ?? 0,
      respondents: eventOverallStats?.respondents ?? [],
    });
  }

  return rows;
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

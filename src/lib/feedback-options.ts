export interface FeedbackSessionOption {
  id: string;
  title: string;
  time: string;
}

export interface FeedbackDateOption {
  value: string;
  label: string;
}

export const FEEDBACK_DAY_OVERALL_TITLE = "Overall";
export const FEEDBACK_EVENT_OVERALL_TITLE = "Overall Event";
export const DEFAULT_FEEDBACK_EVENT_ID = "evt-icas-2026";
export const DEFAULT_FEEDBACK_EVENT_NAME = "ICAS";

export const FEEDBACK_DATE_OPTIONS: FeedbackDateOption[] = [
  { value: "2026-08-19", label: "19 Aug 2026" },
  { value: "2026-08-20", label: "20 Aug 2026" },
  { value: "2026-08-21", label: "21 Aug 2026" },
];

export const FEEDBACK_SESSIONS_BY_DATE: Record<string, FeedbackSessionOption[]> = {
  "2026-08-19": [
    { id: "ses-d1-1", title: "Session 1", time: "09:00 AM" },
    { id: "ses-d1-2", title: "Session 2", time: "10:30 AM" },
    { id: "ses-d1-3", title: "Session 3", time: "12:00 PM" },
    { id: "ses-d1-4", title: "Session 4", time: "02:00 PM" },
  ],
  "2026-08-20": [
    { id: "ses-d2-1", title: "Session 1", time: "09:00 AM" },
    { id: "ses-d2-2", title: "Session 2", time: "10:30 AM" },
    { id: "ses-d2-3", title: "Session 3", time: "12:00 PM" },
    { id: "ses-d2-4", title: "Session 4", time: "02:00 PM" },
  ],
  "2026-08-21": [
    { id: "ses-d3-1", title: "Session 1", time: "09:00 AM" },
    { id: "ses-d3-2", title: "Session 2", time: "10:30 AM" },
    { id: "ses-d3-3", title: "Session 3", time: "12:00 PM" },
    { id: "ses-d3-4", title: "Session 4", time: "02:00 PM" },
  ],
};

export function getFeedbackSessionsForDate(date: string): FeedbackSessionOption[] {
  return FEEDBACK_SESSIONS_BY_DATE[date] ?? [];
}

export function formatFeedbackEventDate(date: string): string {
  if (date === "overall") return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function getFeedbackDateLabel(date: string): string {
  if (date === "overall") return "Overall Event";
  return FEEDBACK_DATE_OPTIONS.find((option) => option.value === date)?.label ?? date;
}

export function getFeedbackSessionDisplayName(
  sessionTitle: string,
  eventName?: string,
): string {
  if (sessionTitle === FEEDBACK_EVENT_OVERALL_TITLE) {
    return `${DEFAULT_FEEDBACK_EVENT_NAME} / ${FEEDBACK_EVENT_OVERALL_TITLE}`;
  }
  return sessionTitle;
}

export function resolveFeedbackEventName(_eventName?: string | null): string {
  return DEFAULT_FEEDBACK_EVENT_NAME;
}

export function resolveFeedbackEventId(eventId?: string | null): string {
  return eventId?.trim() || DEFAULT_FEEDBACK_EVENT_ID;
}

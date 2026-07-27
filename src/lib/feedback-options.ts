export interface FeedbackSessionOption {
  id: string;
  title: string;
  time: string;
}

export interface FeedbackDateOption {
  value: string;
  label: string;
  /** Event-day id for `GET /events/schedule-items/?day=` */
  dayId?: string;
}

export const FEEDBACK_DAY_OVERALL_TITLE = "Overall";
export const FEEDBACK_EVENT_OVERALL_TITLE = "Overall Event";
/** Default ICAS event id for feedback day tabs (`GET /events/event-days/dropdown/`). */
export const DEFAULT_FEEDBACK_EVENT_ID = "11";
export const DEFAULT_FEEDBACK_EVENT_NAME = "ICAS";

/** Fallback when event-days dropdown is unavailable. */
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }
  if (/^\d+$/.test(date)) return `Day ${date}`;
  return date;
}

export function formatFeedbackEventDateLong(date: string): string {
  if (date === "overall") return "Overall Event";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatFeedbackSessionTime(value: string): string {
  const [hh = "0", mm = "0"] = value.split(":");
  const hour = Number(hh);
  const minute = Number(mm);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function formatFeedbackSessionTimeRange(startTime: string, endTime: string): string {
  return `${formatFeedbackSessionTime(startTime)} – ${formatFeedbackSessionTime(endTime)}`;
}

/** Map `GET /events/event-days/dropdown/` rows into feedback day tabs (sorted by date). */
export function mapEventDaysToFeedbackDateOptions(
  days: Array<{ id?: string | number; date: string }>,
): FeedbackDateOption[] {
  return [...days]
    .filter((day) => Boolean(day.date?.trim()))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => ({
      value: day.date.trim(),
      label: formatFeedbackEventDateLong(day.date.trim()),
      dayId: day.id != null && String(day.id).trim() ? String(day.id) : undefined,
    }));
}

/** Map `GET /events/schedule-items/?day=` rows into feedback session list. */
export function mapScheduleItemsToFeedbackSessions(
  items: Array<{
    id: string;
    itemType: string;
    title: string;
    startTime: string;
    endTime: string;
  }>,
): FeedbackSessionOption[] {
  return [...items]
    .filter((item) => item.title.trim())
    .filter((item) => {
      const type = item.itemType.trim().toUpperCase();
      return !type || type === "SESSION";
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((item) => ({
      id: String(item.id),
      title: item.title.trim(),
      time: formatFeedbackSessionTimeRange(item.startTime, item.endTime),
    }));
}

export function getFeedbackDateLabel(date: string): string {
  if (date === "overall") return "Overall Event";
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return (
      FEEDBACK_DATE_OPTIONS.find((option) => option.value === date)?.label ??
      formatFeedbackEventDateLong(date)
    );
  }
  // Fallback when API has not yet returned a calendar date (only day id).
  if (/^\d+$/.test(date)) return `Day ${date}`;
  return date;
}

export function getFeedbackSessionDisplayName(
  sessionTitle: string,
  _eventName?: string,
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
  const trimmed = eventId?.trim();
  if (!trimmed || trimmed.startsWith("evt-")) return DEFAULT_FEEDBACK_EVENT_ID;
  return trimmed;
}

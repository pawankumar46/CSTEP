import { z } from "zod";
import {
  FEEDBACK_DATE_OPTIONS,
  FEEDBACK_SESSIONS_BY_DATE,
  type FeedbackDateOption,
  type FeedbackSessionOption,
} from "@/lib/feedback-options";

const ratingEntrySchema = z.object({
  rating: z.number().min(0).max(5),
  comments: z.string(),
});

const dailyOverallEntrySchema = ratingEntrySchema.extend({
  /** Event day id for `POST /events/feedback/` `event_date` (day overall — no schedule_item). */
  eventDayId: z.string(),
  /** Existing feedback id for `PUT /events/feedback/:id/`. */
  feedbackId: z.string().optional(),
});

const sessionEntrySchema = z.object({
  sessionId: z.string(),
  sessionTitle: z.string(),
  sessionDate: z.string(),
  /** Event-day id for `POST /events/feedback/` `event_date` */
  eventDayId: z.string(),
  rating: z.number().min(0).max(5),
  comments: z.string(),
  /** Existing feedback id for `PUT /events/feedback/:id/`. */
  feedbackId: z.string().optional(),
});

export const streamingFeedbackSchema = z
  .object({
    sessions: z.record(z.string(), sessionEntrySchema),
    dailyOverall: z.record(z.string(), dailyOverallEntrySchema),
    eventOverall: ratingEntrySchema,
  })
  .superRefine((data, ctx) => {
    const ratedSessions = Object.values(data.sessions).filter(
      (session) => session.rating >= 1,
    );
    const ratedDailyOverall = Object.values(data.dailyOverall).filter(
      (day) => day.rating >= 1,
    );
    if (ratedSessions.length === 0 && ratedDailyOverall.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please rate at least one session or day overall before submitting",
        path: ["sessions"],
      });
    }

    for (const session of ratedSessions) {
      if (!session.eventDayId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Session day is missing. Switch tabs to reload sessions, then try again.",
          path: ["sessions", session.sessionId, "eventDayId"],
        });
      }
    }

    for (const day of ratedDailyOverall) {
      if (!day.eventDayId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Day overall is missing the event day id. Please reload and try again.",
          path: ["dailyOverall"],
        });
      }
    }

    if (
      data.eventOverall.rating >= 1 &&
      data.eventOverall.comments.trim().length < 10
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please provide at least 10 characters for overall event feedback",
        path: ["eventOverall", "comments"],
      });
    }
  });

export type StreamingFeedbackFormValues = z.infer<typeof streamingFeedbackSchema>;

export type SessionFeedbackEntry = StreamingFeedbackFormValues["sessions"][string];

export function buildDefaultStreamingFeedbackForm(
  dates: string[] = FEEDBACK_DATE_OPTIONS.map((option) => option.value),
  sessionsByDate: Record<string, FeedbackSessionOption[]> = {},
  dayIdByDate: Record<string, string> = {},
): StreamingFeedbackFormValues {
  const sessions: Record<string, SessionFeedbackEntry> = {};
  const dailyOverall: Record<string, { rating: number; comments: string; eventDayId: string }> =
    {};

  for (const date of dates) {
    dailyOverall[date] = { rating: 0, comments: "", eventDayId: dayIdByDate[date] ?? "" };
    const sessionList =
      sessionsByDate[date] ?? FEEDBACK_SESSIONS_BY_DATE[date] ?? [];
    for (const session of sessionList) {
      sessions[session.id] = {
        sessionId: session.id,
        sessionTitle: session.title,
        sessionDate: date,
        eventDayId: "",
        rating: 0,
        comments: "",
      };
    }
  }

  return {
    sessions,
    dailyOverall,
    eventOverall: { rating: 0, comments: "" },
  };
}

export function getStreamingFeedbackDayTabs(
  dateOptions: FeedbackDateOption[] = FEEDBACK_DATE_OPTIONS,
) {
  return dateOptions.map((option) => ({
    value: option.value,
    label: option.label,
    dayId: option.dayId,
  }));
}

import { z } from "zod";
import {
  FEEDBACK_DATE_OPTIONS,
  FEEDBACK_SESSIONS_BY_DATE,
} from "@/lib/feedback-options";

const ratingEntrySchema = z.object({
  rating: z.number().min(0).max(5),
  comments: z.string(),
});

const sessionEntrySchema = z.object({
  sessionId: z.string(),
  sessionTitle: z.string(),
  sessionDate: z.string(),
  rating: z.number().min(0).max(5),
  comments: z.string(),
});

export const streamingFeedbackSchema = z
  .object({
    sessions: z.record(z.string(), sessionEntrySchema),
    dailyOverall: z.record(z.string(), ratingEntrySchema),
    eventOverall: ratingEntrySchema,
  })
  .superRefine((data, ctx) => {
    if (data.eventOverall.rating < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please rate your overall event experience",
        path: ["eventOverall", "rating"],
      });
    }

    if (data.eventOverall.comments.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please provide at least 10 characters for overall event feedback",
        path: ["eventOverall", "comments"],
      });
    }
  });

export type StreamingFeedbackFormValues = z.infer<typeof streamingFeedbackSchema>;

export type SessionFeedbackEntry = StreamingFeedbackFormValues["sessions"][string];

export function buildDefaultStreamingFeedbackForm(): StreamingFeedbackFormValues {
  const sessions: Record<string, SessionFeedbackEntry> = {};
  const dailyOverall: Record<string, { rating: number; comments: string }> = {};

  for (const [date, sessionList] of Object.entries(FEEDBACK_SESSIONS_BY_DATE)) {
    dailyOverall[date] = { rating: 0, comments: "" };
    for (const session of sessionList) {
      sessions[session.id] = {
        sessionId: session.id,
        sessionTitle: session.title,
        sessionDate: date,
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

export function getStreamingFeedbackDayTabs() {
  return FEEDBACK_DATE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));
}

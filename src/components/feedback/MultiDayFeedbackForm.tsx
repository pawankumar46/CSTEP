"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { StarRatingInput } from "@/components/shared/StarRatingInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildDefaultStreamingFeedbackForm,
  getStreamingFeedbackDayTabs,
  streamingFeedbackSchema,
  type StreamingFeedbackFormValues,
} from "@/features/feedback/streaming-feedback.schema";
import {
  FEEDBACK_DAY_OVERALL_TITLE,
  FEEDBACK_EVENT_OVERALL_TITLE,
  FEEDBACK_SESSIONS_BY_DATE,
  resolveFeedbackEventName,
} from "@/lib/feedback-options";

import type { Feedback } from "@/types";

interface MultiDayFeedbackFormProps {
  onSubmit: (data: StreamingFeedbackFormValues) => Promise<void>;
  isSubmitting?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
  submitLabel?: string;
}

export function MultiDayFeedbackForm({
  onSubmit,
  isSubmitting = false,
  showSkip = false,
  onSkip,
  submitLabel = "Submit Feedback",
}: MultiDayFeedbackFormProps) {
  const dayTabs = useMemo(() => getStreamingFeedbackDayTabs(), []);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StreamingFeedbackFormValues>({
    resolver: zodResolver(streamingFeedbackSchema),
    defaultValues: buildDefaultStreamingFeedbackForm(),
  });

  const sessions = watch("sessions");
  const dailyOverall = watch("dailyOverall");
  const eventOverall = watch("eventOverall");

  const updateSession = (
    sessionId: string,
    field: "rating" | "comments",
    value: number | string,
  ) => {
    const current = sessions[sessionId];
    if (!current) return;
    setValue(
      "sessions",
      {
        ...sessions,
        [sessionId]: { ...current, [field]: value },
      },
      { shouldValidate: true },
    );
  };

  const updateDailyOverall = (
    date: string,
    field: "rating" | "comments",
    value: number | string,
  ) => {
    const current = dailyOverall[date] ?? { rating: 0, comments: "" };
    setValue(
      "dailyOverall",
      {
        ...dailyOverall,
        [date]: { ...current, [field]: value },
      },
      { shouldValidate: true },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Tabs defaultValue={dayTabs[0]?.value} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          {dayTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label.replace(" 2026", "")}
            </TabsTrigger>
          ))}
          <TabsTrigger value="event-overall">ICAS Overall</TabsTrigger>
        </TabsList>

        {dayTabs.map((tab) => {
          const dayOverall = dailyOverall[tab.value] ?? { rating: 0, comments: "" };

          return (
            <TabsContent key={tab.value} value={tab.value} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Rate sessions you attended on {tab.label}.
              </p>
              <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                {(FEEDBACK_SESSIONS_BY_DATE[tab.value] ?? []).map((session) => {
                  const entry = sessions[session.id];
                  if (!entry) return null;

                  return (
                    <div key={session.id} className="space-y-2 rounded-lg border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{session.title}</p>
                          <p className="text-xs text-muted-foreground">{session.time}</p>
                        </div>
                        <StarRatingInput
                          size="sm"
                          value={entry.rating}
                          onChange={(rating) => updateSession(session.id, "rating", rating)}
                        />
                      </div>
                      <Textarea
                        value={entry.comments}
                        onChange={(event) =>
                          updateSession(session.id, "comments", event.target.value)
                        }
                        placeholder="Comments (optional)"
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 rounded-lg border border-dashed bg-muted/30 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{FEEDBACK_DAY_OVERALL_TITLE}</p>
                    <p className="text-xs text-muted-foreground">Overall for {tab.label}</p>
                  </div>
                  <StarRatingInput
                    size="sm"
                    value={dayOverall.rating}
                    onChange={(rating) => updateDailyOverall(tab.value, "rating", rating)}
                  />
                </div>
                <Textarea
                  value={dayOverall.comments}
                  onChange={(event) =>
                    updateDailyOverall(tab.value, "comments", event.target.value)
                  }
                  placeholder="Overall comments for this day (optional)"
                  rows={2}
                  className="text-sm"
                />
              </div>
            </TabsContent>
          );
        })}

        <TabsContent value="event-overall" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share your overall experience for ICAS across all three event days.
          </p>
          <div className="space-y-2">
            <Label>ICAS / {FEEDBACK_EVENT_OVERALL_TITLE}</Label>
            <StarRatingInput
              value={eventOverall.rating}
              onChange={(rating) =>
                setValue(
                  "eventOverall",
                  { ...eventOverall, rating },
                  { shouldValidate: true },
                )
              }
            />
            {errors.eventOverall?.rating && (
              <p className="text-xs text-destructive">{errors.eventOverall.rating.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-overall-comments">Comments</Label>
            <Textarea
              id="event-overall-comments"
              value={eventOverall.comments}
              onChange={(event) =>
                setValue(
                  "eventOverall",
                  { ...eventOverall, comments: event.target.value },
                  { shouldValidate: true },
                )
              }
              placeholder="How was the event overall? Logistics, content, networking..."
              rows={4}
            />
            {errors.eventOverall?.comments && (
              <p className="text-xs text-destructive">{errors.eventOverall.comments.message}</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {showSkip && onSkip && (
          <Button type="button" variant="ghost" onClick={onSkip} disabled={isSubmitting}>
            Skip for now
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Submitting..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function mapStreamingFeedbackToEntries(
  data: StreamingFeedbackFormValues,
  meta: {
    userId: string;
    userName: string;
    eventId: string;
    eventName: string;
  },
) {
  const entries: Omit<Feedback, "id" | "createdAt">[] = [];
  const eventName = resolveFeedbackEventName(meta.eventName);

  for (const session of Object.values(data.sessions)) {
    if (session.rating <= 0) continue;
    entries.push({
      userId: meta.userId,
      userName: meta.userName,
      eventId: meta.eventId,
      eventName,
      sessionDate: session.sessionDate,
      sessionTitle: session.sessionTitle,
      rating: session.rating,
      comments: session.comments.trim(),
    });
  }

  for (const [date, dayOverall] of Object.entries(data.dailyOverall)) {
    if (dayOverall.rating <= 0) continue;
    entries.push({
      userId: meta.userId,
      userName: meta.userName,
      eventId: meta.eventId,
      eventName,
      sessionDate: date,
      sessionTitle: FEEDBACK_DAY_OVERALL_TITLE,
      rating: dayOverall.rating,
      comments: dayOverall.comments.trim(),
    });
  }

  entries.push({
    userId: meta.userId,
    userName: meta.userName,
    eventId: meta.eventId,
    eventName,
    sessionDate: "overall",
    sessionTitle: FEEDBACK_EVENT_OVERALL_TITLE,
    rating: data.eventOverall.rating,
    comments: data.eventOverall.comments.trim(),
  });

  return entries;
}

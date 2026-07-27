"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  FEEDBACK_DATE_OPTIONS,
  FEEDBACK_DAY_OVERALL_TITLE,
  FEEDBACK_EVENT_OVERALL_TITLE,
  FEEDBACK_SESSIONS_BY_DATE,
  formatFeedbackEventDate,
  mapEventDaysToFeedbackDateOptions,
  mapScheduleItemsToFeedbackSessions,
  resolveFeedbackEventId,
  resolveFeedbackEventName,
  type FeedbackDateOption,
  type FeedbackSessionOption,
} from "@/lib/feedback-options";
import { getEventDaysDropdown, getScheduleItems } from "@/services/event.service";
import type { Feedback } from "@/types";

interface MultiDayFeedbackFormProps {
  eventId?: string;
  onSubmit: (data: StreamingFeedbackFormValues) => Promise<void>;
  isSubmitting?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
  submitLabel?: string;
}

export function MultiDayFeedbackForm({
  eventId,
  onSubmit,
  isSubmitting = false,
  showSkip = false,
  onSkip,
  submitLabel = "Submit Feedback",
}: MultiDayFeedbackFormProps) {
  const resolvedEventId = resolveFeedbackEventId(eventId);
  const [dateOptions, setDateOptions] = useState<FeedbackDateOption[]>([]);
  const [daysLoading, setDaysLoading] = useState(true);
  const [daysError, setDaysError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [sessionsByDate, setSessionsByDate] = useState<
    Record<string, FeedbackSessionOption[]>
  >({});
  const [sessionsLoadingByDate, setSessionsLoadingByDate] = useState<
    Record<string, boolean>
  >({});
  const [sessionsErrorByDate, setSessionsErrorByDate] = useState<
    Record<string, string | null>
  >({});
  const fetchedSessionDatesRef = useRef<Set<string>>(new Set());

  const dayTabs = useMemo(() => getStreamingFeedbackDayTabs(dateOptions), [dateOptions]);
  const tabColumns = Math.min(Math.max(dayTabs.length + 1, 2), 4);

  const {
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<StreamingFeedbackFormValues>({
    resolver: zodResolver(streamingFeedbackSchema),
    defaultValues: buildDefaultStreamingFeedbackForm([]),
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setDaysLoading(true);
      setDaysError(null);
      fetchedSessionDatesRef.current = new Set();
      setSessionsByDate({});
      setSessionsLoadingByDate({});
      setSessionsErrorByDate({});
      try {
        const days = await getEventDaysDropdown(resolvedEventId);
        if (cancelled) return;
        const options = mapEventDaysToFeedbackDateOptions(days);
        const resolved = options.length > 0 ? options : FEEDBACK_DATE_OPTIONS;
        setDateOptions(resolved);
        setActiveTab(resolved[0]?.value ?? "event-overall");
        reset(
          buildDefaultStreamingFeedbackForm(
            resolved.map((option) => option.value),
            {},
          ),
        );
      } catch (err) {
        if (cancelled) return;
        setDaysError(err instanceof Error ? err.message : "Failed to load event days");
        setDateOptions(FEEDBACK_DATE_OPTIONS);
        setActiveTab(FEEDBACK_DATE_OPTIONS[0]?.value ?? "event-overall");
        reset(
          buildDefaultStreamingFeedbackForm(
            FEEDBACK_DATE_OPTIONS.map((option) => option.value),
            FEEDBACK_SESSIONS_BY_DATE,
          ),
        );
        setSessionsByDate(FEEDBACK_SESSIONS_BY_DATE);
      } finally {
        if (!cancelled) setDaysLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedEventId, reset]);

  useEffect(() => {
    if (!activeTab || activeTab === "event-overall") return;

    const dayOption = dateOptions.find((option) => option.value === activeTab);
    if (!dayOption) return;

    if (!dayOption.dayId) {
      if (!fetchedSessionDatesRef.current.has(activeTab)) {
        fetchedSessionDatesRef.current.add(activeTab);
        const fallback = FEEDBACK_SESSIONS_BY_DATE[activeTab] ?? [];
        setSessionsByDate((prev) => ({ ...prev, [activeTab]: fallback }));
        mergeSessionsIntoForm(activeTab, fallback, "");
      }
      return;
    }

    if (fetchedSessionDatesRef.current.has(activeTab)) return;

    let cancelled = false;
    setSessionsLoadingByDate((prev) => ({ ...prev, [activeTab]: true }));
    setSessionsErrorByDate((prev) => ({ ...prev, [activeTab]: null }));

    void (async () => {
      try {
        const items = await getScheduleItems(dayOption.dayId!);
        if (cancelled) return;
        const mapped = mapScheduleItemsToFeedbackSessions(items);
        fetchedSessionDatesRef.current.add(activeTab);
        setSessionsByDate((prev) => ({ ...prev, [activeTab]: mapped }));
        mergeSessionsIntoForm(activeTab, mapped, dayOption.dayId);
      } catch (err) {
        if (cancelled) return;
        setSessionsByDate((prev) => ({ ...prev, [activeTab]: [] }));
        setSessionsErrorByDate((prev) => ({
          ...prev,
          [activeTab]:
            err instanceof Error ? err.message : "Failed to load sessions for this day",
        }));
      } finally {
        if (!cancelled) {
          setSessionsLoadingByDate((prev) => ({ ...prev, [activeTab]: false }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // mergeSessionsIntoForm uses getValues/setValue; intentional deps below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateOptions]);

  const sessions = watch("sessions");
  const dailyOverall = watch("dailyOverall");
  const eventOverall = watch("eventOverall");

  function mergeSessionsIntoForm(
    date: string,
    sessionList: FeedbackSessionOption[],
    eventDayId = "",
  ) {
    const currentSessions = getValues("sessions");
    const nextSessions = { ...currentSessions };
    for (const session of sessionList) {
      const existing = nextSessions[session.id];
      nextSessions[session.id] = {
        sessionId: session.id,
        sessionTitle: session.title,
        sessionDate: date,
        eventDayId: eventDayId || existing?.eventDayId || "",
        rating: existing?.rating ?? 0,
        comments: existing?.comments ?? "",
      };
    }
    setValue("sessions", nextSessions, { shouldValidate: false });
  }

  const updateSession = (
    sessionId: string,
    field: "rating" | "comments",
    value: number | string,
  ) => {
    const current = sessions[sessionId];
    if (!current) return;
    setFormError(null);
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

  if (daysLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading event days…
      </div>
    );
  }

  if (dayTabs.length === 0) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        No event days are available for feedback yet.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(
        async (data) => {
          setFormError(null);
          try {
            await onSubmit(data);
          } catch (err) {
            setFormError(
              err instanceof Error ? err.message : "Failed to submit feedback",
            );
          }
        },
        (invalid) => {
          const sessionMessage =
            typeof invalid.sessions?.message === "string"
              ? invalid.sessions.message
              : null;
          const overallMessage =
            invalid.eventOverall?.comments?.message ??
            invalid.eventOverall?.rating?.message ??
            null;
          setFormError(
            sessionMessage ??
              overallMessage ??
              "Please rate at least one session, then submit again.",
          );
          if (overallMessage) setActiveTab("event-overall");
        },
      )}
      className="space-y-4"
    >
      {daysError && (
        <p className="text-xs text-muted-foreground">
          Could not load live event days ({daysError}). Showing default ICAS days.
        </p>
      )}

      <Tabs
        value={activeTab || dayTabs[0]?.value}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList
          className="grid w-full"
          style={{ gridTemplateColumns: `repeat(${tabColumns}, minmax(0, 1fr))` }}
        >
          {dayTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {formatFeedbackEventDate(tab.value)}
            </TabsTrigger>
          ))}
          <TabsTrigger value="event-overall">ICAS Overall</TabsTrigger>
        </TabsList>

        {dayTabs.map((tab) => {
          const dayOverall = dailyOverall[tab.value] ?? { rating: 0, comments: "" };
          const daySessions = sessionsByDate[tab.value] ?? [];
          const sessionsLoading = Boolean(sessionsLoadingByDate[tab.value]);
          const sessionsError = sessionsErrorByDate[tab.value];

          return (
            <TabsContent key={tab.value} value={tab.value} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Rate sessions you attended on {tab.label}.
              </p>
              <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                {sessionsLoading ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading sessions…
                  </div>
                ) : sessionsError ? (
                  <p className="text-sm text-destructive">{sessionsError}</p>
                ) : daySessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No sessions for this day — you can still rate the day overall.
                  </p>
                ) : (
                  daySessions.map((session) => {
                    const entry = sessions[session.id];
                    if (!entry) return null;

                    return (
                      <div key={session.id} className="space-y-2 rounded-lg border p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-sm font-medium leading-snug">{session.title}</p>
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
                  })
                )}
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
            Optional — share your overall experience for ICAS across all event days.
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

      {(formError ||
        (typeof errors.sessions?.message === "string" && errors.sessions.message)) && (
        <p className="text-sm text-destructive" role="alert">
          {formError ??
            (typeof errors.sessions?.message === "string" ? errors.sessions.message : null)}
        </p>
      )}

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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  getSubmittedDailyOverallDates,
  getSubmittedFeedbackSessionIds,
  mergeExistingFeedbackIntoForm,
} from "@/lib/feedback-mappers";
import {
  FEEDBACK_DATE_OPTIONS,
  FEEDBACK_DAY_OVERALL_TITLE,
  FEEDBACK_EVENT_OVERALL_TITLE,
  FEEDBACK_SESSIONS_BY_DATE,
  buildFeedbackOptionsFromRegistrationDays,
  formatFeedbackEventDate,
  mapEventDaysToFeedbackDateOptions,
  mapScheduleItemsToFeedbackSessions,
  resolveFeedbackEventId,
  resolveFeedbackEventName,
  type FeedbackDateOption,
  type FeedbackSessionOption,
} from "@/lib/feedback-options";
import { getEventDaysDropdown, getScheduleItems } from "@/services/event.service";
import { getUserFeedbackForRegisteredDays } from "@/services/feedback.service";
import { getRegistrations } from "@/services/registration.service";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
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
  const user = useAuthStore((s) => s.user);
  const resolvedEventId = resolveFeedbackEventId(eventId);
  const [dateOptions, setDateOptions] = useState<FeedbackDateOption[]>([]);
  const [daysLoading, setDaysLoading] = useState(true);
  const [daysError, setDaysError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [submittedSessionIds, setSubmittedSessionIds] = useState<Set<string>>(new Set());
  const [submittedDailyOverallDates, setSubmittedDailyOverallDates] = useState<Set<string>>(
    new Set(),
  );
  const [editingSessionIds, setEditingSessionIds] = useState<Set<string>>(new Set());
  const [editingDailyOverallDates, setEditingDailyOverallDates] = useState<Set<string>>(
    new Set(),
  );
  const submittedSessionSnapshotRef = useRef<
    Record<string, { rating: number; comments: string }>
  >({});
  const submittedDailySnapshotRef = useRef<
    Record<string, { rating: number; comments: string }>
  >({});
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
        const [eventDays, registrations] = await Promise.all([
          getEventDaysDropdown(resolvedEventId).catch(() => []),
          getRegistrations().catch(() => []),
        ]);
        if (cancelled) return;

        const registration = registrations.find(
          (entry) => String(entry.eventId) === String(resolvedEventId),
        );
        const registeredDays = registration?.days ?? [];

        let resolved: FeedbackDateOption[];
        let initialSessionsByDate: Record<string, FeedbackSessionOption[]> = {};
        let dayIdByDate: Record<string, string> = {};

        if (registeredDays.length > 0) {
          const fromRegistration = buildFeedbackOptionsFromRegistrationDays(registeredDays);
          resolved = fromRegistration.dateOptions;
          initialSessionsByDate = fromRegistration.sessionsByDate;
          dayIdByDate = fromRegistration.dayIdByDate;
        } else {
          const options = mapEventDaysToFeedbackDateOptions(eventDays);
          resolved = options.length > 0 ? options : FEEDBACK_DATE_OPTIONS;
          dayIdByDate = Object.fromEntries(
            resolved
              .filter((option) => option.dayId)
              .map((option) => [option.value, option.dayId!]),
          );
        }

        setDateOptions(resolved);
        setSessionsByDate(initialSessionsByDate);
        for (const date of Object.keys(initialSessionsByDate)) {
          fetchedSessionDatesRef.current.add(date);
        }

        const defaultForm = buildDefaultStreamingFeedbackForm(
          resolved.map((option) => option.value),
          initialSessionsByDate,
          dayIdByDate,
        );
        let formValues = defaultForm;

        for (const [date, sessionList] of Object.entries(initialSessionsByDate)) {
          formValues = mergeSessionsIntoFormValues(
            formValues,
            date,
            sessionList,
            dayIdByDate[date] ?? "",
          );
        }

        if (user?.id) {
          const eventDateIds = resolved
            .map((option) => option.dayId)
            .filter((dayId): dayId is string => Boolean(dayId?.trim()));
          if (eventDateIds.length > 0) {
            const existing = await getUserFeedbackForRegisteredDays(
              resolvedEventId,
              String(user.id),
              eventDateIds,
            );
            if (cancelled) return;
            formValues = mergeExistingFeedbackIntoForm(formValues, existing);
            setSubmittedSessionIds(getSubmittedFeedbackSessionIds(existing));
            setSubmittedDailyOverallDates(getSubmittedDailyOverallDates(existing));
            setEditingSessionIds(new Set());
            setEditingDailyOverallDates(new Set());

            const sessionSnapshots: Record<string, { rating: number; comments: string }> = {};
            const dailySnapshots: Record<string, { rating: number; comments: string }> = {};
            for (const [sessionId, entry] of Object.entries(formValues.sessions)) {
              if (entry.feedbackId) {
                sessionSnapshots[sessionId] = {
                  rating: entry.rating,
                  comments: entry.comments,
                };
              }
            }
            for (const [date, entry] of Object.entries(formValues.dailyOverall)) {
              if (entry.feedbackId) {
                dailySnapshots[date] = {
                  rating: entry.rating,
                  comments: entry.comments,
                };
              }
            }
            submittedSessionSnapshotRef.current = sessionSnapshots;
            submittedDailySnapshotRef.current = dailySnapshots;
          }
        }

        setActiveTab(resolved[0]?.value ?? "event-overall");
        reset(formValues);
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
    // mergeSessionsIntoForm uses getValues/setValue; intentional deps below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedEventId, reset, user?.id]);

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

  function mergeSessionsIntoFormValues(
    form: StreamingFeedbackFormValues,
    date: string,
    sessionList: FeedbackSessionOption[],
    eventDayId = "",
  ): StreamingFeedbackFormValues {
    const nextSessions = { ...form.sessions };
    for (const session of sessionList) {
      const existing = nextSessions[session.id];
      nextSessions[session.id] = {
        sessionId: session.id,
        sessionTitle: session.title,
        sessionDate: date,
        eventDayId: eventDayId || existing?.eventDayId || "",
        rating: existing?.rating ?? 0,
        comments: existing?.comments ?? "",
        feedbackId: existing?.feedbackId,
      };
    }
    return { ...form, sessions: nextSessions };
  }

  function mergeSessionsIntoForm(
    date: string,
    sessionList: FeedbackSessionOption[],
    eventDayId = "",
  ) {
    const current = getValues();
    const next = mergeSessionsIntoFormValues(current, date, sessionList, eventDayId);
    setValue("sessions", next.sessions, { shouldValidate: false });
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
    const current = dailyOverall[date] ?? { rating: 0, comments: "", eventDayId: "" };
    setValue(
      "dailyOverall",
      {
        ...dailyOverall,
        [date]: { ...current, [field]: value },
      },
      { shouldValidate: true },
    );
  };

  const startEditSession = (sessionId: string) => {
    setEditingSessionIds((prev) => new Set(prev).add(sessionId));
    setFormError(null);
  };

  const cancelEditSession = (sessionId: string) => {
    const snapshot = submittedSessionSnapshotRef.current[sessionId];
    const current = getValues(`sessions.${sessionId}`);
    if (snapshot && current) {
      setValue(
        "sessions",
        {
          ...getValues("sessions"),
          [sessionId]: {
            ...current,
            rating: snapshot.rating,
            comments: snapshot.comments,
          },
        },
        { shouldValidate: true },
      );
    }
    setEditingSessionIds((prev) => {
      const next = new Set(prev);
      next.delete(sessionId);
      return next;
    });
  };

  const startEditDailyOverall = (date: string) => {
    setEditingDailyOverallDates((prev) => new Set(prev).add(date));
    setFormError(null);
  };

  const cancelEditDailyOverall = (date: string) => {
    const snapshot = submittedDailySnapshotRef.current[date];
    const current = getValues(`dailyOverall.${date}`);
    if (snapshot && current) {
      setValue(
        "dailyOverall",
        {
          ...getValues("dailyOverall"),
          [date]: {
            ...current,
            rating: snapshot.rating,
            comments: snapshot.comments,
          },
        },
        { shouldValidate: true },
      );
    }
    setEditingDailyOverallDates((prev) => {
      const next = new Set(prev);
      next.delete(date);
      return next;
    });
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
            const pendingSessions = Object.fromEntries(
              Object.entries(data.sessions).filter(
                ([sessionId]) =>
                  !submittedSessionIds.has(sessionId) || editingSessionIds.has(sessionId),
              ),
            );
            const pendingDailyOverall = Object.fromEntries(
              Object.entries(data.dailyOverall).filter(
                ([date]) =>
                  !submittedDailyOverallDates.has(date) || editingDailyOverallDates.has(date),
              ),
            );
            const hasPending =
              Object.values(pendingSessions).some((session) => session.rating >= 1)
              || Object.values(pendingDailyOverall).some((day) => day.rating >= 1);
            if (!hasPending) {
              setFormError(
                "Nothing new to submit. Edit a submitted response or rate a new session.",
              );
              return;
            }
            await onSubmit({
              ...data,
              sessions: pendingSessions,
              dailyOverall: pendingDailyOverall,
            });
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
          const dayOverall = dailyOverall[tab.value] ?? {
            rating: 0,
            comments: "",
            eventDayId: tab.dayId ?? "",
          };
          const isDayOverallSubmitted = submittedDailyOverallDates.has(tab.value);
          const isDayOverallEditing = editingDailyOverallDates.has(tab.value);
          const isDayOverallLocked = isDayOverallSubmitted && !isDayOverallEditing;
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
                    const isSubmitted = submittedSessionIds.has(session.id);
                    const isEditing = editingSessionIds.has(session.id);
                    const isLocked = isSubmitted && !isEditing;

                    return (
                      <div
                        key={session.id}
                        className={cn(
                          "space-y-2 rounded-lg border p-3",
                          isSubmitted
                            && "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20",
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium leading-snug">{session.title}</p>
                              {isSubmitted && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Submitted
                                </Badge>
                              )}
                              {isSubmitted && !isEditing && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => startEditSession(session.id)}
                                >
                                  Edit
                                </Button>
                              )}
                              {isEditing && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => cancelEditSession(session.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{session.time}</p>
                          </div>
                          <StarRatingInput
                            size="sm"
                            value={entry.rating}
                            disabled={isLocked}
                            onChange={(rating) => updateSession(session.id, "rating", rating)}
                          />
                        </div>
                        <Textarea
                          value={entry.comments}
                          disabled={isLocked}
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

              <div
                className={cn(
                  "space-y-2 rounded-lg border border-dashed bg-muted/30 p-3",
                  isDayOverallSubmitted
                    && "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{FEEDBACK_DAY_OVERALL_TITLE}</p>
                      {isDayOverallSubmitted && (
                        <Badge variant="secondary" className="text-[10px]">
                          Submitted
                        </Badge>
                      )}
                      {isDayOverallSubmitted && !isDayOverallEditing && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => startEditDailyOverall(tab.value)}
                        >
                          Edit
                        </Button>
                      )}
                      {isDayOverallEditing && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => cancelEditDailyOverall(tab.value)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Overall for {tab.label}</p>
                  </div>
                  <StarRatingInput
                    size="sm"
                    value={dayOverall.rating}
                    disabled={isDayOverallLocked}
                    onChange={(rating) => updateDailyOverall(tab.value, "rating", rating)}
                  />
                </div>
                <Textarea
                  value={dayOverall.comments}
                  disabled={isDayOverallLocked}
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

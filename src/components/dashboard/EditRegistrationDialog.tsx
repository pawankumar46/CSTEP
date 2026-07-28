"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ClipboardList, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatEventDateRange } from "@/lib/event-display";
import {
  buildParticipationDateOptionsFromEventDays,
  formatEventDayDateLabel,
} from "@/lib/participation-dates";
import {
  getAttendanceModeOptions,
  getSharedAttendanceModeOptions,
  normalizeAttendanceMode,
} from "@/lib/registration-options";
import {
  resolveRegistrationSessionsByDay,
  syncPhysicalDaySessions,
} from "@/lib/registration-sessions";
import { SessionScrollRow } from "@/components/shared/SessionScrollRow";
import { cn } from "@/lib/utils";
import {
  registrationEditSchema,
  EMPTY_REGISTRATION_EDIT,
  type RegistrationEditFormValues,
} from "@/features/dashboard/admin-registration.schema";
import { ICAS_CONFERENCE, isIcasEventName, sortEventDaysByDate } from "@/lib/icas-conference";
import {
  getEventDays,
  getScheduleItemsDropdown,
} from "@/services/event.service";
import {
  sessionCardClassName,
  sessionCheckboxClassName,
  sessionMetaClassName,
  sessionTimeChipClassName,
} from "@/lib/session-card-tones";
import { getLobbyRegistrationDetail } from "@/services/lobby.service";
import type { EventDay, ScheduleItemRecord } from "@/services/event.service";
import type { AttendanceMode, Event, Registration } from "@/types";

interface EditRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: Registration | null;
  events: Event[];
  eventsLoading?: boolean;
  defaultEventId?: string | null;
  /** When true, event cannot be changed (self-service edit). */
  lockEvent?: boolean;
  description?: string;
  onSubmit: (
    id: string,
    values: RegistrationEditFormValues,
    scheduleType?: "WHOLE_DAY" | "MULTI_SESSION",
  ) => Promise<void>;
}

function formatSessionTime(value: string): string {
  const [hh = "0", mm = "0"] = value.split(":");
  const hour = Number(hh);
  const minute = Number(mm);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function EditRegistrationDialog({
  open,
  onOpenChange,
  registration,
  events,
  eventsLoading = false,
  defaultEventId,
  lockEvent = false,
  description,
  onSubmit,
}: EditRegistrationDialogProps) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationEditFormValues>({
    resolver: zodResolver(registrationEditSchema),
    defaultValues: EMPTY_REGISTRATION_EDIT,
  });

  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [eventDaysLoading, setEventDaysLoading] = useState(false);
  const [eventDaysError, setEventDaysError] = useState<string | null>(null);
  const [scheduleItemsByDay, setScheduleItemsByDay] = useState<Record<string, ScheduleItemRecord[]>>({});
  const [scheduleLoadingByDay, setScheduleLoadingByDay] = useState<Record<string, boolean>>({});
  const [scheduleErrorByDay, setScheduleErrorByDay] = useState<Record<string, string | null>>({});
  const [daySelectionError, setDaySelectionError] = useState<string | null>(null);
  const [sessionSelectionError, setSessionSelectionError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");
  const fetchedScheduleDayIdsRef = useRef<Set<string>>(new Set());

  const selectedEventId = watch("eventId");
  const selectedDayIds = watch("selectedDayIds");
  const sessionsByDay = watch("sessionsByDay");
  const attendanceByDay = watch("attendanceByDay");
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );
  const isMultiSession = selectedEvent?.scheduleType === "MULTI_SESSION";
  const participationDateOptions = useMemo(
    () => buildParticipationDateOptionsFromEventDays(eventDays, false),
    [eventDays],
  );
  const selectedDays = useMemo(
    () => eventDays.filter((day) => selectedDayIds?.includes(day.id)),
    [eventDays, selectedDayIds],
  );
  const sharedAttendanceOptions = useMemo(
    () => getSharedAttendanceModeOptions(selectedDays),
    [selectedDays],
  );
  const getDayLabel = useCallback(
    (day: EventDay) =>
      participationDateOptions.find((option) => option.value === day.date)?.label
      ?? formatEventDayDateLabel(day.date),
    [participationDateOptions],
  );

  useEffect(() => {
    if (!open || !registration) return;

    const fallbackEventId =
      registration.eventId ||
      (defaultEventId && events.some((event) => event.id === defaultEventId)
        ? defaultEventId
        : events[0]?.id ?? "");

    reset({
      eventId: fallbackEventId,
      participationDate: "",
      selectedDayIds: [],
      selectedSessionIds: [],
      sessionsByDay: {},
      attendanceByDay: {},
      attendanceMode: registration.attendanceMode ?? "physical",
    });
    setDaySelectionError(null);
    setSessionSelectionError(null);
    setSubmitError(null);
    setErrorDialogOpen(false);
    setErrorDialogMessage("");
    setEventDays([]);
    setScheduleItemsByDay({});
    setScheduleLoadingByDay({});
    setScheduleErrorByDay({});
    fetchedScheduleDayIdsRef.current = new Set();
  }, [open, reset, registration, defaultEventId, events]);

  useEffect(() => {
    if (!open || !registration) return;

    let cancelled = false;

    (async () => {
      setDetailLoading(true);
      try {
        const detail = await getLobbyRegistrationDetail(registration.id);
        if (cancelled) return;

        const registrationEvent = events.find((event) => event.id === registration.eventId);
        const isMulti = registrationEvent?.scheduleType === "MULTI_SESSION";
        const dayIds = detail.selectedDayIds ?? [];

        if (isMulti && detail.days && detail.days.length > 0) {
          const nextSessionsByDay: Record<string, string[]> = {};
          const nextAttendanceByDay: Record<string, AttendanceMode> = {};
          const dayIdList: string[] = [];

          for (const day of detail.days) {
            if (!day.dayId) continue;
            dayIdList.push(day.dayId);
            nextSessionsByDay[day.dayId] = day.sessions
              .map((session) => session.scheduleItemId)
              .filter(Boolean);
            nextAttendanceByDay[day.dayId] = day.attendanceMode;
          }

          setValue("selectedDayIds", dayIdList);
          setValue("sessionsByDay", nextSessionsByDay);
          setValue("attendanceByDay", nextAttendanceByDay);
        } else {
          setValue("selectedDayIds", dayIds);
          setValue("attendanceMode", detail.attendanceMode ?? "physical");
        }
      } catch {
        // Keep list-row defaults if detail fetch fails.
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, registration, setValue, events]);

  useEffect(() => {
    if (!open || !selectedEventId) return;

    let cancelled = false;

    (async () => {
      setEventDaysLoading(true);
      setEventDaysError(null);
      try {
        const days = await getEventDays(selectedEventId);
        if (!cancelled) setEventDays(sortEventDaysByDate(days));
      } catch (err) {
        if (!cancelled) {
          setEventDays([]);
          setEventDaysError(err instanceof Error ? err.message : "Failed to load event days");
        }
      } finally {
        if (!cancelled) setEventDaysLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, selectedEventId]);

  useEffect(() => {
    if (!open || !isMultiSession) {
      fetchedScheduleDayIdsRef.current = new Set();
      return;
    }

    const dayIds = selectedDayIds ?? [];

    for (const id of fetchedScheduleDayIdsRef.current) {
      if (!dayIds.includes(id)) {
        fetchedScheduleDayIdsRef.current.delete(id);
      }
    }

    dayIds.forEach((dayId) => {
      if (fetchedScheduleDayIdsRef.current.has(dayId)) {
        return;
      }

      fetchedScheduleDayIdsRef.current.add(dayId);
      setScheduleLoadingByDay((prev) => ({ ...prev, [dayId]: true }));
      setScheduleErrorByDay((prev) => ({ ...prev, [dayId]: null }));

      void getScheduleItemsDropdown(dayId)
        .then((items) => {
          setScheduleItemsByDay((prev) => ({ ...prev, [dayId]: items }));
        })
        .catch((err) => {
          fetchedScheduleDayIdsRef.current.delete(dayId);
          setScheduleItemsByDay((prev) => ({ ...prev, [dayId]: [] }));
          setScheduleErrorByDay((prev) => ({
            ...prev,
            [dayId]: err instanceof Error ? err.message : "Failed to load sessions",
          }));
        })
        .finally(() => {
          setScheduleLoadingByDay((prev) => ({ ...prev, [dayId]: false }));
        });
    });
  }, [open, isMultiSession, selectedDayIds]);

  const autoSelectAllSessionsForDay = useCallback(
    (dayId: string, items: ScheduleItemRecord[]) => {
      const allIds = items.map((item) => item.id);
      const nextSessionsByDay = { ...(getValues("sessionsByDay") ?? {}) };
      nextSessionsByDay[dayId] = allIds;
      setValue("sessionsByDay", nextSessionsByDay, { shouldValidate: true });
    },
    [getValues, setValue],
  );

  useEffect(() => {
    if (!open || !isMultiSession || eventDays.length === 0) return;

    const dayIds = selectedDayIds ?? [];
    const nextAttendanceByDay = { ...(getValues("attendanceByDay") ?? {}) };
    let changed = false;

    for (const dayId of dayIds) {
      const day = eventDays.find((entry) => entry.id === dayId);
      if (!day) continue;

      const normalized = normalizeAttendanceMode(
        nextAttendanceByDay[dayId],
        day.allowedAttendanceModes,
      );
      if (nextAttendanceByDay[dayId] !== normalized) {
        nextAttendanceByDay[dayId] = normalized;
        changed = true;
      }
    }

    if (changed) {
      setValue("attendanceByDay", nextAttendanceByDay, { shouldValidate: true });
    }
  }, [open, eventDays, isMultiSession, selectedDayIds, getValues, setValue]);

  useEffect(() => {
    if (!open || !isMultiSession) return;

    const dayIds = selectedDayIds ?? [];
    const { sessionsByDay: nextSessionsByDay, changed } = syncPhysicalDaySessions(
      dayIds,
      attendanceByDay,
      sessionsByDay,
      scheduleItemsByDay,
      scheduleLoadingByDay,
    );

    if (changed) {
      setValue("sessionsByDay", nextSessionsByDay, { shouldValidate: true });
      setSessionSelectionError(null);
    }
  }, [
    open,
    isMultiSession,
    selectedDayIds,
    attendanceByDay,
    sessionsByDay,
    scheduleItemsByDay,
    scheduleLoadingByDay,
    setValue,
  ]);

  const toggleDay = (dayId: string) => {
    const current = getValues("selectedDayIds") ?? [];
    const isRemoving = current.includes(dayId);
    const next = isRemoving
      ? current.filter((id) => id !== dayId)
      : [...current, dayId];
    setValue("selectedDayIds", next, { shouldValidate: true });
    setDaySelectionError(null);

    if (isMultiSession) {
      const nextSessionsByDay = { ...(getValues("sessionsByDay") ?? {}) };
      const nextAttendanceByDay = { ...(getValues("attendanceByDay") ?? {}) };

      if (isRemoving) {
        delete nextSessionsByDay[dayId];
        delete nextAttendanceByDay[dayId];
      } else {
        const day = eventDays.find((entry) => entry.id === dayId);
        nextAttendanceByDay[dayId] = normalizeAttendanceMode(
          nextAttendanceByDay[dayId],
          day?.allowedAttendanceModes,
        );
        nextSessionsByDay[dayId] = nextSessionsByDay[dayId] ?? [];
      }

      setValue("sessionsByDay", nextSessionsByDay, { shouldValidate: true });
      setValue("attendanceByDay", nextAttendanceByDay, { shouldValidate: true });
    }
  };

  const toggleSessionForDay = (dayId: string, sessionId: string) => {
    const nextSessionsByDay = { ...(getValues("sessionsByDay") ?? {}) };
    const current = nextSessionsByDay[dayId] ?? [];
    nextSessionsByDay[dayId] = current.includes(sessionId)
      ? current.filter((id) => id !== sessionId)
      : [...current, sessionId];
    setValue("sessionsByDay", nextSessionsByDay, { shouldValidate: true });
    setSessionSelectionError(null);
  };

  const setDayAttendance = (dayId: string, mode: AttendanceMode) => {
    const nextAttendanceByDay = { ...(getValues("attendanceByDay") ?? {}) };
    nextAttendanceByDay[dayId] = mode;
    setValue("attendanceByDay", nextAttendanceByDay, { shouldValidate: true });

    if (mode === "physical") {
      const dayItems = scheduleItemsByDay[dayId] ?? [];
      if (dayItems.length > 0) {
        autoSelectAllSessionsForDay(dayId, dayItems);
      }
    } else if (mode === "virtual") {
      const nextSessionsByDay = { ...(getValues("sessionsByDay") ?? {}) };
      nextSessionsByDay[dayId] = [];
      setValue("sessionsByDay", nextSessionsByDay, { shouldValidate: true });
    }
  };

  const handleFormSubmit = async (values: RegistrationEditFormValues) => {
    if (!registration) return;

    setSubmitError(null);
    setDaySelectionError(null);
    setSessionSelectionError(null);

    if (isMultiSession) {
      const dayIdList = values.selectedDayIds ?? [];
      if (dayIdList.length === 0) {
        setDaySelectionError("Please select at least one day");
        return;
      }
      const sessionsMap = values.sessionsByDay ?? {};
      const attendanceMap = values.attendanceByDay ?? {};
      for (const dayId of dayIdList) {
        const mode = attendanceMap[dayId] ?? "physical";
        if (mode === "physical") continue;

        const dayItems = scheduleItemsByDay[dayId] ?? [];
        const selectedForDay = sessionsMap[dayId] ?? [];
        if (dayItems.length > 0 && selectedForDay.length === 0) {
          const day = eventDays.find((entry) => entry.id === dayId);
          setSessionSelectionError(
            `Please select at least one session for ${day ? getDayLabel(day) : "the selected day"}`,
          );
          return;
        }
      }
    } else if ((values.selectedDayIds?.length ?? 0) === 0) {
      setDaySelectionError("Please select at least one day");
      return;
    }

    try {
      let submitValues = values;
      if (isMultiSession) {
        const { sessionsByDay: syncedSessions, scheduleItemsByDay: loadedScheduleItems } =
          await resolveRegistrationSessionsByDay(
            values.selectedDayIds ?? [],
            values.attendanceByDay,
            values.sessionsByDay,
            scheduleItemsByDay,
          );

        setScheduleItemsByDay(loadedScheduleItems);
        setValue("sessionsByDay", syncedSessions, { shouldValidate: true });
        submitValues = { ...values, sessionsByDay: syncedSessions };
      }

      await onSubmit(
        registration.id,
        submitValues,
        selectedEvent?.scheduleType ?? "WHOLE_DAY",
      );
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update registration";
      setSubmitError(message);
      setErrorDialogMessage(message);
      setErrorDialogOpen(true);
    }
  };

  const clearErrorDialog = () => {
    setErrorDialogOpen(false);
    setErrorDialogMessage("");
    setSubmitError(null);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Edit registration
          </DialogTitle>
          <DialogDescription>
            {description
              ?? `Update event and participation details for ${registration?.userName ?? "this user"}.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(handleFormSubmit)(event)} className="space-y-4">
          <div className="space-y-2">
            <Label>Event</Label>
            {lockEvent ? (
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                {selectedEvent?.name
                  ?? (registration && isIcasEventName(registration.eventName ?? "")
                    ? ICAS_CONFERENCE.shortName
                    : null)
                  ?? (String(registration?.eventId) === "11"
                    ? ICAS_CONFERENCE.shortName
                    : null)
                  ?? (registration?.eventName?.trim() || `Event ${registration?.eventId ?? ""}`)}
              </p>
            ) : (
            <Controller
              name="eventId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue("selectedDayIds", []);
                    setValue("selectedSessionIds", []);
                    setValue("participationDate", "");
                    setValue("sessionsByDay", {});
                    setValue("attendanceByDay", {});
                    setScheduleItemsByDay({});
                    setScheduleLoadingByDay({});
                    setScheduleErrorByDay({});
                    fetchedScheduleDayIdsRef.current = new Set();
                  }}
                  disabled={eventsLoading || events.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={eventsLoading ? "Loading events..." : "Select an event"} />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                        {" · "}
                        {formatEventDateRange(event.date, event.endDate)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            )}
            {errors.eventId && (
              <p className="text-xs text-destructive">{errors.eventId.message}</p>
            )}
          </div>

          {detailLoading && (
            <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading current registration details…
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>{isMultiSession ? "Select Days & Sessions" : "Select Days"}</Label>
              {(selectedDayIds?.length ?? 0) > 0 && (
                <span className="text-xs text-muted-foreground">
                  {selectedDayIds?.length} selected
                </span>
              )}
            </div>
            {!selectedEventId ? (
              <p className="text-sm text-muted-foreground">Please select an event first.</p>
            ) : eventDaysLoading ? (
              <p className="text-sm text-muted-foreground">Loading event dates…</p>
            ) : eventDaysError ? (
              <p className="text-sm text-destructive">{eventDaysError}</p>
            ) : eventDays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No participation dates available for this event.</p>
            ) : (
              <div className="space-y-3">
                <div
                  className={cn(
                    "grid gap-3",
                    eventDays.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3",
                  )}
                >
                  {eventDays.map((day) => {
                    const isSelected = selectedDayIds?.includes(day.id) ?? false;
                    return (
                      <div
                        key={day.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onClick={() => toggleDay(day.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            toggleDay(day.id);
                          }
                        }}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            aria-hidden
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary shadow",
                              isSelected && "bg-primary text-primary-foreground",
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <p className="font-medium text-sm truncate">{getDayLabel(day)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground">Tap to select multiple days</p>
              </div>
            )}
            {daySelectionError && (
              <p className="text-xs text-destructive">{daySelectionError}</p>
            )}
          </div>

          {isMultiSession && selectedDays.length > 0 && (
            <div className="space-y-4">
              {selectedDays.map((day) => {
                const dayId = day.id;
                const dayItems = scheduleItemsByDay[dayId] ?? [];
                const selectedForDay = sessionsByDay?.[dayId] ?? [];
                const dayAttendance = normalizeAttendanceMode(
                  attendanceByDay?.[dayId],
                  day.allowedAttendanceModes,
                );
                const dayAttendanceOptions = getAttendanceModeOptions(day.allowedAttendanceModes);
                const loading = scheduleLoadingByDay[dayId];
                const error = scheduleErrorByDay[dayId];

                return (
                  <div key={dayId} className="space-y-3 rounded-xl border p-3 bg-card">
                    <h4 className="font-semibold text-sm">{getDayLabel(day)}</h4>

                    <div className="space-y-2">
                      <Label>Attendance mode</Label>
                      <Select
                        value={dayAttendance}
                        onValueChange={(value) => setDayAttendance(dayId, value as AttendanceMode)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dayAttendanceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {dayAttendance === "physical" ? (
                      <p className="text-sm text-muted-foreground">
                        On-site attendance includes all sessions for this day.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label>Select Sessions</Label>
                          {selectedForDay.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {selectedForDay.length} selected
                            </span>
                          )}
                        </div>
                        {loading ? (
                          <p className="text-sm text-muted-foreground">Loading sessions…</p>
                        ) : error ? (
                          <p className="text-sm text-destructive">{error}</p>
                        ) : dayItems.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No sessions available for this day.</p>
                        ) : (
                          <SessionScrollRow>
                            {dayItems.map((item, index) => {
                              const isSelected = selectedForDay.includes(item.id);
                              return (
                                <div
                                  key={item.id}
                                  role="button"
                                  tabIndex={0}
                                  aria-pressed={isSelected}
                                  onClick={() => toggleSessionForDay(dayId, item.id)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      toggleSessionForDay(dayId, item.id);
                                    }
                                  }}
                                  className={sessionCardClassName(index, isSelected, "sm")}
                                >
                                  <div className="p-3">
                                    <div className="flex items-start gap-2">
                                      <div
                                        aria-hidden
                                        className={sessionCheckboxClassName(index, isSelected)}
                                      >
                                        {isSelected && <Check className="h-3 w-3" />}
                                      </div>
                                      <div className="min-w-0 flex-1 space-y-2">
                                        <p className="font-medium text-sm line-clamp-2 text-foreground">
                                          {item.title}
                                        </p>
                                        <p className={sessionTimeChipClassName(index)}>
                                          {formatSessionTime(item.startTime)} - {formatSessionTime(item.endTime)}
                                        </p>
                                        {item.speakerName?.trim() && (
                                          <p
                                            className={cn(
                                              "text-xs inline-flex items-center gap-1",
                                              sessionMetaClassName(index),
                                            )}
                                          >
                                            <Mic className="h-3 w-3" />
                                            {item.speakerName.trim()}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </SessionScrollRow>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {sessionSelectionError && (
                <p className="text-xs text-destructive">{sessionSelectionError}</p>
              )}
            </div>
          )}

          {!isMultiSession && (
            <div className="space-y-2">
              <Label>Attendance mode</Label>
              <Controller
                name="attendanceMode"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select attendance mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {sharedAttendanceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.attendanceMode && (
                <p className="text-xs text-destructive">{errors.attendanceMode.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !registration || detailLoading}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={errorDialogOpen} onOpenChange={(next) => (next ? setErrorDialogOpen(true) : clearErrorDialog())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unable to update registration</DialogTitle>
          <DialogDescription>
            {errorDialogMessage || submitError || "Something went wrong. Please try again."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={clearErrorDialog}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

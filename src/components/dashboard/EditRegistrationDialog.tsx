"use client";

import { useEffect, useMemo, useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatEventDateRange } from "@/lib/event-display";
import { buildParticipationDateOptionsFromEventDays } from "@/lib/participation-dates";
import { ATTENDANCE_MODES } from "@/lib/registration-options";
import { SessionScrollRow } from "@/components/shared/SessionScrollRow";
import { cn } from "@/lib/utils";
import {
  registrationEditSchema,
  EMPTY_REGISTRATION_EDIT,
  type RegistrationEditFormValues,
} from "@/features/dashboard/admin-registration.schema";
import {
  getEventDays,
  getScheduleItemsDropdown,
} from "@/services/event.service";
import { getLobbyRegistrationDetail } from "@/services/lobby.service";
import type { EventDay, ScheduleItemRecord } from "@/services/event.service";
import type { Event, Registration } from "@/types";

interface EditRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: Registration | null;
  events: Event[];
  eventsLoading?: boolean;
  defaultEventId?: string | null;
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
  const [scheduleItems, setScheduleItems] = useState<ScheduleItemRecord[]>([]);
  const [scheduleItemsLoading, setScheduleItemsLoading] = useState(false);
  const [scheduleItemsError, setScheduleItemsError] = useState<string | null>(null);
  const [daySelectionError, setDaySelectionError] = useState<string | null>(null);
  const [sessionSelectionError, setSessionSelectionError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");

  const selectedEventId = watch("eventId");
  const participationDate = watch("participationDate");
  const selectedDayIds = watch("selectedDayIds");
  const selectedSessionIds = watch("selectedSessionIds");
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );
  const isMultiSession = selectedEvent?.scheduleType === "MULTI_SESSION";
  const participationDateOptions = useMemo(
    () => buildParticipationDateOptionsFromEventDays(eventDays, false),
    [eventDays],
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
      attendanceMode: registration.attendanceMode,
    });
    setDaySelectionError(null);
    setSessionSelectionError(null);
    setSubmitError(null);
    setErrorDialogOpen(false);
    setErrorDialogMessage("");
    setEventDays([]);
    setScheduleItems([]);
  }, [open, reset, registration, defaultEventId, events]);

  useEffect(() => {
    if (!open || !registration) return;

    let cancelled = false;

    (async () => {
      setDetailLoading(true);
      try {
        const detail = await getLobbyRegistrationDetail(registration.id);
        if (cancelled) return;

        const sessionIds = (detail.sessionRegistrations ?? [])
          .map((session) => session.scheduleItemId)
          .filter(Boolean);
        const dayIds = detail.selectedDayIds ?? [];
        const firstSessionDate = detail.sessionRegistrations?.[0]?.date ?? "";

        setValue("selectedDayIds", dayIds);
        setValue("selectedSessionIds", sessionIds);
        if (firstSessionDate) {
          setValue("participationDate", firstSessionDate);
        }
        setValue("attendanceMode", detail.attendanceMode);
      } catch {
        // Keep list-row defaults if detail fetch fails.
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, registration, setValue]);

  useEffect(() => {
    if (!open || !selectedEventId) return;

    let cancelled = false;

    (async () => {
      setEventDaysLoading(true);
      setEventDaysError(null);
      try {
        const days = await getEventDays(selectedEventId);
        if (!cancelled) setEventDays(days);
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
      setScheduleItems([]);
      setScheduleItemsError(null);
      return;
    }

    const selectedDay = eventDays.find((day) => day.date === participationDate);
    if (!selectedDay) {
      setScheduleItems([]);
      setScheduleItemsError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setScheduleItemsLoading(true);
      setScheduleItemsError(null);
      try {
        const items = await getScheduleItemsDropdown(selectedDay.id);
        if (!cancelled) setScheduleItems(items);
      } catch (err) {
        if (!cancelled) {
          setScheduleItems([]);
          setScheduleItemsError(err instanceof Error ? err.message : "Failed to load sessions");
        }
      } finally {
        if (!cancelled) setScheduleItemsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, isMultiSession, eventDays, participationDate]);

  useEffect(() => {
    if (!open || !isMultiSession || participationDateOptions.length === 0) return;
    const current = getValues("participationDate");
    const isValid = participationDateOptions.some((option) => option.value === current);
    if (!isValid) {
      setValue("participationDate", participationDateOptions[0].value);
    }
  }, [open, isMultiSession, participationDateOptions, getValues, setValue]);

  const toggleDay = (dayId: string) => {
    const current = getValues("selectedDayIds") ?? [];
    const next = current.includes(dayId)
      ? current.filter((id) => id !== dayId)
      : [...current, dayId];
    setValue("selectedDayIds", next, { shouldValidate: true });
    setDaySelectionError(null);
  };

  const toggleSession = (sessionId: string) => {
    const current = getValues("selectedSessionIds") ?? [];
    const next = current.includes(sessionId)
      ? current.filter((id) => id !== sessionId)
      : [...current, sessionId];
    setValue("selectedSessionIds", next, { shouldValidate: true });
    setSessionSelectionError(null);
  };

  const handleFormSubmit = async (values: RegistrationEditFormValues) => {
    if (!registration) return;

    setSubmitError(null);
    setDaySelectionError(null);
    setSessionSelectionError(null);

    if (isMultiSession) {
      if (!values.participationDate) {
        setSubmitError("Please select a participation date");
        return;
      }
      if (scheduleItems.length > 0 && (values.selectedSessionIds?.length ?? 0) === 0) {
        setSessionSelectionError("Please select at least one session");
        return;
      }
    } else if ((values.selectedDayIds?.length ?? 0) === 0) {
      setDaySelectionError("Please select at least one day");
      return;
    }

    try {
      await onSubmit(
        registration.id,
        values,
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
            Update event and participation details for {registration?.userName ?? "this user"}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(handleFormSubmit)(event)} className="space-y-4">
          <div className="space-y-2">
            <Label>Event</Label>
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
                    setScheduleItems([]);
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
              <Label>{isMultiSession ? "Date of Participation" : "Select Days"}</Label>
              {!isMultiSession && (selectedDayIds?.length ?? 0) > 0 && (
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
            ) : isMultiSession ? (
              <Controller
                name="participationDate"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      setValue("selectedSessionIds", []);
                    }}
                    value={field.value ?? ""}
                    className="flex flex-col gap-3"
                  >
                    {participationDateOptions.map((option) => (
                      <div key={option.value} className="flex items-center gap-2">
                        <RadioGroupItem value={option.value} id={`edit-date-${option.value}`} />
                        <Label htmlFor={`edit-date-${option.value}`} className="font-normal cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {eventDays.map((day) => {
                  const isSelected = selectedDayIds?.includes(day.id) ?? false;
                  const label =
                    day.label?.trim()
                    || participationDateOptions.find((option) => option.value === day.date)?.label
                    || day.date;
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
                      <div className="flex items-center gap-2">
                        <div
                          aria-hidden
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary shadow",
                            isSelected && "bg-primary text-primary-foreground",
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <p className="font-medium text-sm">{label}</p>
                      </div>
                    </div>
                  );
                })}
                <p className="text-[11px] text-muted-foreground">Tap to select multiple days</p>
              </div>
            )}
            {daySelectionError && (
              <p className="text-xs text-destructive">{daySelectionError}</p>
            )}
          </div>

          {isMultiSession && participationDate && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Select Sessions</Label>
                {(selectedSessionIds?.length ?? 0) > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {selectedSessionIds?.length} selected
                  </span>
                )}
              </div>
              {scheduleItemsLoading ? (
                <p className="text-sm text-muted-foreground">Loading sessions…</p>
              ) : scheduleItemsError ? (
                <p className="text-sm text-destructive">{scheduleItemsError}</p>
              ) : scheduleItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions available for this day.</p>
              ) : (
                <SessionScrollRow>
                  {scheduleItems.map((item) => {
                    const isSelected = selectedSessionIds?.includes(item.id) ?? false;
                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onClick={() => toggleSession(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            toggleSession(item.id);
                          }
                        }}
                        className={cn(
                          "min-w-[220px] max-w-[240px] snap-start rounded-xl border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        <div className="p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <div
                              aria-hidden
                              className={cn(
                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary shadow",
                                isSelected && "bg-primary text-primary-foreground",
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <p className="font-medium text-sm line-clamp-2 flex-1">{item.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground pl-6">
                            {formatSessionTime(item.startTime)} - {formatSessionTime(item.endTime)}
                          </p>
                          <p className="text-xs text-muted-foreground inline-flex items-center gap-1 pl-6">
                            <Mic className="h-3 w-3" />
                            {item.speakerName || "Speaker TBA"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </SessionScrollRow>
              )}
              {sessionSelectionError && (
                <p className="text-xs text-destructive">{sessionSelectionError}</p>
              )}
            </div>
          )}

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
                    {ATTENDANCE_MODES.map((option) => (
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

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Mic, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignupAddressFields } from "@/components/auth/SignupAddressFields";
import { SessionScrollRow } from "@/components/shared/SessionScrollRow";
import {
  addLobbyUserSchema,
  EMPTY_ADD_LOBBY_USER,
  LOBBY_USER_SALUTATIONS,
  type AddLobbyUserFormValues,
  type LobbyUserRegistrationFormValues,
  type LobbyUserSignupFormValues,
} from "@/features/dashboard/admin-lobby-user.schema";
import {
  buildParticipationDateOptionsFromEventDays,
  formatEventDayDateLabel,
} from "@/lib/participation-dates";
import { ATTENDANCE_MODES } from "@/lib/registration-options";
import { getEventDays, getScheduleItemsDropdown } from "@/services/event.service";
import { cn } from "@/lib/utils";
import type { EventDay, ScheduleItemRecord } from "@/services/event.service";
import type { AttendanceMode, Event } from "@/types";

interface AddLobbyUsersDialogProps {
  events: Event[];
  defaultEventId?: string | null;
  disabled?: boolean;
  onSignUp: (values: LobbyUserSignupFormValues) => Promise<string>;
  onRegister: (
    userId: string,
    values: LobbyUserRegistrationFormValues,
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

export function AddLobbyUsersDialog({
  events,
  defaultEventId,
  disabled = false,
  onSignUp,
  onRegister,
}: AddLobbyUsersDialogProps) {
  const [open, setOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitStep, setSubmitStep] = useState<"idle" | "signup" | "register">("idle");
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [eventDaysLoading, setEventDaysLoading] = useState(false);
  const [eventDaysError, setEventDaysError] = useState<string | null>(null);
  const [scheduleItemsByDay, setScheduleItemsByDay] = useState<Record<string, ScheduleItemRecord[]>>({});
  const [scheduleLoadingByDay, setScheduleLoadingByDay] = useState<Record<string, boolean>>({});
  const [scheduleErrorByDay, setScheduleErrorByDay] = useState<Record<string, string | null>>({});
  const [daySelectionError, setDaySelectionError] = useState<string | null>(null);
  const [sessionSelectionError, setSessionSelectionError] = useState<string | null>(null);
  const fetchedScheduleDayIdsRef = useRef<Set<string>>(new Set());

  const {
    control,
    handleSubmit,
    reset,
    watch,
    trigger,
    getValues,
    setValue,
    register,
    formState: { errors },
  } = useForm<AddLobbyUserFormValues>({
    resolver: zodResolver(addLobbyUserSchema),
    defaultValues: EMPTY_ADD_LOBBY_USER,
  });

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
  const getDayLabel = useCallback(
    (day: EventDay) =>
      participationDateOptions.find((option) => option.value === day.date)?.label
      ?? formatEventDayDateLabel(day.date),
    [participationDateOptions],
  );

  useEffect(() => {
    if (!open) return;

    const fallback =
      defaultEventId && events.some((event) => event.id === defaultEventId)
        ? defaultEventId
        : events[0]?.id ?? "";

    reset({
      ...EMPTY_ADD_LOBBY_USER,
      eventId: fallback,
    });
    setSubmitError(null);
    setWizardStep(1);
    setSubmitStep("idle");
    setCreatedUserId(null);
    setEventDays([]);
    setScheduleItemsByDay({});
    setScheduleLoadingByDay({});
    setScheduleErrorByDay({});
    fetchedScheduleDayIdsRef.current = new Set();
    setDaySelectionError(null);
    setSessionSelectionError(null);
  }, [open, defaultEventId, events, reset]);

  useEffect(() => {
    if (!selectedEventId || wizardStep !== 2) {
      return;
    }

    let cancelled = false;

    (async () => {
      setEventDaysLoading(true);
      setEventDaysError(null);
      setValue("selectedDayIds", []);
      setValue("selectedSessionIds", []);
      setValue("sessionsByDay", {});
      setValue("attendanceByDay", {});
      setValue("participationDate", "");
      setScheduleItemsByDay({});
      setScheduleLoadingByDay({});
      setScheduleErrorByDay({});
      fetchedScheduleDayIdsRef.current = new Set();
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
  }, [selectedEventId, wizardStep, setValue]);

  useEffect(() => {
    if (!isMultiSession || wizardStep !== 2) {
      fetchedScheduleDayIdsRef.current = new Set();
      setScheduleItemsByDay({});
      setScheduleLoadingByDay({});
      setScheduleErrorByDay({});
      return;
    }

    const dayIds = selectedDayIds ?? [];
    let cancelled = false;

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
          if (cancelled) return;
          setScheduleItemsByDay((prev) => ({ ...prev, [dayId]: items }));
        })
        .catch((err) => {
          if (cancelled) return;
          fetchedScheduleDayIdsRef.current.delete(dayId);
          setScheduleItemsByDay((prev) => ({ ...prev, [dayId]: [] }));
          setScheduleErrorByDay((prev) => ({
            ...prev,
            [dayId]: err instanceof Error ? err.message : "Failed to load sessions",
          }));
        })
        .finally(() => {
          if (cancelled) return;
          setScheduleLoadingByDay((prev) => ({ ...prev, [dayId]: false }));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [isMultiSession, wizardStep, selectedDayIds]);

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
        setScheduleItemsByDay((prev) => {
          const copy = { ...prev };
          delete copy[dayId];
          return copy;
        });
      } else {
        nextAttendanceByDay[dayId] = nextAttendanceByDay[dayId] ?? "physical";
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
  };

  const resetAndClose = () => {
    setSubmitError(null);
    setSubmitStep("idle");
    setWizardStep(1);
    setCreatedUserId(null);
    setEventDays([]);
    setScheduleItemsByDay({});
    setScheduleLoadingByDay({});
    setScheduleErrorByDay({});
    fetchedScheduleDayIdsRef.current = new Set();
    setDaySelectionError(null);
    setSessionSelectionError(null);
    setOpen(false);
  };

  const handleNextStep = async () => {
    setSubmitError(null);
    const valid = await trigger(
      [
        "salutation",
        "firstName",
        "middleName",
        "lastName",
        "phone",
        "email",
        "address",
        "password",
        "confirmPassword",
      ],
      { shouldFocus: true },
    );
    if (!valid) return;

    const signupValues = getValues();
    setSubmitStep("signup");

    try {
      const userId = await onSignUp({
        salutation: signupValues.salutation,
        firstName: signupValues.firstName,
        middleName: signupValues.middleName,
        lastName: signupValues.lastName,
        phone: signupValues.phone,
        email: signupValues.email,
        address: signupValues.address,
        password: signupValues.password,
        confirmPassword: signupValues.confirmPassword,
      });
      setCreatedUserId(userId);
      setWizardStep(2);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create user account");
    } finally {
      setSubmitStep("idle");
    }
  };

  const handleFormSubmit = async (values: AddLobbyUserFormValues) => {
    if (!createdUserId) return;

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
      for (const dayId of dayIdList) {
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

    const valid = await trigger(
      isMultiSession ? ["eventId"] : ["eventId", "attendanceMode"],
      { shouldFocus: true },
    );
    if (!valid) return;

    setSubmitStep("register");

    try {
      await onRegister(
        createdUserId,
        {
          eventId: values.eventId,
          selectedDayIds: values.selectedDayIds,
          selectedSessionIds: values.selectedSessionIds ?? [],
          sessionsByDay: values.sessionsByDay,
          attendanceByDay: values.attendanceByDay,
          attendanceMode: values.attendanceMode,
        },
        selectedEvent?.scheduleType ?? "WHOLE_DAY",
      );
      resetAndClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to register user for event");
    } finally {
      setSubmitStep("idle");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : resetAndClose())}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled || events.length === 0}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add user & register to event</DialogTitle>
          <DialogDescription>
            {wizardStep === 1
              ? "Step 1 of 2: Create the user account (signup details only)."
              : "Step 2 of 2: Register the user for an event."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(handleFormSubmit)(event)} className="space-y-4">
          {wizardStep === 1 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lobby-salutation">Salutation</Label>
                  <Controller
                    name="salutation"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="lobby-salutation">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LOBBY_USER_SALUTATIONS.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.salutation && (
                    <p className="text-xs text-destructive">{errors.salutation.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lobby-first-name">First name</Label>
                  <Controller
                    name="firstName"
                    control={control}
                    render={({ field }) => (
                      <Input id="lobby-first-name" placeholder="First name" {...field} />
                    )}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lobby-middle-name">Middle name (optional)</Label>
                <Controller
                  name="middleName"
                  control={control}
                  render={({ field }) => (
                    <Input id="lobby-middle-name" placeholder="Middle name" {...field} />
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lobby-last-name">Last name</Label>
                  <Controller
                    name="lastName"
                    control={control}
                    render={({ field }) => (
                      <Input id="lobby-last-name" placeholder="Last name" {...field} />
                    )}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lobby-phone">Phone</Label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <Input id="lobby-phone" placeholder="9999999999" {...field} />
                    )}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lobby-email">Email</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input id="lobby-email" type="email" placeholder="you@example.com" {...field} />
                  )}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <SignupAddressFields register={register} errors={errors} idPrefix="lobby" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lobby-password">Password</Label>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <PasswordInput id="lobby-password" placeholder="Password" {...field} />
                    )}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lobby-confirm-password">Confirm password</Label>
                  <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field }) => (
                      <PasswordInput
                        id="lobby-confirm-password"
                        placeholder="Confirm password"
                        {...field}
                      />
                    )}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {wizardStep === 2 && (
            <>
              <div className="space-y-2">
                <Label>Event</Label>
                <Controller
                  name="eventId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={events.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name}
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
                  <div className="flex flex-col gap-3">
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
                            <p className="font-medium text-sm">{getDayLabel(day)}</p>
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

              {isMultiSession && selectedDays.length > 0 && (
                <div className="space-y-4">
                  {selectedDays.map((day) => {
                    const dayId = day.id;
                    const dayItems = scheduleItemsByDay[dayId] ?? [];
                    const selectedForDay = sessionsByDay?.[dayId] ?? [];
                    const dayAttendance = attendanceByDay?.[dayId] ?? "physical";
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
                              {ATTENDANCE_MODES.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

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
                              {dayItems.map((item) => {
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
                        </div>
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
                  <Label htmlFor="lobby-attendance-mode">Attendance mode</Label>
                  <Controller
                    name="attendanceMode"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="lobby-attendance-mode">
                          <SelectValue />
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
                </div>
              )}
            </>
          )}

          {wizardStep === 2 && createdUserId && (
            <p className="text-sm text-emerald-700 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
              User account created. Choose registration options below.
            </p>
          )}

          {submitStep !== "idle" && (
            <p className="text-sm text-muted-foreground rounded-md border bg-muted/40 px-3 py-2">
              {submitStep === "signup"
                ? "Creating user account..."
                : "Registering for event..."}
            </p>
          )}

          {submitError && (
            <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
              {submitError}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {wizardStep === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={resetAndClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleNextStep()}
                  disabled={submitStep === "signup"}
                >
                  {submitStep === "signup" && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {submitStep === "signup" ? "Creating account..." : "Create account"}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={resetAndClose} disabled={submitStep === "register"}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!createdUserId || !selectedEventId || submitStep === "register"}
                >
                  {submitStep === "register" && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {submitStep === "register" ? "Registering..." : "Register"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

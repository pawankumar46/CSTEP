"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle, Check, Mic } from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { MultiStepForm } from "@/components/forms/MultiStepForm";
import { SessionScrollRow } from "@/components/shared/SessionScrollRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registrationSchema, REGISTRATION_STEPS, type RegistrationFormValues } from "@/features/registration/registration.schema";
import {
  ATTENDANCE_MODES,
  getRegistrationOptionLabel,
} from "@/lib/registration-options";
import {
  buildParticipationDateOptionsFromEventDays,
} from "@/lib/participation-dates";
import { EventRegisterGuard } from "@/components/auth/EventRegisterGuard";
import { useAuthStore } from "@/store/useAuthStore";
import { AlreadyRegisteredError } from "@/services/registration.service";
import { getEventDays, getEventDropdown, getScheduleItemsDropdown } from "@/services/event.service";
import { useRegistrationStore } from "@/store/useRegistrationStore";
import { ROUTES, buildProfileSupportUrl } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useHomeDataStore } from "@/store/useHomeDataStore";
import type { EventDay, ScheduleItemRecord } from "@/services/event.service";
import type { AttendanceMode, EventDropdownOption } from "@/types";

export default function EventRegisterPage() {
  return (
    <EventRegisterGuard>
      <Suspense fallback={null}>
        <EventRegisterForm />
      </Suspense>
    </EventRegisterGuard>
  );
}

function EventRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetEventId = searchParams.get("event");
  const user = useAuthStore((s) => s.user);
  const [events, setEvents] = useState<EventDropdownOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [eventDaysLoading, setEventDaysLoading] = useState(false);
  const [eventDaysError, setEventDaysError] = useState<string | null>(null);
  const [scheduleItemsByDay, setScheduleItemsByDay] = useState<Record<string, ScheduleItemRecord[]>>({});
  const [scheduleLoadingByDay, setScheduleLoadingByDay] = useState<Record<string, boolean>>({});
  const [scheduleErrorByDay, setScheduleErrorByDay] = useState<Record<string, string | null>>({});
  const [sessionSelectionError, setSessionSelectionError] = useState<string | null>(null);
  const [daySelectionError, setDaySelectionError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fetchedScheduleDayIdsRef = useRef<Set<string>>(new Set());
  const submitErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { submitRegistration, isLoading } = useRegistrationStore();

  const showSubmitError = useCallback((message: string) => {
    setSubmitError(message);
    if (submitErrorTimerRef.current) clearTimeout(submitErrorTimerRef.current);
    submitErrorTimerRef.current = setTimeout(() => setSubmitError(null), 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (submitErrorTimerRef.current) clearTimeout(submitErrorTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const list = await getEventDropdown();
        if (!cancelled) setEvents(list);
      } catch (err) {
        if (!cancelled) {
          setEvents([]);
          setEventsError(err instanceof Error ? err.message : "Failed to load events");
        }
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      eventId: "",
      salutation: "", firstName: "", middleName: "", lastName: "", phone: "", email: "",
      participationDate: "", participationTime: "full_day",
      selectedDayIds: [], selectedSessionIds: [],
      sessionsByDay: {}, attendanceByDay: {},
      attendanceMode: "physical",
    },
  });

  const { register, control, watch, trigger, getValues, reset, setValue, formState: { errors } } = form;

  useEffect(() => {
    if (!presetEventId || events.length === 0) return;
    const match = events.find((event) => event.id === presetEventId);
    if (match) {
      setValue("eventId", presetEventId);
    }
  }, [presetEventId, events, setValue]);

  useEffect(() => {
    if (user) {
      reset({
        eventId: presetEventId && events.some((event) => event.id === presetEventId)
          ? presetEventId
          : "",
        salutation: user.salutation ?? "",
        firstName: user.firstName,
        middleName: user.middleName ?? "",
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        participationDate: "",
        participationTime: "full_day",
        selectedDayIds: [],
        selectedSessionIds: [],
        sessionsByDay: {},
        attendanceByDay: {},
        attendanceMode: "physical",
      });
    }
  }, [user, reset, presetEventId, events]);

  const values = watch();
  const selectedEvent = events.find((e) => e.id === values.eventId);
  const isMultiSession = selectedEvent?.scheduleType === "MULTI_SESSION";
  const participationDateOptions = useMemo(
    () => buildParticipationDateOptionsFromEventDays(eventDays, false),
    [eventDays],
  );
  const selectedDays = useMemo(
    () => eventDays.filter((day) => values.selectedDayIds?.includes(day.id)),
    [eventDays, values.selectedDayIds],
  );
  const getDayLabel = useCallback(
    (day: EventDay) =>
      day.label?.trim()
      || participationDateOptions.find((option) => option.value === day.date)?.label
      || day.date,
    [participationDateOptions],
  );

  const toggleDay = (dayId: string) => {
    const current = getValues("selectedDayIds") ?? [];
    const isRemoving = current.includes(dayId);
    const next = isRemoving
      ? current.filter((id) => id !== dayId)
      : [...current, dayId];

    setValue("selectedDayIds", next, { shouldValidate: true });
    setDaySelectionError(null);

    if (isMultiSession) {
      const sessionsByDay = { ...(getValues("sessionsByDay") ?? {}) };
      const attendanceByDay = { ...(getValues("attendanceByDay") ?? {}) };

      if (isRemoving) {
        delete sessionsByDay[dayId];
        delete attendanceByDay[dayId];
        setScheduleItemsByDay((prev) => {
          const copy = { ...prev };
          delete copy[dayId];
          return copy;
        });
      } else {
        attendanceByDay[dayId] = attendanceByDay[dayId] ?? "physical";
        sessionsByDay[dayId] = sessionsByDay[dayId] ?? [];
      }

      setValue("sessionsByDay", sessionsByDay, { shouldValidate: true });
      setValue("attendanceByDay", attendanceByDay, { shouldValidate: true });
    }
  };

  const toggleSessionForDay = (dayId: string, sessionId: string) => {
    const sessionsByDay = { ...(getValues("sessionsByDay") ?? {}) };
    const current = sessionsByDay[dayId] ?? [];
    sessionsByDay[dayId] = current.includes(sessionId)
      ? current.filter((id) => id !== sessionId)
      : [...current, sessionId];
    setValue("sessionsByDay", sessionsByDay, { shouldValidate: true });
    setSessionSelectionError(null);
  };

  const autoSelectAllSessionsForDay = useCallback(
    (dayId: string, items: ScheduleItemRecord[]) => {
      const allIds = items.map((item) => item.id);
      const sessionsByDay = { ...(getValues("sessionsByDay") ?? {}) };
      sessionsByDay[dayId] = allIds;
      setValue("sessionsByDay", sessionsByDay, { shouldValidate: true });
      setSessionSelectionError(null);
    },
    [getValues, setValue],
  );

  const setDayAttendance = (dayId: string, mode: AttendanceMode) => {
    const attendanceByDay = { ...(getValues("attendanceByDay") ?? {}) };
    attendanceByDay[dayId] = mode;
    setValue("attendanceByDay", attendanceByDay, { shouldValidate: true });

    if (mode === "physical") {
      const dayItems = scheduleItemsByDay[dayId] ?? [];
      if (dayItems.length > 0) {
        autoSelectAllSessionsForDay(dayId, dayItems);
      }
    } else if (mode === "virtual") {
      const sessionsByDay = { ...(getValues("sessionsByDay") ?? {}) };
      sessionsByDay[dayId] = [];
      setValue("sessionsByDay", sessionsByDay, { shouldValidate: true });
    }
  };

  useEffect(() => {
    if (!values.eventId) {
      setEventDays([]);
      setEventDaysError(null);
      setScheduleItemsByDay({});
      setScheduleLoadingByDay({});
      setScheduleErrorByDay({});
      fetchedScheduleDayIdsRef.current = new Set();
      setValue("participationDate", "");
      setValue("selectedDayIds", []);
      setValue("selectedSessionIds", []);
      setValue("sessionsByDay", {});
      setValue("attendanceByDay", {});
      return;
    }

    let cancelled = false;

    (async () => {
      setEventDaysLoading(true);
      setEventDaysError(null);
      try {
        const days = await getEventDays(values.eventId);
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
  }, [values.eventId, setValue]);

  useEffect(() => {
    if (!isMultiSession) {
      fetchedScheduleDayIdsRef.current = new Set();
      setScheduleItemsByDay({});
      setScheduleLoadingByDay({});
      setScheduleErrorByDay({});
      return;
    }

    const selectedDayIds = values.selectedDayIds ?? [];
    let cancelled = false;

    for (const id of fetchedScheduleDayIdsRef.current) {
      if (!selectedDayIds.includes(id)) {
        fetchedScheduleDayIdsRef.current.delete(id);
      }
    }

    selectedDayIds.forEach((dayId) => {
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
  }, [isMultiSession, values.selectedDayIds]);

  useEffect(() => {
    if (!isMultiSession) return;

    const selectedDayIds = values.selectedDayIds ?? [];
    const attendanceByDay = values.attendanceByDay ?? {};

    for (const dayId of selectedDayIds) {
      const mode = attendanceByDay[dayId] ?? "physical";
      if (mode !== "physical") continue;

      const dayItems = scheduleItemsByDay[dayId] ?? [];
      if (dayItems.length === 0 || scheduleLoadingByDay[dayId]) continue;

      const selectedForDay = values.sessionsByDay?.[dayId] ?? [];
      const allIds = dayItems.map((item) => item.id);
      const alreadyAllSelected =
        allIds.length === selectedForDay.length &&
        allIds.every((id) => selectedForDay.includes(id));

      if (!alreadyAllSelected) {
        autoSelectAllSessionsForDay(dayId, dayItems);
      }
    }
  }, [
    isMultiSession,
    values.selectedDayIds,
    values.attendanceByDay,
    values.sessionsByDay,
    scheduleItemsByDay,
    scheduleLoadingByDay,
    autoSelectAllSessionsForDay,
  ]);

  const formatSessionTime = (value: string) => {
    const [hh = "0", mm = "0"] = value.split(":");
    const hour = Number(hh);
    const minute = Number(mm);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
    const period = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${String(minute).padStart(2, "0")} ${period}`;
  };

  const validateStep = async () => {
    if (step === 2) {
      const selectedDayIdList = getValues("selectedDayIds") ?? [];

      if (selectedDayIdList.length === 0) {
        setDaySelectionError("Please select at least one day");
        return false;
      }

      if (isMultiSession) {
        const sessionsByDay = getValues("sessionsByDay") ?? {};
        const attendanceByDay = getValues("attendanceByDay") ?? {};
        for (const dayId of selectedDayIdList) {
          const mode = attendanceByDay[dayId] ?? "physical";
          if (mode === "physical") continue;

          const dayItems = scheduleItemsByDay[dayId] ?? [];
          const selectedForDay = sessionsByDay[dayId] ?? [];
          if (dayItems.length > 0 && selectedForDay.length === 0) {
            const day = eventDays.find((entry) => entry.id === dayId);
            setSessionSelectionError(
              `Please select at least one session for ${day ? getDayLabel(day) : "the selected day"}`,
            );
            return false;
          }
        }
      }
    }
    setSessionSelectionError(null);
    setDaySelectionError(null);

    if (step === 2 && !isMultiSession) {
      return trigger(["attendanceMode"]);
    }

    const fields = REGISTRATION_STEPS[step].fields;
    if (fields.length === 0) return true;
    return trigger(fields as unknown as (keyof RegistrationFormValues)[]);
  };

  const handleNext = async () => {
    if (await validateStep()) setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!(await validateStep())) return;

    const eventId = getValues().eventId;

    try {
      await submitRegistration(getValues(), {
        userId: user?.id,
        scheduleType: selectedEvent?.scheduleType ?? "WHOLE_DAY",
      });

      const authKey = `true:${user?.id ?? ""}`;
      useHomeDataStore.getState().invalidate();
      await useHomeDataStore.getState().load(authKey, { force: true });

      const enabledServices: string[] = [];
      if (selectedEvent?.travelAssistance) enabledServices.push("travel");
      if (selectedEvent?.medicalAssistance) enabledServices.push("medical");
      if (selectedEvent?.translationAssistance) enabledServices.push("translation");
      if (selectedEvent?.accommodationAssistance) enabledServices.push("accommodation");

      if (enabledServices.length > 0) {
        router.replace(buildProfileSupportUrl(eventId, enabledServices));
      } else {
        router.replace(ROUTES.home);
      }
    } catch (err) {
      if (err instanceof AlreadyRegisteredError) {
        setAlreadyRegistered(true);
        const authKey = `true:${user?.id ?? ""}`;
        useHomeDataStore.getState().invalidate();
        await useHomeDataStore.getState().load(authKey, { force: true });
        router.replace("/");
        return;
      }
      showSubmitError(
        err instanceof Error ? err.message : "Failed to submit registration",
      );
    }
  };

  if (alreadyRegistered) {
    return (
      <div className="min-h-screen flex flex-col">
        <LandingNavbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center space-y-6 max-w-md">
            <CheckCircle className="h-20 w-20 text-emerald-500 mx-auto" />
            <h1 className="text-3xl font-bold">Already Registered</h1>
            <p className="text-muted-foreground">
              You are already registered for this event. You can watch the live stream when it begins.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild><Link href="/">Back to Home</Link></Button>
              <Button variant="outline" asChild><Link href="/streaming">Watch Live</Link></Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <LandingNavbar />
      <div className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Event Registration</h1>
          <p className="text-muted-foreground mt-2">Complete all steps to register for the conference event</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {submitError && (
              <div
                role="alert"
                className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center"
              >
                {submitError}
              </div>
            )}
            <MultiStepForm
              steps={REGISTRATION_STEPS}
              currentStep={step}
              onNext={handleNext}
              onBack={() => setStep((s) => s - 1)}
              onSubmit={handleSubmit}
              isLastStep={step === REGISTRATION_STEPS.length - 1}
              isSubmitting={isLoading}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Event</Label>
                    {eventsError && (
                      <p className="text-sm text-destructive">{eventsError}</p>
                    )}
                    {eventsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading events…</p>
                    ) : events.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No events available at the moment.</p>
                    ) : (
                      <Controller name="eventId" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Choose an event" /></SelectTrigger>
                          <SelectContent>
                            {events.map((event) => (
                              <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )} />
                    )}
                    {errors.eventId && <p className="text-xs text-destructive">{errors.eventId.message}</p>}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Salutation</Label>
                    <Controller name="salutation" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select salutation" /></SelectTrigger>
                        <SelectContent>
                          {["Mr", "Mrs", "Ms", "Dr", "Prof"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )} />
                    {errors.salutation && <p className="text-xs text-destructive">{errors.salutation.message}</p>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input {...register("firstName")} />
                      {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Middle Name</Label>
                      <Input {...register("middleName")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input {...register("lastName")} />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input {...register("phone")} />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input type="email" {...register("email")} />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label>{isMultiSession ? "Select Days & Sessions" : "Select Days"}</Label>
                      {(values.selectedDayIds?.length ?? 0) > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {values.selectedDayIds?.length} selected
                        </span>
                      )}
                    </div>
                    {!values.eventId ? (
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
                          const isSelected = values.selectedDayIds?.includes(day.id) ?? false;
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
                    <div className="space-y-6">
                      {selectedDays.map((day) => {
                        const dayId = day.id;
                        const dayItems = scheduleItemsByDay[dayId] ?? [];
                        const selectedForDay = values.sessionsByDay?.[dayId] ?? [];
                        const dayAttendance = values.attendanceByDay?.[dayId] ?? "physical";
                        const loading = scheduleLoadingByDay[dayId];
                        const error = scheduleErrorByDay[dayId];

                        return (
                          <div key={dayId} className="space-y-4 rounded-xl border p-4 bg-card">
                            <h4 className="font-semibold text-sm">{getDayLabel(day)}</h4>

                            <div className="space-y-2">
                              <Label>Attendance Mode</Label>
                              <Select
                                onValueChange={(value) => setDayAttendance(dayId, value as AttendanceMode)}
                                value={dayAttendance}
                              >
                                <SelectTrigger><SelectValue placeholder="Select attendance mode" /></SelectTrigger>
                                <SelectContent>
                                  {ATTENDANCE_MODES.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
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
                                            "min-w-[240px] max-w-[260px] snap-start rounded-xl border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                      <Label>Attendance Mode</Label>
                      <Controller name="attendanceMode" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select attendance mode" /></SelectTrigger>
                          <SelectContent>
                            {ATTENDANCE_MODES.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )} />
                      {errors.attendanceMode && (
                        <p className="text-xs text-destructive">{errors.attendanceMode.message}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <Card>
                  <CardHeader><CardTitle>Registration Summary</CardTitle></CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">Event</h4>
                      <p>{selectedEvent?.name ?? "—"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Personal Details</h4>
                      <p>{values.salutation} {values.firstName} {values.middleName} {values.lastName}</p>
                      <p className="text-muted-foreground">{values.email} · {values.phone}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Participation</h4>
                      {isMultiSession ? (
                        selectedDays.length > 0 ? (
                          <ul className="space-y-4">
                            {selectedDays.map((day) => {
                              const dayId = day.id;
                              const daySessions = (values.sessionsByDay?.[dayId] ?? [])
                                .map((id) => (scheduleItemsByDay[dayId] ?? []).find((s) => s.id === id))
                                .filter((session): session is ScheduleItemRecord => Boolean(session));
                              const dayAttendance = values.attendanceByDay?.[dayId] ?? "physical";

                              return (
                                <li key={dayId}>
                                  <p className="font-medium">{getDayLabel(day)}</p>
                                  <p className="text-muted-foreground">{getRegistrationOptionLabel(dayAttendance)}</p>
                                  {dayAttendance === "physical" ? (
                                    <p className="mt-1 text-muted-foreground">All sessions for this day</p>
                                  ) : daySessions.length > 0 ? (
                                    <ul className="mt-1 space-y-1 text-muted-foreground">
                                      {daySessions.map((session) => (
                                        <li key={session.id}>
                                          {session.title} ({formatSessionTime(session.startTime)} - {formatSessionTime(session.endTime)})
                                        </li>
                                      ))}
                                    </ul>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground">—</p>
                        )
                      ) : (
                        <>
                          <p>{getRegistrationOptionLabel(values.attendanceMode)}</p>
                          {selectedDays.length > 0 ? (
                            <ul className="mt-2 space-y-1 text-muted-foreground">
                              {selectedDays.map((day) => (
                                <li key={day.id}>{getDayLabel(day)}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground mt-1">—</p>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </MultiStepForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

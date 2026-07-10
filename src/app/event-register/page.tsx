"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { EventDay, ScheduleItemRecord } from "@/services/event.service";
import type { EventDropdownOption } from "@/types";

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
  const [scheduleItems, setScheduleItems] = useState<ScheduleItemRecord[]>([]);
  const [scheduleItemsLoading, setScheduleItemsLoading] = useState(false);
  const [scheduleItemsError, setScheduleItemsError] = useState<string | null>(null);
  const [sessionSelectionError, setSessionSelectionError] = useState<string | null>(null);
  const [daySelectionError, setDaySelectionError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const loadedScheduleDayIdRef = useRef<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const { submitRegistration, isLoading } = useRegistrationStore();

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
      participationDate: "", participationTime: "full_day", selectedDayIds: [], selectedSessionIds: [], attendanceMode: "physical",
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
  const selectedSessions = useMemo(
    () => scheduleItems.filter((item) => values.selectedSessionIds?.includes(item.id)),
    [scheduleItems, values.selectedSessionIds],
  );

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

  useEffect(() => {
    if (!values.eventId) {
      setEventDays([]);
      setEventDaysError(null);
      setScheduleItems([]);
      setScheduleItemsError(null);
      setValue("participationDate", "");
      setValue("selectedDayIds", []);
      setValue("selectedSessionIds", []);
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
      setScheduleItems([]);
      setScheduleItemsError(null);
      return;
    }

    const selectedDay = eventDays.find((day) => day.date === values.participationDate);
    if (!selectedDay) {
      loadedScheduleDayIdRef.current = null;
      setScheduleItems([]);
      setScheduleItemsError(null);
      setValue("selectedSessionIds", []);
      return;
    }

    if (loadedScheduleDayIdRef.current !== selectedDay.id) {
      loadedScheduleDayIdRef.current = selectedDay.id;
      setValue("selectedSessionIds", []);
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
  }, [isMultiSession, eventDays, values.participationDate, setValue]);

  const formatSessionTime = (value: string) => {
    const [hh = "0", mm = "0"] = value.split(":");
    const hour = Number(hh);
    const minute = Number(mm);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
    const period = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${String(minute).padStart(2, "0")} ${period}`;
  };

  useEffect(() => {
    if (!values.eventId || !isMultiSession) {
      return;
    }

    if (participationDateOptions.length === 0) {
      setValue("participationDate", "");
      return;
    }

    const currentValue = getValues("participationDate");
    const isCurrentValid = participationDateOptions.some((option) => option.value === currentValue);
    if (!isCurrentValid) {
      setValue("participationDate", participationDateOptions[0].value);
    }
  }, [values.eventId, isMultiSession, participationDateOptions, setValue, getValues]);

  const validateStep = async () => {
    if (step === 2) {
      if (isMultiSession) {
        if (!getValues("participationDate")) {
          await trigger("participationDate");
          return false;
        }
        if (scheduleItems.length > 0) {
          const selected = getValues("selectedSessionIds") ?? [];
          if (selected.length === 0) {
            setSessionSelectionError("Please select at least one session");
            return false;
          }
        }
      } else {
        const selectedDays = getValues("selectedDayIds") ?? [];
        if (selectedDays.length === 0) {
          setDaySelectionError("Please select at least one day");
          return false;
        }
      }
    }
    setSessionSelectionError(null);
    setDaySelectionError(null);

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
      // Assistance services disabled — redirect home after registration
      // sessionStorage.setItem(PROFILE_SUPPORT_EVENT_KEY, eventId);
      // router.replace(buildProfileSupportUrl(eventId));
      router.replace(ROUTES.home);
    } catch (err) {
      if (err instanceof AlreadyRegisteredError) {
        setAlreadyRegistered(true);
        router.replace("/");
      }
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
                      <Label>{isMultiSession ? "Date of Participation" : "Select Days"}</Label>
                      {!isMultiSession && (values.selectedDayIds?.length ?? 0) > 0 && (
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
                    ) : isMultiSession ? (
                      <Controller name="participationDate" control={control} render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col gap-3">
                          {participationDateOptions.map((option) => (
                            <div key={option.value} className="flex items-center gap-2">
                              <RadioGroupItem value={option.value} id={`date-${option.value}`} />
                              <Label htmlFor={`date-${option.value}`} className="font-normal cursor-pointer">
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )} />
                    ) : (
                      <div className="flex flex-col gap-3">
                        {eventDays.map((day) => {
                          const isSelected = values.selectedDayIds?.includes(day.id) ?? false;
                          const label = day.label?.trim() || participationDateOptions.find((option) => option.value === day.date)?.label || day.date;
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

                  {isMultiSession && values.participationDate && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label>Select Sessions</Label>
                        {(values.selectedSessionIds?.length ?? 0) > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {values.selectedSessionIds?.length} selected
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
                            const isSelected = values.selectedSessionIds?.includes(item.id) ?? false;
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
                      {sessionSelectionError && (
                        <p className="text-xs text-destructive">{sessionSelectionError}</p>
                      )}
                    </div>
                  )}

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
                      <p>{getRegistrationOptionLabel(values.attendanceMode)}</p>
                      {isMultiSession ? (
                        <>
                          <p className="text-muted-foreground mt-1">
                            {participationDateOptions.find((option) => option.value === values.participationDate)?.label ?? "—"}
                          </p>
                          {selectedSessions.length > 0 && (
                            <ul className="mt-2 space-y-1 text-muted-foreground">
                              {selectedSessions.map((session) => (
                                <li key={session.id}>
                                  {session.title} ({formatSessionTime(session.startTime)} - {formatSessionTime(session.endTime)})
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : selectedDays.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-muted-foreground">
                          {selectedDays.map((day) => (
                            <li key={day.id}>
                              {day.label?.trim() || participationDateOptions.find((option) => option.value === day.date)?.label || day.date}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground mt-1">—</p>
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

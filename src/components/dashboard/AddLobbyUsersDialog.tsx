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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SessionScrollRow } from "@/components/shared/SessionScrollRow";
import { PhoneWithCountryCode } from "@/components/auth/PhoneWithCountryCode";
import {
  addLobbyUserSchema,
  EMPTY_ADD_LOBBY_USER,
  LOBBY_USER_SALUTATIONS,
  type AddLobbyUserFormValues,
  type LobbyUserRegistrationFormValues,
  type LobbyUserSignupFormValues,
} from "@/features/dashboard/admin-lobby-user.schema";
import { SIGNUP_GENDERS, SIGNUP_ORG_TYPES } from "@/features/auth/signup.schema";
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
import { sortEventDaysByDate } from "@/lib/icas-conference";
import { getEventDays, getScheduleItemsDropdown } from "@/services/event.service";
import {
  sessionCardClassName,
  sessionCheckboxClassName,
  sessionMetaClassName,
  sessionTimeChipClassName,
} from "@/lib/session-card-tones";
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

function RequiredMark() {
  return <span className="text-destructive" aria-hidden>*</span>;
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
  const orgType = watch("orgType");
  const countryCode = watch("countryCode");
  const phone = watch("phone");
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
  }, [selectedEventId, wizardStep, setValue]);

  useEffect(() => {
    if (!isMultiSession || wizardStep !== 2) {
      fetchedScheduleDayIdsRef.current = new Set();
      setScheduleItemsByDay((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      setScheduleLoadingByDay((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      setScheduleErrorByDay((prev) => (Object.keys(prev).length > 0 ? {} : prev));
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
  }, [isMultiSession, wizardStep, selectedDayIds]);

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
    if (!isMultiSession || eventDays.length === 0) return;

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
  }, [eventDays, isMultiSession, selectedDayIds, getValues, setValue]);

  useEffect(() => {
    if (!isMultiSession) return;

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
        setScheduleItemsByDay((prev) => {
          const copy = { ...prev };
          delete copy[dayId];
          return copy;
        });
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
        "countryCode",
        "phone",
        "email",
        "gender",
        "designation",
        "orgType",
        "orgName",
        "motivation",
        "city",
        "state",
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
        countryCode: signupValues.countryCode,
        phone: signupValues.phone,
        email: signupValues.email,
        gender: signupValues.gender,
        designation: signupValues.designation,
        orgType: signupValues.orgType,
        orgName: signupValues.orgName,
        motivation: signupValues.motivation,
        city: signupValues.city,
        state: signupValues.state,
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

    const valid = await trigger(
      isMultiSession ? ["eventId"] : ["eventId", "attendanceMode"],
      { shouldFocus: true },
    );
    if (!valid) return;

    let registrationValues = values;
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
      registrationValues = { ...values, sessionsByDay: syncedSessions };
    }

    setSubmitStep("register");

    try {
      await onRegister(
        createdUserId,
        {
          eventId: registrationValues.eventId,
          selectedDayIds: registrationValues.selectedDayIds,
          selectedSessionIds: registrationValues.selectedSessionIds ?? [],
          sessionsByDay: registrationValues.sessionsByDay,
          attendanceByDay: registrationValues.attendanceByDay,
          attendanceMode: registrationValues.attendanceMode,
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-2">
                <Label htmlFor="lobby-salutation">Salutation</Label>
                <Controller
                  name="salutation"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="lobby-salutation">
                        <SelectValue placeholder="Select salutation" />
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lobby-first-name">
                    First Name <RequiredMark />
                  </Label>
                  <Input id="lobby-first-name" required aria-required="true" {...register("firstName")} />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lobby-middle-name">Middle Name</Label>
                  <Input id="lobby-middle-name" {...register("middleName")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lobby-last-name">
                  Last Name <RequiredMark />
                </Label>
                <Input id="lobby-last-name" required aria-required="true" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lobby-phone">
                    Phone Number <RequiredMark />
                  </Label>
                  <PhoneWithCountryCode
                    id="lobby-phone"
                    countryCode={countryCode}
                    phone={phone}
                    onCountryCodeChange={(code) =>
                      setValue("countryCode", code, { shouldValidate: true, shouldDirty: true })
                    }
                    onPhoneChange={(value) =>
                      setValue("phone", value, { shouldValidate: true, shouldDirty: true })
                    }
                    required
                    phonePlaceholder="9999999999"
                  />
                  {(errors.phone || errors.countryCode) && (
                    <p className="text-xs text-destructive">
                      {errors.phone?.message ?? errors.countryCode?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lobby-email">
                    Email Address <RequiredMark />
                  </Label>
                  <Input
                    id="lobby-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    aria-required="true"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Gender <RequiredMark />
                </Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="lobby-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIGNUP_GENDERS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && (
                  <p className="text-xs text-destructive">{errors.gender.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lobby-designation">
                  Designation <RequiredMark />
                </Label>
                <Input
                  id="lobby-designation"
                  placeholder="e.g. Researcher, Student"
                  required
                  aria-required="true"
                  {...register("designation")}
                />
                {errors.designation && (
                  <p className="text-xs text-destructive">{errors.designation.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Organisation type</Label>
                  <Controller
                    name="orgType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SIGNUP_ORG_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.orgType && (
                    <p className="text-xs text-destructive">{errors.orgType.message}</p>
                  )}
                </div>
                {orgType === "ORGANISATION" && (
                  <div className="space-y-2">
                    <Label htmlFor="lobby-org-name">Organisation name</Label>
                    <Input id="lobby-org-name" {...register("orgName")} />
                    {errors.orgName && (
                      <p className="text-xs text-destructive">{errors.orgName.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lobby-motivation">What motivates you to attend this event?</Label>
                <Textarea
                  id="lobby-motivation"
                  rows={3}
                  placeholder="Share a brief note about why you want to attend"
                  {...register("motivation")}
                />
                {errors.motivation && (
                  <p className="text-xs text-destructive">{errors.motivation.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lobby-city">City</Label>
                  <Input id="lobby-city" {...register("city")} />
                  {errors.city && (
                    <p className="text-xs text-destructive">{errors.city.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lobby-state">State</Label>
                  <Input id="lobby-state" {...register("state")} />
                  {errors.state && (
                    <p className="text-xs text-destructive">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lobby-password">Password</Label>
                  <PasswordInput id="lobby-password" {...register("password")} />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lobby-confirm-password">Confirm Password</Label>
                  <PasswordInput id="lobby-confirm-password" {...register("confirmPassword")} />
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
                          {sharedAttendanceOptions.map((option) => (
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

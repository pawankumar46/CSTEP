"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight, Loader2, Mic, UserPlus } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SignupAddressFields } from "@/components/auth/SignupAddressFields";
import {
  addLobbyUserSchema,
  EMPTY_ADD_LOBBY_USER,
  LOBBY_USER_SALUTATIONS,
  type AddLobbyUserFormValues,
  type LobbyUserRegistrationFormValues,
  type LobbyUserSignupFormValues,
} from "@/features/dashboard/admin-lobby-user.schema";
import { buildParticipationDateOptionsFromEventDays } from "@/lib/participation-dates";
import { ATTENDANCE_MODES } from "@/lib/registration-options";
import { getEventDays, getScheduleItemsDropdown } from "@/services/event.service";
import { cn } from "@/lib/utils";
import type { EventDay, ScheduleItemRecord } from "@/services/event.service";
import type { Event } from "@/types";

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
  const [scheduleItems, setScheduleItems] = useState<ScheduleItemRecord[]>([]);
  const [scheduleItemsLoading, setScheduleItemsLoading] = useState(false);
  const [scheduleItemsError, setScheduleItemsError] = useState<string | null>(null);
  const [daySelectionError, setDaySelectionError] = useState<string | null>(null);
  const [sessionSelectionError, setSessionSelectionError] = useState<string | null>(null);

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
    setScheduleItems([]);
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
      setValue("participationDate", "");
      setScheduleItems([]);
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
      setScheduleItems([]);
      setScheduleItemsError(null);
      return;
    }

    const selectedDay = eventDays.find((day) => day.date === participationDate);
    if (!selectedDay) {
      setScheduleItems([]);
      setScheduleItemsError(null);
      setValue("selectedSessionIds", []);
      return;
    }

    setValue("selectedSessionIds", []);

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
  }, [isMultiSession, eventDays, participationDate, wizardStep, setValue]);

  useEffect(() => {
    if (!isMultiSession || wizardStep !== 2 || participationDateOptions.length === 0) return;
    const current = getValues("participationDate");
    const isValid = participationDateOptions.some((option) => option.value === current);
    if (!isValid) {
      setValue("participationDate", participationDateOptions[0].value);
    }
  }, [isMultiSession, wizardStep, participationDateOptions, getValues, setValue]);

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

  const resetAndClose = () => {
    setSubmitError(null);
    setSubmitStep("idle");
    setWizardStep(1);
    setCreatedUserId(null);
    setEventDays([]);
    setScheduleItems([]);
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

    const valid = await trigger(
      ["eventId", "attendanceMode"],
      { shouldFocus: true },
    );
    if (!valid) return;

    setSubmitStep("register");

    try {
      await onRegister(
        createdUserId,
        {
          eventId: values.eventId,
          participationDate: values.participationDate,
          selectedDayIds: values.selectedDayIds,
          selectedSessionIds: values.selectedSessionIds,
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
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        className="flex flex-col gap-3"
                      >
                        {participationDateOptions.map((option) => (
                          <div key={option.value} className="flex items-center gap-2">
                            <RadioGroupItem value={option.value} id={`lobby-date-${option.value}`} />
                            <Label htmlFor={`lobby-date-${option.value}`} className="font-normal cursor-pointer">
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
                    <div className="relative">
                      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
                        <ChevronLeft className="h-3 w-3" />
                        Swipe to browse · tap to select multiple
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                  {sessionSelectionError && (
                    <p className="text-xs text-destructive">{sessionSelectionError}</p>
                  )}
                </div>
              )}

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

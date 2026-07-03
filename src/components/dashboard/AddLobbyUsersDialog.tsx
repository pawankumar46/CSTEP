"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  addLobbyUserSchema,
  EMPTY_ADD_LOBBY_USER,
  LOBBY_USER_SALUTATIONS,
  type AddLobbyUserFormValues,
  type LobbyUserRegistrationFormValues,
  type LobbyUserSignupFormValues,
} from "@/features/dashboard/admin-lobby-user.schema";
import { getEventDayDates, getParticipationDateOptions } from "@/lib/participation-dates";
import { ATTENDANCE_MODES, FOOD_PREFERENCES, PARTICIPATION_TIMES } from "@/lib/registration-options";
import type { Event } from "@/types";

interface AddLobbyUsersDialogProps {
  events: Event[];
  defaultEventId?: string | null;
  disabled?: boolean;
  onSignUp: (values: LobbyUserSignupFormValues) => Promise<string>;
  onRegister: (
    userId: string,
    values: LobbyUserRegistrationFormValues,
    event: Pick<Event, "date" | "endDate"> | null,
  ) => Promise<void>;
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
  const participationDates = watch("participationDates");
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );
  const participationDateOptions = useMemo(
    () => getParticipationDateOptions(selectedEvent).filter((option) => option.value !== "both_days"),
    [selectedEvent],
  );

  useEffect(() => {
    if (!selectedEvent) return;
    const dates = getEventDayDates(selectedEvent);
    if (dates.length > 0 && participationDates.length === 0) {
      setValue("participationDates", dates);
    }
  }, [selectedEvent, participationDates.length, setValue]);

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
  }, [open, defaultEventId, events, reset]);

  const resetAndClose = () => {
    setSubmitError(null);
    setSubmitStep("idle");
    setWizardStep(1);
    setCreatedUserId(null);
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
    const valid = await trigger(
      ["eventId", "participationDates", "participationTime", "attendanceMode", "foodPreference"],
      { shouldFocus: true },
    );
    if (!valid) return;

    setSubmitStep("register");

    try {
      await onRegister(
        createdUserId,
        {
          eventId: values.eventId,
          participationDates: values.participationDates,
          participationTime: values.participationTime,
          attendanceMode: values.attendanceMode,
          foodPreference: values.foodPreference,
        },
        selectedEvent,
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
                <Label>Participation dates</Label>
                {participationDateOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Select an event to see available dates.</p>
                ) : (
                  <Controller
                    name="participationDates"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-col gap-2">
                        {participationDateOptions.map((option) => (
                          <div key={option.value} className="flex items-center gap-2">
                            <Checkbox
                              id={`lobby-date-${option.value}`}
                              checked={field.value.includes(option.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, option.value]);
                                } else {
                                  field.onChange(field.value.filter((date) => date !== option.value));
                                }
                              }}
                            />
                            <Label htmlFor={`lobby-date-${option.value}`} className="font-normal cursor-pointer">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                )}
                {errors.participationDates && (
                  <p className="text-xs text-destructive">{errors.participationDates.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lobby-participation-time">Participation time</Label>
                <Controller
                  name="participationTime"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="lobby-participation-time">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PARTICIPATION_TIMES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                <div className="space-y-2">
                  <Label htmlFor="lobby-food">Food preference</Label>
                  <Controller
                    name="foodPreference"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="lobby-food">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FOOD_PREFERENCES.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.foodPreference && (
                    <p className="text-xs text-destructive">{errors.foodPreference.message}</p>
                  )}
                </div>
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

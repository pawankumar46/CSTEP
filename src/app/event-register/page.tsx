"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { MultiStepForm } from "@/components/forms/MultiStepForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { registrationSchema, REGISTRATION_STEPS, type RegistrationFormValues } from "@/features/registration/registration.schema";
import {
  ATTENDANCE_MODES,
  FOOD_PREFERENCES,
  MEDICAL_SUPPORT_TYPES,
  PARTICIPATION_TIMES,
  TRANSLATION_LANGUAGES,
  TRAVEL_TYPES,
  getRegistrationOptionLabel,
} from "@/lib/registration-options";
import { getParticipationDateLabel, getParticipationDateOptions } from "@/lib/participation-dates";
import { EventRegisterGuard } from "@/components/auth/EventRegisterGuard";
import { useAuthStore } from "@/store/useAuthStore";
import { useEventStore } from "@/store/useEventStore";
import { AlreadyRegisteredError } from "@/services/registration.service";
import { useRegistrationStore } from "@/store/useRegistrationStore";

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
  const { events, isLoading: eventsLoading, fetchEvents } = useEventStore();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const { submitRegistration, isLoading } = useRegistrationStore();

  useEffect(() => {
    fetchEvents("upcoming");
  }, [fetchEvents]);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      eventId: "",
      salutation: "", firstName: "", middleName: "", lastName: "", phone: "", email: "",
      participationDate: "", participationTime: "full_day", attendanceMode: "physical", foodPreference: "veg",
      travelRequired: false, medicalSupportRequired: false, translationRequired: false,
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
        attendanceMode: "physical",
        foodPreference: "veg",
        travelRequired: false,
        medicalSupportRequired: false,
        translationRequired: false,
      });
    }
  }, [user, reset, presetEventId, events]);

  const values = watch();
  const selectedEvent = events.find((e) => e.id === values.eventId);
  const participationDateOptions = getParticipationDateOptions(selectedEvent);

  useEffect(() => {
    if (!values.eventId) {
      setValue("participationDate", "");
      return;
    }

    const event = events.find((e) => e.id === values.eventId);
    const options = getParticipationDateOptions(event);
    if (options.length === 0) {
      setValue("participationDate", "");
      return;
    }

    const currentValue = getValues("participationDate");
    const isCurrentValid = options.some((option) => option.value === currentValue);
    if (!isCurrentValid) {
      setValue("participationDate", options[0].value);
    }
  }, [values.eventId, events, setValue, getValues]);

  const validateStep = async () => {
    const fields = REGISTRATION_STEPS[step].fields;
    if (fields.length === 0) return true;
    return trigger(fields as unknown as (keyof RegistrationFormValues)[]);
  };

  const handleNext = async () => {
    if (await validateStep()) setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!(await validateStep())) return;

    try {
      await submitRegistration(getValues(), selectedEvent);
      setAlreadyRegistered(false);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof AlreadyRegisteredError) {
        setAlreadyRegistered(true);
        router.replace("/");
      }
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <LandingNavbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center space-y-6 max-w-md">
            <CheckCircle className="h-20 w-20 text-emerald-500 mx-auto" />
            <h1 className="text-3xl font-bold">
              {alreadyRegistered ? "Already Registered" : "Event Registration Successful!"}
            </h1>
            <p className="text-muted-foreground">
              {alreadyRegistered
                ? "You are already registered for this event. You can watch the live stream when it begins."
                : "You're registered for the conference. You can watch the live stream when the event begins."}
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
                    <Label>Date of Participation</Label>
                    {!values.eventId ? (
                      <p className="text-sm text-muted-foreground">Please select an event first.</p>
                    ) : participationDateOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No participation dates available for this event.</p>
                    ) : (
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
                    )}
                    {errors.participationDate && (
                      <p className="text-xs text-destructive">{errors.participationDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Time of Participation</Label>
                    <Controller name="participationTime" control={control} render={({ field }) => (
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col gap-3">
                        {PARTICIPATION_TIMES.map((option) => (
                          <div key={option.value} className="flex items-center gap-2">
                            <RadioGroupItem value={option.value} id={`time-${option.value}`} />
                            <Label htmlFor={`time-${option.value}`} className="font-normal cursor-pointer">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )} />
                  </div>
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
                <div className="space-y-2">
                  <Label>Food Preference</Label>
                  <Controller name="foodPreference" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FOOD_PREFERENCES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Travel Required</Label>
                    <Controller name="travelRequired" control={control} render={({ field }) => (
                      <RadioGroup onValueChange={(v) => field.onChange(v === "yes")} value={field.value ? "yes" : "no"} className="flex gap-4">
                        <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="travel-yes" /><Label htmlFor="travel-yes">Yes</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="no" id="travel-no" /><Label htmlFor="travel-no">No</Label></div>
                      </RadioGroup>
                    )} />
                  </div>
                  {values.travelRequired && (
                    <div className="space-y-2">
                      <Label>Travel Type</Label>
                      <Controller name="travelType" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select travel type" /></SelectTrigger>
                          <SelectContent>
                            {TRAVEL_TYPES.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )} />
                      {errors.travelType && <p className="text-xs text-destructive">{errors.travelType.message}</p>}
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Medical Support Required</Label>
                    <Controller name="medicalSupportRequired" control={control} render={({ field }) => (
                      <RadioGroup onValueChange={(v) => field.onChange(v === "yes")} value={field.value ? "yes" : "no"} className="flex gap-4">
                        <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="med-yes" /><Label htmlFor="med-yes">Yes</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="no" id="med-no" /><Label htmlFor="med-no">No</Label></div>
                      </RadioGroup>
                    )} />
                  </div>
                  {values.medicalSupportRequired && (
                    <div className="space-y-2">
                      <Label>Support Type</Label>
                      <Controller name="medicalSupportType" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select support type" /></SelectTrigger>
                          <SelectContent>
                            {MEDICAL_SUPPORT_TYPES.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                  )}
                </div>
              )}

              {step === 6 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Translation Required</Label>
                    <Controller name="translationRequired" control={control} render={({ field }) => (
                      <RadioGroup onValueChange={(v) => field.onChange(v === "yes")} value={field.value ? "yes" : "no"} className="flex gap-4">
                        <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="trans-yes" /><Label htmlFor="trans-yes">Yes</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="no" id="trans-no" /><Label htmlFor="trans-no">No</Label></div>
                      </RadioGroup>
                    )} />
                  </div>
                  {values.translationRequired && (
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Controller name="translationLanguage" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                          <SelectContent>
                            {TRANSLATION_LANGUAGES.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                  )}
                </div>
              )}

              {step === 7 && (
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
                      <p>
                        {getParticipationDateLabel(values.participationDate, selectedEvent)} · {getRegistrationOptionLabel(values.participationTime)} · {getRegistrationOptionLabel(values.attendanceMode)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Preferences</h4>
                      <p>Food: {getRegistrationOptionLabel(values.foodPreference)}</p>
                      {values.travelRequired && <p>Travel: {values.travelType ? getRegistrationOptionLabel(values.travelType) : "—"}</p>}
                      {values.medicalSupportRequired && <p>Medical: {values.medicalSupportType ? getRegistrationOptionLabel(values.medicalSupportType) : "—"}</p>}
                      {values.translationRequired && <p>Translation: {values.translationLanguage ? getRegistrationOptionLabel(values.translationLanguage) : "—"}</p>}
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

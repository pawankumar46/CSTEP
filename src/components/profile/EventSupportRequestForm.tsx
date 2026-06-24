"use client";

import { useEffect, useState } from "react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from "react-hook-form";
import { Loader2, Plane, Stethoscope, Languages } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatEventDateRange } from "@/lib/event-display";
import { TRANSLATION_LANGUAGES } from "@/lib/registration-options";
import { getEvents } from "@/services/event.service";
import type { EventSupportFormValues, ServiceType } from "@/features/profile/event-support.schema";
import type { Event } from "@/types";

const SERVICE_OPTIONS = [
  { value: "travel" as const, label: "Travel Assistance", icon: Plane },
  { value: "medical" as const, label: "Medical Assistance", icon: Stethoscope },
  { value: "translation" as const, label: "Translation Assistance", icon: Languages },
];

const TRANSPORT_OPTIONS = [
  { value: "flight", label: "Flight" },
  { value: "train", label: "Train" },
  { value: "taxi", label: "Taxi" },
] as const;

interface EventSupportRequestFormProps {
  control: Control<EventSupportFormValues>;
  values: EventSupportFormValues;
  errors: FieldErrors<EventSupportFormValues>;
  setValue: UseFormSetValue<EventSupportFormValues>;
  presetEventId?: string | null;
}

function clearServiceFields(
  serviceType: ServiceType,
  setValue: UseFormSetValue<EventSupportFormValues>,
  keepEventId?: string,
) {
  if (!keepEventId) {
    setValue("eventId", "");
  }

  if (serviceType !== "travel") {
    setValue("transportMode", undefined);
    setValue("departureCity", "");
    setValue("arrivalCity", "");
    setValue("departureDate", "");
    setValue("pickupAddress", "");
    setValue("dropAddress", "");
    setValue("travelDate", "");
  }

  if (serviceType !== "medical") {
    setValue("medicalRequirement", "");
    setValue("medicalRequiredDate", "");
  }

  if (serviceType !== "translation") {
    setValue("translationLanguage", undefined);
    setValue("translationRequiredDate", "");
  }
}

function clearTransportFields(setValue: UseFormSetValue<EventSupportFormValues>) {
  setValue("departureCity", "");
  setValue("arrivalCity", "");
  setValue("departureDate", "");
  setValue("pickupAddress", "");
  setValue("dropAddress", "");
  setValue("travelDate", "");
}

interface EventSelectProps {
  control: Control<EventSupportFormValues>;
  events: Event[];
  eventsLoading: boolean;
  eventsError: string | null;
  error?: string;
}

function EventSelect({ control, events, eventsLoading, eventsError, error }: EventSelectProps) {
  return (
    <div className="space-y-2">
      <Label>Which event?</Label>
      {eventsLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading events...
        </div>
      ) : (
        <Controller
          name="eventId"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value ?? ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No upcoming events
                  </SelectItem>
                ) : (
                  events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                      {" · "}
                      {formatEventDateRange(event.date, event.endDate)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
      )}
      {eventsError && <p className="text-xs text-destructive">{eventsError}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function EventSupportRequestForm({
  control,
  values,
  errors,
  setValue,
  presetEventId,
}: EventSupportRequestFormProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    if (presetEventId) {
      setValue("eventId", presetEventId);
    }
  }, [presetEventId, setValue]);

  useEffect(() => {
    let cancelled = false;
    setEventsLoading(true);
    setEventsError(null);

    getEvents("upcoming")
      .then((list) => {
        if (!cancelled) setEvents(list);
      })
      .catch((error) => {
        if (!cancelled) {
          setEvents([]);
          setEventsError(
            error instanceof Error ? error.message : "Failed to load events",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const eventSelectProps = {
    control,
    events,
    eventsLoading,
    eventsError,
    error: errors.eventId?.message,
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base">Select service</Label>
        <Controller
          name="serviceType"
          control={control}
          render={({ field }) => (
            <RadioGroup
              onValueChange={(service) => {
                const next = service as ServiceType;
                field.onChange(next);
                clearServiceFields(next, setValue, presetEventId ?? undefined);
              }}
              value={field.value}
              className="flex flex-wrap gap-6"
            >
              {SERVICE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem value={option.value} id={`service-${option.value}`} />
                  <Label htmlFor={`service-${option.value}`} className="flex items-center gap-2 font-normal">
                    <option.icon className="h-4 w-4 text-muted-foreground" />
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
      </div>

      {values.serviceType === "travel" && (
        <div className="space-y-5 rounded-xl border bg-muted/30 p-5">
          <h3 className="text-lg font-semibold text-primary">Travel Assistance</h3>

          <EventSelect {...eventSelectProps} />

          <div className="space-y-2">
            <Label>Mode of transport</Label>
            <Controller
              name="transportMode"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={(mode) => {
                    field.onChange(mode);
                    clearTransportFields(setValue);
                  }}
                  value={field.value ?? ""}
                  className="flex flex-wrap gap-4"
                >
                  {TRANSPORT_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={option.value}
                        id={`transport-${option.value}`}
                      />
                      <Label htmlFor={`transport-${option.value}`} className="font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
            {errors.transportMode && (
              <p className="text-xs text-destructive">{errors.transportMode.message}</p>
            )}
          </div>

          {(values.transportMode === "flight" || values.transportMode === "train") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="departureCity">Departure city</Label>
                <Controller
                  name="departureCity"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="departureCity"
                      placeholder="e.g. Mumbai"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.departureCity && (
                  <p className="text-xs text-destructive">{errors.departureCity.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalCity">Arrival city</Label>
                <Controller
                  name="arrivalCity"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="arrivalCity"
                      placeholder="e.g. Bengaluru"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.arrivalCity && (
                  <p className="text-xs text-destructive">{errors.arrivalCity.message}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="departureDate">Departure date</Label>
                <Controller
                  name="departureDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="departureDate"
                      type="date"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.departureDate && (
                  <p className="text-xs text-destructive">{errors.departureDate.message}</p>
                )}
              </div>
            </div>
          )}

          {values.transportMode === "taxi" && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupAddress">Pickup address</Label>
                <Controller
                  name="pickupAddress"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="pickupAddress"
                      placeholder="Enter pickup location"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.pickupAddress && (
                  <p className="text-xs text-destructive">{errors.pickupAddress.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dropAddress">Drop address</Label>
                <Controller
                  name="dropAddress"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="dropAddress"
                      placeholder="Enter drop location"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.dropAddress && (
                  <p className="text-xs text-destructive">{errors.dropAddress.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="travelDate">Travel date</Label>
                <Controller
                  name="travelDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="travelDate"
                      type="date"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.travelDate && (
                  <p className="text-xs text-destructive">{errors.travelDate.message}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {values.serviceType === "medical" && (
        <div className="space-y-5 rounded-xl border bg-muted/30 p-5">
          <h3 className="text-lg font-semibold text-destructive">Medical Assistance</h3>

          <EventSelect {...eventSelectProps} />

          <div className="space-y-2">
            <Label htmlFor="medicalRequirement">Medical requirement</Label>
            <Controller
              name="medicalRequirement"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="medicalRequirement"
                  rows={4}
                  placeholder="Wheelchair assistance, first aid support, dietary restrictions..."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.medicalRequirement && (
              <p className="text-xs text-destructive">{errors.medicalRequirement.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalRequiredDate">Required date</Label>
            <Controller
              name="medicalRequiredDate"
              control={control}
              render={({ field }) => (
                <Input
                  id="medicalRequiredDate"
                  type="date"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.medicalRequiredDate && (
              <p className="text-xs text-destructive">{errors.medicalRequiredDate.message}</p>
            )}
          </div>
        </div>
      )}

      {values.serviceType === "translation" && (
        <div className="space-y-5 rounded-xl border bg-muted/30 p-5">
          <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            Translation Assistance
          </h3>

          <EventSelect {...eventSelectProps} />

          <div className="space-y-2">
            <Label>Language required</Label>
            <Controller
              name="translationLanguage"
              control={control}
              render={({ field }) => (
                <Select
              onValueChange={field.onChange}
              value={field.value ?? ""}
            >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSLATION_LANGUAGES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.translationLanguage && (
              <p className="text-xs text-destructive">{errors.translationLanguage.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="translationRequiredDate">Required date</Label>
            <Controller
              name="translationRequiredDate"
              control={control}
              render={({ field }) => (
                <Input
                  id="translationRequiredDate"
                  type="date"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.translationRequiredDate && (
              <p className="text-xs text-destructive">{errors.translationRequiredDate.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

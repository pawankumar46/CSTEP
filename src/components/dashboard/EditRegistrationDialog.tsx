"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList, Loader2 } from "lucide-react";
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
import { getParticipationDateOptions } from "@/lib/participation-dates";
import {
  ATTENDANCE_MODES,
  FOOD_PREFERENCES,
  PARTICIPATION_TIMES,
} from "@/lib/registration-options";
import {
  registrationEditSchema,
  EMPTY_REGISTRATION_EDIT,
  type RegistrationEditFormValues,
} from "@/features/dashboard/admin-registration.schema";
import type { Event, Registration } from "@/types";

interface EditRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: Registration | null;
  events: Event[];
  eventsLoading?: boolean;
  defaultEventId?: string | null;
  onSubmit: (id: string, values: RegistrationEditFormValues, event?: Pick<Event, "date" | "endDate"> | null) => Promise<void>;
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
    formState: { errors, isSubmitting },
  } = useForm<RegistrationEditFormValues>({
    resolver: zodResolver(registrationEditSchema),
    defaultValues: EMPTY_REGISTRATION_EDIT,
  });

  const selectedEventId = watch("eventId");
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );
  const participationDateOptions = getParticipationDateOptions(selectedEvent);

  useEffect(() => {
    if (!open || !registration) return;

    const fallbackEventId =
      registration.eventId ||
      (defaultEventId && events.some((event) => event.id === defaultEventId)
        ? defaultEventId
        : events[0]?.id ?? "");

    reset({
      eventId: fallbackEventId,
      participationDate: registration.participationDate,
      participationTime: registration.participationTime,
      attendanceMode: registration.attendanceMode,
      foodPreference: registration.foodPreference,
    });
  }, [open, reset, registration, defaultEventId, events]);

  const handleFormSubmit = async (values: RegistrationEditFormValues) => {
    if (!registration) return;
    const eventForPayload = events.find((event) => event.id === values.eventId) ?? selectedEvent;
    await onSubmit(registration.id, values, eventForPayload);
    onOpenChange(false);
  };

  return (
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
                  onValueChange={field.onChange}
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

          <div className="space-y-2">
            <Label>Date of participation</Label>
            {!selectedEventId ? (
              <p className="text-sm text-muted-foreground">Please select an event first.</p>
            ) : participationDateOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No participation dates available for this event.</p>
            ) : (
              <Controller
                name="participationDate"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
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
            )}
            {errors.participationDate && (
              <p className="text-xs text-destructive">{errors.participationDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Time of participation</Label>
            <Controller
              name="participationTime"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col gap-3"
                >
                  {PARTICIPATION_TIMES.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <RadioGroupItem value={option.value} id={`edit-time-${option.value}`} />
                      <Label htmlFor={`edit-time-${option.value}`} className="font-normal cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
          </div>

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

          <div className="space-y-2">
            <Label>Food preference</Label>
            <Controller
              name="foodPreference"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !registration}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

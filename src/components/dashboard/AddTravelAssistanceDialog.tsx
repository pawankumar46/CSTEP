"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plane } from "lucide-react";
import { AdminAssistanceEventUserFields } from "@/components/dashboard/AdminAssistanceEventUserFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  adminTravelAssistSchema,
  EMPTY_ADMIN_TRAVEL,
  type AdminTravelAssistFormValues,
} from "@/features/dashboard/admin-travel.schema";
import type { Event } from "@/types";

const TRANSPORT_OPTIONS = [
  { value: "flight" as const, label: "Flight" },
  { value: "train" as const, label: "Train" },
  { value: "taxi" as const, label: "Taxi" },
];

interface AddTravelAssistanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: Event[];
  eventsLoading?: boolean;
  defaultEventId?: string | null;
  onSubmit: (values: AdminTravelAssistFormValues) => Promise<void>;
}

export function AddTravelAssistanceDialog({
  open,
  onOpenChange,
  events,
  eventsLoading = false,
  defaultEventId,
  onSubmit,
}: AddTravelAssistanceDialogProps) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdminTravelAssistFormValues>({
    resolver: zodResolver(adminTravelAssistSchema),
    defaultValues: EMPTY_ADMIN_TRAVEL,
  });

  const transportMode = watch("transportMode");
  const selectedUserId = watch("userId");
  const selectedEventId = watch("eventId");

  useEffect(() => {
    if (!open) return;

    const fallbackEventId =
      defaultEventId && events.some((event) => event.id === defaultEventId)
        ? defaultEventId
        : events[0]?.id ?? "";

    reset({
      ...EMPTY_ADMIN_TRAVEL,
      eventId: fallbackEventId,
    });
  }, [open, reset, defaultEventId, events]);

  const clearTransportFields = () => {
    setValue("departureCity", "");
    setValue("arrivalCity", "");
    setValue("departureDate", "");
    setValue("pickupAddress", "");
    setValue("dropAddress", "");
    setValue("travelDate", "");
  };

  const handleFormSubmit = async (values: AdminTravelAssistFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Add travel assistance
          </DialogTitle>
          <DialogDescription>
            Select a user and event, then enter travel details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(handleFormSubmit)(event)} className="space-y-4">
          <AdminAssistanceEventUserFields
            control={control}
            errors={errors}
            events={events}
            eventsLoading={eventsLoading}
          />

          <div className="space-y-2">
            <Label>Mode of transport</Label>
            <Controller
              name="transportMode"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={(mode) => {
                    field.onChange(mode);
                    clearTransportFields();
                  }}
                  value={field.value}
                  className="flex flex-wrap gap-4"
                >
                  {TRANSPORT_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <RadioGroupItem value={option.value} id={`admin-transport-${option.value}`} />
                      <Label htmlFor={`admin-transport-${option.value}`} className="font-normal">
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

          {(transportMode === "flight" || transportMode === "train") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-departureCity">Departure city</Label>
                <Controller
                  name="departureCity"
                  control={control}
                  render={({ field }) => (
                    <Input id="admin-departureCity" placeholder="e.g. Mumbai" {...field} />
                  )}
                />
                {errors.departureCity && (
                  <p className="text-xs text-destructive">{errors.departureCity.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-arrivalCity">Arrival city</Label>
                <Controller
                  name="arrivalCity"
                  control={control}
                  render={({ field }) => (
                    <Input id="admin-arrivalCity" placeholder="e.g. Bengaluru" {...field} />
                  )}
                />
                {errors.arrivalCity && (
                  <p className="text-xs text-destructive">{errors.arrivalCity.message}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="admin-departureDate">Travel date</Label>
                <Controller
                  name="departureDate"
                  control={control}
                  render={({ field }) => (
                    <Input id="admin-departureDate" type="date" {...field} />
                  )}
                />
                {errors.departureDate && (
                  <p className="text-xs text-destructive">{errors.departureDate.message}</p>
                )}
              </div>
            </div>
          )}

          {transportMode === "taxi" && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-pickupAddress">Pickup address</Label>
                <Controller
                  name="pickupAddress"
                  control={control}
                  render={({ field }) => (
                    <Input id="admin-pickupAddress" placeholder="Pickup location" {...field} />
                  )}
                />
                {errors.pickupAddress && (
                  <p className="text-xs text-destructive">{errors.pickupAddress.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-dropAddress">Drop address</Label>
                <Controller
                  name="dropAddress"
                  control={control}
                  render={({ field }) => (
                    <Input id="admin-dropAddress" placeholder="Drop location" {...field} />
                  )}
                />
                {errors.dropAddress && (
                  <p className="text-xs text-destructive">{errors.dropAddress.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-travelDate">Travel date</Label>
                <Controller
                  name="travelDate"
                  control={control}
                  render={({ field }) => (
                    <Input id="admin-travelDate" type="date" {...field} />
                  )}
                />
                {errors.travelDate && (
                  <p className="text-xs text-destructive">{errors.travelDate.message}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedUserId || !selectedEventId}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add travel assistance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

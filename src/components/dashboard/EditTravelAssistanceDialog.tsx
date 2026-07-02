"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plane } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatEventDateRange } from "@/lib/event-display";
import { getTodayDateInputMin } from "@/lib/date-input";
import {
  travelEditSchema,
  EMPTY_TRAVEL_EDIT,
  type TravelEditFormValues,
} from "@/features/dashboard/admin-travel.schema";
import type { Event, TravelAssistanceRow } from "@/types";

const TRANSPORT_OPTIONS = [
  { value: "flight" as const, label: "Flight" },
  { value: "train" as const, label: "Train" },
  { value: "taxi" as const, label: "Taxi" },
];

function travelRowToEditValues(row: TravelAssistanceRow, eventId: string): TravelEditFormValues {
  const mode = row.transportMode.toUpperCase();
  const transportMode = mode === "FLIGHT" ? "flight" : mode === "TRAIN" ? "train" : "taxi";
  const isTaxi = transportMode === "taxi";

  return {
    eventId,
    transportMode,
    departureCity: isTaxi ? "" : row.sourceLocation,
    arrivalCity: isTaxi ? "" : row.destinationLocation,
    departureDate: isTaxi ? "" : row.travelDate,
    pickupAddress: isTaxi ? row.sourceLocation : "",
    dropAddress: isTaxi ? row.destinationLocation : "",
    travelDate: isTaxi ? row.travelDate : "",
  };
}

interface EditTravelAssistanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: TravelAssistanceRow | null;
  events: Event[];
  eventsLoading?: boolean;
  defaultEventId?: string | null;
  onSubmit: (id: string, values: TravelEditFormValues) => Promise<void>;
}

export function EditTravelAssistanceDialog({
  open,
  onOpenChange,
  row,
  events,
  eventsLoading = false,
  defaultEventId,
  onSubmit,
}: EditTravelAssistanceDialogProps) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TravelEditFormValues>({
    resolver: zodResolver(travelEditSchema),
    defaultValues: EMPTY_TRAVEL_EDIT,
  });

  const transportMode = watch("transportMode");
  const minDate = getTodayDateInputMin();

  useEffect(() => {
    if (!open || !row) return;

    const fallbackEventId =
      defaultEventId && events.some((event) => event.id === defaultEventId)
        ? defaultEventId
        : events[0]?.id ?? "";

    reset(travelRowToEditValues(row, fallbackEventId));
  }, [open, reset, row, defaultEventId, events]);

  const clearTransportFields = () => {
    setValue("departureCity", "");
    setValue("arrivalCity", "");
    setValue("departureDate", "");
    setValue("pickupAddress", "");
    setValue("dropAddress", "");
    setValue("travelDate", "");
  };

  const handleFormSubmit = async (values: TravelEditFormValues) => {
    if (!row) return;
    await onSubmit(row.id, values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Edit travel assistance
          </DialogTitle>
          <DialogDescription>
            Update event and travel details for {row?.userName ?? "this user"}.
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
                      <RadioGroupItem value={option.value} id={`edit-transport-${option.value}`} />
                      <Label htmlFor={`edit-transport-${option.value}`} className="font-normal">
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
                <Label htmlFor="edit-departureCity">Departure city</Label>
                <Controller
                  name="departureCity"
                  control={control}
                  render={({ field }) => (
                    <Input id="edit-departureCity" placeholder="e.g. Mumbai" {...field} />
                  )}
                />
                {errors.departureCity && (
                  <p className="text-xs text-destructive">{errors.departureCity.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-arrivalCity">Arrival city</Label>
                <Controller
                  name="arrivalCity"
                  control={control}
                  render={({ field }) => (
                    <Input id="edit-arrivalCity" placeholder="e.g. Bengaluru" {...field} />
                  )}
                />
                {errors.arrivalCity && (
                  <p className="text-xs text-destructive">{errors.arrivalCity.message}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-departureDate">Travel date</Label>
                <Controller
                  name="departureDate"
                  control={control}
                  render={({ field }) => (
                    <Input id="edit-departureDate" type="date" min={minDate} {...field} />
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
                <Label htmlFor="edit-pickupAddress">Pickup address</Label>
                <Controller
                  name="pickupAddress"
                  control={control}
                  render={({ field }) => (
                    <Input id="edit-pickupAddress" placeholder="Pickup location" {...field} />
                  )}
                />
                {errors.pickupAddress && (
                  <p className="text-xs text-destructive">{errors.pickupAddress.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dropAddress">Drop address</Label>
                <Controller
                  name="dropAddress"
                  control={control}
                  render={({ field }) => (
                    <Input id="edit-dropAddress" placeholder="Drop location" {...field} />
                  )}
                />
                {errors.dropAddress && (
                  <p className="text-xs text-destructive">{errors.dropAddress.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-travelDate">Travel date</Label>
                <Controller
                  name="travelDate"
                  control={control}
                  render={({ field }) => (
                    <Input id="edit-travelDate" type="date" min={minDate} {...field} />
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
            <Button type="submit" disabled={isSubmitting || !row}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

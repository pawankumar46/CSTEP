"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Hotel, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatEventDateRange } from "@/lib/event-display";
import {
  accommodationEditSchema,
  EMPTY_ACCOMMODATION_EDIT,
  type AccommodationEditFormValues,
} from "@/features/dashboard/admin-accommodation.schema";
import type { AccommodationAssistanceRow, Event } from "@/types";

interface EditAccommodationAssistanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: AccommodationAssistanceRow | null;
  events: Event[];
  eventsLoading?: boolean;
  defaultEventId?: string | null;
  onSubmit: (id: string, values: AccommodationEditFormValues) => Promise<void>;
}

export function EditAccommodationAssistanceDialog({
  open,
  onOpenChange,
  row,
  events,
  eventsLoading = false,
  defaultEventId,
  onSubmit,
}: EditAccommodationAssistanceDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccommodationEditFormValues>({
    resolver: zodResolver(accommodationEditSchema),
    defaultValues: EMPTY_ACCOMMODATION_EDIT,
  });

  useEffect(() => {
    if (!open || !row) return;

    const fallbackEventId =
      row.eventId ||
      (defaultEventId && events.some((event) => event.id === defaultEventId)
        ? defaultEventId
        : events[0]?.id ?? "");

    reset({
      eventId: fallbackEventId,
      hotelName: row.hotelName,
      hotelAddress: row.address,
      roomNo: row.roomNo,
      accommodationFromDate: row.fromDate,
      accommodationToDate: row.toDate,
    });
  }, [open, reset, row, defaultEventId, events]);

  const handleFormSubmit = async (values: AccommodationEditFormValues) => {
    if (!row) return;
    await onSubmit(row.id, values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            Edit accommodation assistance
          </DialogTitle>
          <DialogDescription>
            Update event and accommodation details for {row?.userName ?? "this user"}.
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
            <Label htmlFor="edit-hotelName">Hotel name</Label>
            <Controller
              name="hotelName"
              control={control}
              render={({ field }) => (
                <Input id="edit-hotelName" placeholder="e.g. Taj Palace" {...field} />
              )}
            />
            {errors.hotelName && (
              <p className="text-xs text-destructive">{errors.hotelName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-hotelAddress">Address</Label>
            <Controller
              name="hotelAddress"
              control={control}
              render={({ field }) => (
                <Input id="edit-hotelAddress" placeholder="Hotel address" {...field} />
              )}
            />
            {errors.hotelAddress && (
              <p className="text-xs text-destructive">{errors.hotelAddress.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-roomNo">Room number</Label>
            <Controller
              name="roomNo"
              control={control}
              render={({ field }) => (
                <Input id="edit-roomNo" placeholder="e.g. 204" {...field} />
              )}
            />
            {errors.roomNo && (
              <p className="text-xs text-destructive">{errors.roomNo.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-accommodationFromDate">From date</Label>
              <Controller
                name="accommodationFromDate"
                control={control}
                render={({ field }) => (
                  <Input id="edit-accommodationFromDate" type="date" {...field} />
                )}
              />
              {errors.accommodationFromDate && (
                <p className="text-xs text-destructive">{errors.accommodationFromDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-accommodationToDate">To date</Label>
              <Controller
                name="accommodationToDate"
                control={control}
                render={({ field }) => (
                  <Input id="edit-accommodationToDate" type="date" {...field} />
                )}
              />
              {errors.accommodationToDate && (
                <p className="text-xs text-destructive">{errors.accommodationToDate.message}</p>
              )}
            </div>
          </div>

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

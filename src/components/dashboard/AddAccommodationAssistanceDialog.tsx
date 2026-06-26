"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Hotel, Loader2 } from "lucide-react";
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
import {
  adminAccommodationAssistSchema,
  EMPTY_ADMIN_ACCOMMODATION,
  type AdminAccommodationAssistFormValues,
} from "@/features/dashboard/admin-accommodation.schema";
import type { Event } from "@/types";

interface AddAccommodationAssistanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: Event[];
  eventsLoading?: boolean;
  defaultEventId?: string | null;
  onSubmit: (values: AdminAccommodationAssistFormValues) => Promise<void>;
}

export function AddAccommodationAssistanceDialog({
  open,
  onOpenChange,
  events,
  eventsLoading = false,
  defaultEventId,
  onSubmit,
}: AddAccommodationAssistanceDialogProps) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminAccommodationAssistFormValues>({
    resolver: zodResolver(adminAccommodationAssistSchema),
    defaultValues: EMPTY_ADMIN_ACCOMMODATION,
  });

  const selectedUserId = watch("userId");
  const selectedEventId = watch("eventId");

  useEffect(() => {
    if (!open) return;

    const fallbackEventId =
      defaultEventId && events.some((event) => event.id === defaultEventId)
        ? defaultEventId
        : events[0]?.id ?? "";

    reset({
      ...EMPTY_ADMIN_ACCOMMODATION,
      eventId: fallbackEventId,
    });
  }, [open, reset, defaultEventId, events]);

  const handleFormSubmit = async (values: AdminAccommodationAssistFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            Add accommodation assistance
          </DialogTitle>
          <DialogDescription>
            Select a user and event, then enter accommodation details.
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
            <Label htmlFor="admin-hotelName">Hotel name</Label>
            <Controller
              name="hotelName"
              control={control}
              render={({ field }) => (
                <Input id="admin-hotelName" placeholder="e.g. Taj Palace" {...field} />
              )}
            />
            {errors.hotelName && (
              <p className="text-xs text-destructive">{errors.hotelName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-hotelAddress">Address</Label>
            <Controller
              name="hotelAddress"
              control={control}
              render={({ field }) => (
                <Input id="admin-hotelAddress" placeholder="Hotel address" {...field} />
              )}
            />
            {errors.hotelAddress && (
              <p className="text-xs text-destructive">{errors.hotelAddress.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-roomNo">Room number</Label>
            <Controller
              name="roomNo"
              control={control}
              render={({ field }) => (
                <Input id="admin-roomNo" placeholder="e.g. 204" {...field} />
              )}
            />
            {errors.roomNo && (
              <p className="text-xs text-destructive">{errors.roomNo.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-accommodationFromDate">From date</Label>
              <Controller
                name="accommodationFromDate"
                control={control}
                render={({ field }) => (
                  <Input id="admin-accommodationFromDate" type="date" {...field} />
                )}
              />
              {errors.accommodationFromDate && (
                <p className="text-xs text-destructive">{errors.accommodationFromDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-accommodationToDate">To date</Label>
              <Controller
                name="accommodationToDate"
                control={control}
                render={({ field }) => (
                  <Input id="admin-accommodationToDate" type="date" {...field} />
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
            <Button type="submit" disabled={isSubmitting || !selectedUserId || !selectedEventId}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add accommodation assistance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

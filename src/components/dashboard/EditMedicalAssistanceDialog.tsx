"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Stethoscope } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
  medicalEditSchema,
  EMPTY_MEDICAL_EDIT,
  type MedicalEditFormValues,
} from "@/features/dashboard/admin-medical.schema";
import type { Event, MedicalAssistanceRow } from "@/types";

interface EditMedicalAssistanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: MedicalAssistanceRow | null;
  events: Event[];
  eventsLoading?: boolean;
  defaultEventId?: string | null;
  onSubmit: (id: string, values: MedicalEditFormValues) => Promise<void>;
}

export function EditMedicalAssistanceDialog({
  open,
  onOpenChange,
  row,
  events,
  eventsLoading = false,
  defaultEventId,
  onSubmit,
}: EditMedicalAssistanceDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MedicalEditFormValues>({
    resolver: zodResolver(medicalEditSchema),
    defaultValues: EMPTY_MEDICAL_EDIT,
  });

  const minDate = getTodayDateInputMin();

  useEffect(() => {
    if (!open || !row) return;

    const fallbackEventId =
      defaultEventId && events.some((event) => event.id === defaultEventId)
        ? defaultEventId
        : events[0]?.id ?? "";

    reset({
      eventId: fallbackEventId,
      medicalRequirement: row.medicalNeeds,
      medicalRequiredDate: row.requiredDate,
    });
  }, [open, reset, row, defaultEventId, events]);

  const handleFormSubmit = async (values: MedicalEditFormValues) => {
    if (!row) return;
    await onSubmit(row.id, values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Edit medical assistance
          </DialogTitle>
          <DialogDescription>
            Update event and medical support details for {row?.userName ?? "this user"}.
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
            <Label htmlFor="edit-medicalRequirement">Medical requirement</Label>
            <Controller
              name="medicalRequirement"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="edit-medicalRequirement"
                  rows={4}
                  placeholder="Wheelchair assistance, first aid support..."
                  {...field}
                />
              )}
            />
            {errors.medicalRequirement && (
              <p className="text-xs text-destructive">{errors.medicalRequirement.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-medicalRequiredDate">Required date</Label>
            <Controller
              name="medicalRequiredDate"
              control={control}
              render={({ field }) => (
                <Input id="edit-medicalRequiredDate" type="date" min={minDate} {...field} />
              )}
            />
            {errors.medicalRequiredDate && (
              <p className="text-xs text-destructive">{errors.medicalRequiredDate.message}</p>
            )}
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

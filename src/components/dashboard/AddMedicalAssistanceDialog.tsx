"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Stethoscope } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  adminMedicalAssistSchema,
  EMPTY_ADMIN_MEDICAL,
  type AdminMedicalAssistFormValues,
} from "@/features/dashboard/admin-medical.schema";
import type { Event } from "@/types";

interface AddMedicalAssistanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: Event[];
  eventsLoading?: boolean;
  defaultEventId?: string | null;
  onSubmit: (values: AdminMedicalAssistFormValues) => Promise<void>;
}

export function AddMedicalAssistanceDialog({
  open,
  onOpenChange,
  events,
  eventsLoading = false,
  defaultEventId,
  onSubmit,
}: AddMedicalAssistanceDialogProps) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminMedicalAssistFormValues>({
    resolver: zodResolver(adminMedicalAssistSchema),
    defaultValues: EMPTY_ADMIN_MEDICAL,
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
      ...EMPTY_ADMIN_MEDICAL,
      eventId: fallbackEventId,
    });
  }, [open, reset, defaultEventId, events]);

  const handleFormSubmit = async (values: AdminMedicalAssistFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Add medical assistance
          </DialogTitle>
          <DialogDescription>
            Select a user and event, then enter medical support details.
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
            <Label htmlFor="admin-medicalRequirement">Medical requirement</Label>
            <Controller
              name="medicalRequirement"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="admin-medicalRequirement"
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
            <Label htmlFor="admin-medicalRequiredDate">Required date</Label>
            <Controller
              name="medicalRequiredDate"
              control={control}
              render={({ field }) => (
                <Input id="admin-medicalRequiredDate" type="date" {...field} />
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
            <Button type="submit" disabled={isSubmitting || !selectedUserId || !selectedEventId}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add medical assistance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

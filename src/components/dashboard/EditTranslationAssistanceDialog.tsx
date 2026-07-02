"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Languages, Loader2 } from "lucide-react";
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
import { getTodayDateInputMin } from "@/lib/date-input";
import {
  translationEditSchema,
  EMPTY_TRANSLATION_EDIT,
  type TranslationEditFormValues,
} from "@/features/dashboard/admin-translation.schema";
import { TRANSLATION_LANGUAGES } from "@/lib/registration-options";
import type { Event, TranslationAssistanceRow } from "@/types";

interface EditTranslationAssistanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: TranslationAssistanceRow | null;
  events: Event[];
  eventsLoading?: boolean;
  defaultEventId?: string | null;
  onSubmit: (id: string, values: TranslationEditFormValues) => Promise<void>;
}

export function EditTranslationAssistanceDialog({
  open,
  onOpenChange,
  row,
  events,
  eventsLoading = false,
  defaultEventId,
  onSubmit,
}: EditTranslationAssistanceDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TranslationEditFormValues>({
    resolver: zodResolver(translationEditSchema),
    defaultValues: EMPTY_TRANSLATION_EDIT,
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
      translationLanguage: row.language,
      translationRequiredDate: row.requiredDate,
    });
  }, [open, reset, row, defaultEventId, events]);

  const handleFormSubmit = async (values: TranslationEditFormValues) => {
    if (!row) return;
    await onSubmit(row.id, values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Edit translation assistance
          </DialogTitle>
          <DialogDescription>
            Update event and translation details for {row?.userName ?? "this user"}.
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
            <Label>Language</Label>
            <Controller
              name="translationLanguage"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
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
            <Label htmlFor="edit-translationRequiredDate">Required date</Label>
            <Controller
              name="translationRequiredDate"
              control={control}
              render={({ field }) => (
                <Input id="edit-translationRequiredDate" type="date" min={minDate} {...field} />
              )}
            />
            {errors.translationRequiredDate && (
              <p className="text-xs text-destructive">{errors.translationRequiredDate.message}</p>
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

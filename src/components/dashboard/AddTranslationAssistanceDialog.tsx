"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Languages, Loader2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminTranslationAssistSchema,
  EMPTY_ADMIN_TRANSLATION,
  type AdminTranslationAssistFormValues,
} from "@/features/dashboard/admin-translation.schema";
import { TRANSLATION_LANGUAGES } from "@/lib/registration-options";
import type { Event } from "@/types";

interface AddTranslationAssistanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: Event[];
  eventsLoading?: boolean;
  defaultEventId?: string | null;
  onSubmit: (values: AdminTranslationAssistFormValues) => Promise<void>;
}

export function AddTranslationAssistanceDialog({
  open,
  onOpenChange,
  events,
  eventsLoading = false,
  defaultEventId,
  onSubmit,
}: AddTranslationAssistanceDialogProps) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminTranslationAssistFormValues>({
    resolver: zodResolver(adminTranslationAssistSchema),
    defaultValues: EMPTY_ADMIN_TRANSLATION,
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
      ...EMPTY_ADMIN_TRANSLATION,
      eventId: fallbackEventId,
    });
  }, [open, reset, defaultEventId, events]);

  const handleFormSubmit = async (values: AdminTranslationAssistFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Add translation assistance
          </DialogTitle>
          <DialogDescription>
            Select a user and event, then enter translation support details.
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
            <Label>Language required</Label>
            <Controller
              name="translationLanguage"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
            <Label htmlFor="admin-translationRequiredDate">Required date</Label>
            <Controller
              name="translationRequiredDate"
              control={control}
              render={({ field }) => (
                <Input id="admin-translationRequiredDate" type="date" {...field} />
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
            <Button type="submit" disabled={isSubmitting || !selectedUserId || !selectedEventId}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add translation assistance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

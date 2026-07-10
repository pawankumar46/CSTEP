"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  SCHEDULE_ITEM_TYPE_OPTIONS,
  SCHEDULER_DAY_END_MINUTES,
  SCHEDULER_DAY_START_MINUTES,
  SCHEDULER_DURATION_PRESETS,
  formatMinutesLabel,
  minutesToTimeInput,
  scheduleTypeToTimelineType,
  timeInputToMinutes,
  type ScheduleItemType,
  type TimelineItem,
  type TimelineItemType,
} from "@/lib/session-scheduler";
import { SchedulerTimePicker } from "@/components/dashboard/session-scheduler/SchedulerTimePicker";

const formSchema = z
  .object({
    sessionType: z.enum([
      "SESSION",
      "BREAKFAST_BREAK",
      "TEA_BREAK",
      "LUNCH_BREAK",
      "DINNER_BREAK",
      "NETWORKING_BREAK",
      "CUSTOM_BREAK",
    ]),
    label: z.string().trim().min(1, "Label is required"),
    startTime: z.string().min(1, "Start time is required"),
    duration: z
      .number({ error: "Duration is required" })
      .int()
      .min(5, "Minimum duration is 5 minutes")
      .max(SCHEDULER_DAY_END_MINUTES - SCHEDULER_DAY_START_MINUTES, "Duration is too long"),
  })
  .superRefine((data, ctx) => {
    const start = timeInputToMinutes(data.startTime);
    if (start < SCHEDULER_DAY_START_MINUTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start time cannot be before 9:00 AM",
        path: ["startTime"],
      });
    }
    if (start > SCHEDULER_DAY_END_MINUTES - 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start time cannot be after 5:55 PM",
        path: ["startTime"],
      });
    }
  });

export type SessionItemFormValues = z.infer<typeof formSchema>;

interface SessionItemModalProps {
  open: boolean;
  mode: "add" | "edit";
  itemType: TimelineItemType;
  initialItem?: TimelineItem | null;
  onClose: () => void;
  onSave: (values: SessionItemFormValues) => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function SessionItemModal({
  open,
  mode,
  itemType,
  initialItem,
  onClose,
  onSave,
  onDelete,
  isDeleting = false,
}: SessionItemModalProps) {
  const defaults = useMemo(
    (): SessionItemFormValues => ({
      sessionType:
        initialItem?.sessionType ??
        (itemType === "session" ? "SESSION" : "CUSTOM_BREAK"),
      label: initialItem?.label ?? "",
      startTime: minutesToTimeInput(initialItem?.start ?? SCHEDULER_DAY_START_MINUTES),
      duration: initialItem?.duration ?? 60,
    }),
    [initialItem, itemType],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SessionItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  const startTime = watch("startTime");
  const duration = watch("duration");

  const endPreview = useMemo(() => {
    const start = timeInputToMinutes(startTime || "09:00");
    return formatMinutesLabel(start + (Number(duration) || 0));
  }, [startTime, duration]);

  const title =
    mode === "edit"
      ? itemType === "break"
        ? "Edit break"
        : "Edit session"
      : itemType === "break"
        ? "Add break"
        : "Add session";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {itemType === "break"
              ? "Block off time for a break between meetings."
              : "Schedule a meeting or appointment on the timeline."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="space-y-2">
            <Label>Session type</Label>
            <Select
              value={watch("sessionType")}
              onValueChange={(value) =>
                setValue("sessionType", value as ScheduleItemType, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULE_ITEM_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-label">Label</Label>
            <Input
              id="session-label"
              placeholder={
                scheduleTypeToTimelineType(watch("sessionType")) === "break"
                  ? "Lunch break"
                  : "Session 1 - Keynote"
              }
              {...register("label")}
            />
            {errors.label && (
              <p className="text-sm text-destructive">{errors.label.message}</p>
            )}
          </div>

          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <SchedulerTimePicker
                id="session-start"
                label="Start time"
                value={field.value}
                onChange={field.onChange}
                error={errors.startTime?.message}
              />
            )}
          />

          <div className="space-y-2">
            <Label htmlFor="session-duration">Duration (minutes)</Label>
            <div className="flex flex-wrap gap-2">
              {SCHEDULER_DURATION_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant={duration === preset ? "default" : "outline"}
                  className="h-7 tabular-nums"
                  onClick={() => setValue("duration", preset, { shouldValidate: true })}
                >
                  {preset}m
                </Button>
              ))}
            </div>
            <Input
              id="session-duration"
              type="number"
              min={5}
              step={5}
              className="tabular-nums"
              {...register("duration", { valueAsNumber: true })}
            />
            {errors.duration && (
              <p className="text-sm text-destructive">{errors.duration.message}</p>
            )}
          </div>

          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground tabular-nums">
            Ends at <span className="font-medium text-foreground">{endPreview}</span>
          </p>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            {mode === "edit" && onDelete ? (
              <Button
                type="button"
                variant="link"
                className={cn("h-auto p-0 text-destructive hover:text-destructive")}
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2 sm:ml-auto">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isDeleting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isDeleting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : mode === "edit" ? (
                  "Save changes"
                ) : (
                  "Add to timeline"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getAttendanceModeOptions } from "@/lib/registration-options";
import {
  getEventDaysDropdown,
  updateEventDayAttendanceModes,
  type EventDayDropdownOption,
} from "@/services/event.service";
import type { AttendanceMode, Event } from "@/types";

const ALL_ATTENDANCE_MODES: AttendanceMode[] = ["physical", "virtual"];

interface EditAttendanceModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
}

function modesEqual(a: AttendanceMode[], b: AttendanceMode[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((mode, index) => mode === sortedB[index]);
}

export function EditAttendanceModeDialog({
  open,
  onOpenChange,
  event,
}: EditAttendanceModeDialogProps) {
  const [days, setDays] = useState<EventDayDropdownOption[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [modeByDay, setModeByDay] = useState<Record<string, AttendanceMode[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedDay = useMemo(
    () => days.find((day) => day.id === selectedDayId) ?? null,
    [days, selectedDayId],
  );

  const selectedModes = selectedDayId ? (modeByDay[selectedDayId] ?? []) : [];

  const changedDayIds = useMemo(
    () =>
      days
        .filter((day) => !modesEqual(day.allowedAttendanceModes, modeByDay[day.id] ?? []))
        .map((day) => day.id),
    [days, modeByDay],
  );

  const resetState = useCallback(() => {
    setDays([]);
    setSelectedDayId(null);
    setModeByDay({});
    setError(null);
    setFormError(null);
    setSuccessMessage(null);
  }, []);

  useEffect(() => {
    if (!open || !event?.id) {
      resetState();
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setFormError(null);
      setSuccessMessage(null);

      try {
        const fetchedDays = await getEventDaysDropdown(event.id);
        if (cancelled) return;

        const initialModes = Object.fromEntries(
          fetchedDays.map((day) => [day.id, [...day.allowedAttendanceModes]]),
        );

        setDays(fetchedDays);
        setModeByDay(initialModes);
        setSelectedDayId(fetchedDays[0]?.id ?? null);
      } catch (err) {
        if (!cancelled) {
          setDays([]);
          setModeByDay({});
          setSelectedDayId(null);
          setError(err instanceof Error ? err.message : "Failed to load event days");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, event?.id, resetState]);

  const toggleMode = (mode: AttendanceMode, checked: boolean) => {
    if (!selectedDayId) return;

    setFormError(null);
    setSuccessMessage(null);
    setModeByDay((prev) => {
      const current = prev[selectedDayId] ?? [];
      const next = checked
        ? [...current, mode].filter((value, index, list) => list.indexOf(value) === index)
        : current.filter((value) => value !== mode);
      return { ...prev, [selectedDayId]: next };
    });
  };

  const handleSave = async () => {
    if (changedDayIds.length === 0) {
      setFormError("No attendance mode changes to save.");
      return;
    }

    const invalidDay = changedDayIds.find((dayId) => (modeByDay[dayId] ?? []).length === 0);
    if (invalidDay) {
      const day = days.find((entry) => entry.id === invalidDay);
      setFormError(`Select at least one attendance mode for ${day?.label ?? "the selected day"}.`);
      return;
    }

    setSaving(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      await Promise.all(
        changedDayIds.map((dayId) =>
          updateEventDayAttendanceModes(dayId, modeByDay[dayId] ?? []),
        ),
      );

      setDays((prev) =>
        prev.map((day) =>
          changedDayIds.includes(day.id)
            ? { ...day, allowedAttendanceModes: [...(modeByDay[day.id] ?? [])] }
            : day,
        ),
      );
      setSuccessMessage("Attendance modes updated successfully.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update attendance modes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Attendance Mode</DialogTitle>
          <DialogDescription>
            {event
              ? `Choose a date for "${event.name}" and set which attendance modes are allowed.`
              : "Choose a date and set which attendance modes are allowed."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading event days...
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        ) : days.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No event days found for this event.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select date</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {days.map((day) => {
                  const isSelected = day.id === selectedDayId;
                  const dayModes = modeByDay[day.id] ?? [];
                  const isDirty = !modesEqual(day.allowedAttendanceModes, dayModes);

                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => {
                        setSelectedDayId(day.id);
                        setFormError(null);
                        setSuccessMessage(null);
                      }}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <p className="text-sm font-medium">{day.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dayModes.length > 0
                          ? dayModes.map((mode) => getAttendanceModeOptions([mode])[0]?.label).join(", ")
                          : "No modes selected"}
                      </p>
                      {isDirty && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Unsaved changes</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDay && (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{selectedDay.label}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select one or both attendance modes for this date.
                </p>
                <div className="space-y-3">
                  {ALL_ATTENDANCE_MODES.map((mode) => {
                    const option = getAttendanceModeOptions([mode])[0];
                    const checked = selectedModes.includes(mode);

                    return (
                      <div key={mode} className="flex items-center gap-2">
                        <Checkbox
                          id={`attendance-mode-${selectedDay.id}-${mode}`}
                          checked={checked}
                          onCheckedChange={(value) => toggleMode(mode, !!value)}
                        />
                        <Label
                          htmlFor={`attendance-mode-${selectedDay.id}-${mode}`}
                          className="font-normal cursor-pointer"
                        >
                          {option?.label ?? mode}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {formError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>
            )}
            {successMessage && (
              <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                {successMessage}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading || !!error || days.length === 0 || changedDayIds.length === 0}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

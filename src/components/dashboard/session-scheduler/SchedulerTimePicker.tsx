"use client";

import { useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SCHEDULER_MINUTE_OPTIONS,
  timeInputTo12HourParts,
  twelveHourPartsToTimeInput,
  type TwelveHourPeriod,
} from "@/lib/session-scheduler";

interface SchedulerTimePickerProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function formatMinuteLabel(minute: number): string {
  return String(minute).padStart(2, "0");
}

export function SchedulerTimePicker({
  id = "session-start",
  label = "Start time",
  value,
  onChange,
  error,
}: SchedulerTimePickerProps) {
  const parts = timeInputTo12HourParts(value || "09:00");
  const hourOptions = useMemo(
    () => (parts.period === "AM" ? [9, 10, 11] : [12, 1, 2, 3, 4, 5]),
    [parts.period],
  );

  const update = (next: Partial<typeof parts>) => {
    onChange(twelveHourPartsToTimeInput({ ...parts, ...next }));
  };

  useEffect(() => {
    if (!hourOptions.includes(parts.hour12)) {
      onChange(
        twelveHourPartsToTimeInput({
          ...parts,
          hour12: hourOptions[0],
        }),
      );
    }
  }, [hourOptions, onChange, parts]);

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-hour`}>{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        <Select
          value={String(parts.hour12)}
          onValueChange={(hour) => update({ hour12: Number(hour) })}
        >
          <SelectTrigger id={`${id}-hour`} className="tabular-nums">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent side="top" align="start" sideOffset={6}>
            {hourOptions.map((hour) => (
              <SelectItem key={hour} value={String(hour)}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(parts.minute)}
          onValueChange={(minute) => update({ minute: Number(minute) })}
        >
          <SelectTrigger id={`${id}-minute`} className="tabular-nums">
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent side="top" align="start" sideOffset={6}>
            {SCHEDULER_MINUTE_OPTIONS.map((minute) => (
              <SelectItem key={minute} value={String(minute)}>
                {formatMinuteLabel(minute)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={parts.period}
          onValueChange={(period) => update({ period: period as TwelveHourPeriod })}
        >
          <SelectTrigger id={`${id}-period`}>
            <SelectValue placeholder="AM/PM" />
          </SelectTrigger>
          <SelectContent side="top" align="start" sideOffset={6}>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Timeline window: 9:00 AM – 6:00 PM</p>
      )}
    </div>
  );
}

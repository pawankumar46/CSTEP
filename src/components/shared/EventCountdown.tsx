"use client";

import { useEffect, useState } from "react";
import { getEventCountdown } from "@/lib/event-display";
import { cn } from "@/lib/utils";

interface EventCountdownProps {
  eventStart: string;
  className?: string;
}

function CountdownSegment({ value, unit }: { value: number; unit: string }) {
  return (
    <span className="inline-flex items-baseline gap-0.5 tabular-nums">
      <span className="text-sm font-bold text-primary">{value}</span>
      <span className="text-[10px] font-medium text-muted-foreground">{unit}</span>
    </span>
  );
}

export function EventCountdown({ eventStart, className }: EventCountdownProps) {
  const [parts, setParts] = useState(() => getEventCountdown(eventStart));

  useEffect(() => {
    setParts(getEventCountdown(eventStart));

    const interval = window.setInterval(() => {
      setParts(getEventCountdown(eventStart));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [eventStart]);

  return (
    <div
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm",
        className,
      )}
      aria-live="polite"
    >
      {parts.isPast ? (
        <span className="font-medium text-muted-foreground">Event started</span>
      ) : (
        <>
          <span className="whitespace-nowrap text-muted-foreground">Event starts in</span>
          <div
            className="inline-flex items-center gap-1"
            aria-label={`Event starts in ${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes, and ${parts.seconds} seconds`}
          >
            <CountdownSegment value={parts.days} unit="d" />
            <span className="font-bold text-primary">:</span>
            <CountdownSegment value={parts.hours} unit="h" />
            <span className="font-bold text-primary">:</span>
            <CountdownSegment value={parts.minutes} unit="m" />
            <span className="font-bold text-primary">:</span>
            <CountdownSegment value={parts.seconds} unit="s" />
          </div>
        </>
      )}
    </div>
  );
}

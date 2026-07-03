"use client";

import { useEffect, useState } from "react";
import { getEventCountdown } from "@/lib/event-display";
import { cn } from "@/lib/utils";
import type { EventStatus } from "@/types";

interface EventCountdownProps {
  eventStart: string;
  eventStatus?: EventStatus;
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

export function EventCountdown({ eventStart, eventStatus, className }: EventCountdownProps) {
  const [parts, setParts] = useState(() => getEventCountdown(eventStart));

  useEffect(() => {
    setParts(getEventCountdown(eventStart));

    const interval = window.setInterval(() => {
      setParts(getEventCountdown(eventStart));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [eventStart]);

  const isLive = eventStatus === "live";

  return (
    <div
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm",
        className,
      )}
      aria-live="polite"
    >
      {isLive ? (
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live now
        </span>
      ) : parts.isPast ? (
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

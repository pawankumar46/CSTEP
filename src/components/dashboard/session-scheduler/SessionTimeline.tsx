"use client";

import { useEffect, useState } from "react";
import {
  currentMinutesSinceMidnight,
  formatMinutesLabel,
  getHourMarkers,
  getNetworkingGaps,
  minutesToLeftPx,
  SCHEDULER_DAY_END_MINUTES,
  SCHEDULER_TIMELINE_WIDTH_PX,
  todayDateString,
  type TimelineItem,
} from "@/lib/session-scheduler";
import { NetworkingGapBlock } from "@/components/dashboard/session-scheduler/NetworkingGapBlock";
import { SessionBlock } from "@/components/dashboard/session-scheduler/SessionBlock";

interface SessionTimelineProps {
  selectedDate: string;
  items: TimelineItem[];
  onEdit: (item: TimelineItem) => void;
  onDelete: (id: string) => void;
  deletingItemId: string | null;
}

export function SessionTimeline({
  selectedDate,
  items,
  onEdit,
  onDelete,
  deletingItemId,
}: SessionTimelineProps) {
  const [nowMinutes, setNowMinutes] = useState(currentMinutesSinceMidnight());
  const isToday = selectedDate === todayDateString();
  const showNowLine = isToday && nowMinutes < SCHEDULER_DAY_END_MINUTES;

  useEffect(() => {
    if (!isToday) return;
    setNowMinutes(currentMinutesSinceMidnight());
    const interval = window.setInterval(() => {
      setNowMinutes(currentMinutesSinceMidnight());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [isToday]);

  const hourMarkers = getHourMarkers();
  const networkingGaps = getNetworkingGaps(items);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground sm:hidden">
        Scroll sideways to see the full day →
      </p>
      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <div
          className="relative min-h-[104px]"
          style={{ width: SCHEDULER_TIMELINE_WIDTH_PX, minWidth: "100%" }}
        >
          <div className="relative h-8 border-b border-border">
            {hourMarkers.map((minutes) => (
              <div
                key={minutes}
                className="absolute top-0 flex h-full flex-col justify-end pb-1"
                style={{ left: minutesToLeftPx(minutes) }}
              >
                <span className="-translate-x-1/2 text-[10px] tabular-nums text-muted-foreground">
                  {formatMinutesLabel(minutes)}
                </span>
              </div>
            ))}
          </div>

          <div className="relative h-24">
            {hourMarkers.map((minutes) => (
              <div
                key={`line-${minutes}`}
                className="absolute top-0 h-full w-px bg-border"
                style={{ left: minutesToLeftPx(minutes) }}
              />
            ))}

            {showNowLine && (
              <div
                className="absolute top-0 z-10 h-full w-0.5 bg-destructive"
                style={{ left: minutesToLeftPx(nowMinutes) }}
                aria-hidden
              />
            )}

            {networkingGaps.map((gap) => (
              <NetworkingGapBlock key={gap.id} gap={gap} />
            ))}

            {items.map((item) => (
              <SessionBlock
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                isDeleting={deletingItemId === item.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

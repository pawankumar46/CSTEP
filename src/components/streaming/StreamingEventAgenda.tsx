"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFeedbackSessionTimeRange } from "@/lib/feedback-options";
import {
  getIcasStreamAgendaForDay,
  ICAS_STREAM_AGENDA_DAYS,
  type IcasStreamAgendaDay,
} from "@/lib/icas-stream-agenda";
import { cn } from "@/lib/utils";

interface StreamingEventAgendaProps {
  compact?: boolean;
  className?: string;
}

export function StreamingEventAgenda({ compact = false, className }: StreamingEventAgendaProps) {
  const [selectedDay, setSelectedDay] = useState<IcasStreamAgendaDay>("2026-08-20");
  const items = useMemo(() => getIcasStreamAgendaForDay(selectedDay), [selectedDay]);

  return (
    <Card className={cn(compact && "flex flex-col min-h-0 flex-1 shadow-sm", className)}>
      <CardHeader className={cn("space-y-3", compact ? "py-3 px-4 shrink-0" : undefined)}>
        <CardTitle className={cn(compact ? "text-sm" : "text-base")}>Event Agenda</CardTitle>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Agenda day">
          {ICAS_STREAM_AGENDA_DAYS.map((day) => {
            const isActive = selectedDay === day.date;
            return (
              <button
                key={day.date}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedDay(day.date)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "space-y-2.5 overflow-y-auto",
          compact
            ? "px-4 pb-4 pt-0 flex-1 min-h-0 max-h-[220px] xl:max-h-none"
            : "max-h-[min(16rem,42vh)]",
        )}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex gap-2.5 text-sm border-b border-border/60 pb-2.5 last:border-0 last:pb-0",
              item.isBreak && "opacity-70",
            )}
          >
            <span
              className={cn(
                "text-[11px] font-mono w-[5.75rem] shrink-0 pt-0.5 leading-tight",
                item.isBreak ? "text-muted-foreground" : "text-primary",
              )}
            >
              {formatFeedbackSessionTimeRange(item.startTime, item.endTime)}
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  "leading-snug",
                  compact ? "text-sm font-medium" : "font-medium",
                  item.isBreak && "font-normal text-muted-foreground",
                )}
              >
                {item.title}
              </p>
              {item.speaker && !item.isBreak && (
                <p className="text-xs text-muted-foreground truncate">{item.speaker}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

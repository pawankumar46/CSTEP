"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  durationToWidthPx,
  formatTimeRange,
  formatTimeRangeShort,
  isCompactBlockWidth,
  isMediumBlockWidth,
  minutesToLeftPx,
  type TimelineItem,
} from "@/lib/session-scheduler";

interface SessionBlockProps {
  item: TimelineItem;
  onEdit: (item: TimelineItem) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function SessionBlock({
  item,
  onEdit,
  onDelete,
  isDeleting = false,
}: SessionBlockProps) {
  const start = item.start;
  const left = minutesToLeftPx(start);
  const width = durationToWidthPx(item.duration);
  const isBreak = item.type === "break";
  const isCompact = isCompactBlockWidth(width);
  const isMedium = isMediumBlockWidth(width);
  const timeLabel = isCompact || isMedium
    ? formatTimeRangeShort(start, item.duration)
    : formatTimeRange(start, item.duration);
  const tooltip = `${item.label} · ${formatTimeRange(start, item.duration)}`;

  return (
    <div
      role="button"
      tabIndex={0}
      title={tooltip}
      aria-label={`${item.label}, ${formatTimeRange(start, item.duration)}`}
      className={cn(
        "group absolute top-1.5 overflow-hidden rounded-md border text-left shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        isBreak
          ? "border-border bg-secondary text-secondary-foreground"
          : "border-primary/30 bg-primary/10 text-foreground",
        isCompact ? "flex h-[calc(100%-12px)] items-center px-1.5 py-1" : "h-[calc(100%-12px)] px-2 py-1.5",
      )}
      style={{ left, width }}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("[data-delete-btn]")) return;
        onEdit(item);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onEdit(item);
        }
      }}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        data-delete-btn
        aria-label={`Delete ${item.label}`}
        className={cn(
          "absolute right-0 top-0 z-10 h-5 w-5 shrink-0 opacity-0 hover:text-destructive",
          "group-hover:opacity-100 focus-visible:opacity-100",
          isCompact && "h-4 w-4",
        )}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onDelete(item.id);
        }}
        disabled={isDeleting}
      >
        {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
      </Button>

      {isCompact ? (
        <span className="min-w-0 flex-1 truncate pr-4 text-[10px] font-medium leading-none">
          {item.label}
        </span>
      ) : (
        <div className="flex h-full min-w-0 flex-col justify-between overflow-hidden pr-4">
          <span className="truncate text-xs font-medium leading-tight">{item.label}</span>
          <span className="truncate text-[10px] tabular-nums leading-none text-muted-foreground">
            {timeLabel}
          </span>
        </div>
      )}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import {
  formatTimeRangeShort,
  gapToWidthPx,
  isCompactBlockWidth,
  minutesToLeftPx,
  NETWORKING_GAP_LABEL,
  type TimelineGap,
} from "@/lib/session-scheduler";

interface NetworkingGapBlockProps {
  gap: TimelineGap;
}

export function NetworkingGapBlock({ gap }: NetworkingGapBlockProps) {
  const left = minutesToLeftPx(gap.start);
  const width = gapToWidthPx(gap.duration);
  const isCompact = isCompactBlockWidth(width);
  const tooltip = `${NETWORKING_GAP_LABEL} · ${formatTimeRangeShort(gap.start, gap.duration)}`;

  return (
    <div
      aria-hidden
      title={tooltip}
      className={cn(
        "pointer-events-none absolute top-1.5 flex h-[calc(100%-12px)] items-center overflow-hidden",
        "rounded-md border border-dashed border-muted-foreground/25 bg-muted/40 px-1.5 py-1",
        isCompact ? "justify-center" : "flex-col justify-center",
      )}
      style={{ left, width }}
    >
      {isCompact ? (
        <span className="truncate text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
          Open
        </span>
      ) : (
        <>
          <span className="truncate text-[10px] font-medium text-muted-foreground">
            {NETWORKING_GAP_LABEL}
          </span>
          <span className="truncate text-[9px] tabular-nums text-muted-foreground/80">
            {formatTimeRangeShort(gap.start, gap.duration)}
          </span>
        </>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Clock3, Timer } from "lucide-react";
import { ChartFilterGroup } from "@/components/shared/ChartFilterGroup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRegistrationIntervalDayLabel } from "@/lib/analytics-mappers";
import {
  getSessionParticipationForDay,
  PARTICIPATION_ANALYTICS_DAY_DATES,
  PARTICIPATION_DURATION_BUCKETS,
  sumParticipationTimeTotals,
  type ParticipationAnalyticsDayDate,
  type SessionParticipationRateRow,
  type SessionParticipationTimeRow,
} from "@/lib/participation-session-analytics";
import { cn } from "@/lib/utils";
import { useLiveAnalyticsStore } from "@/store/useLiveAnalyticsStore";

const DAY_FILTER_OPTIONS = PARTICIPATION_ANALYTICS_DAY_DATES.map((date) => ({
  value: date,
  label: formatRegistrationIntervalDayLabel(date),
}));

function cellValue(value: number | undefined): string {
  if (value == null || value === 0) return "—";
  return String(value);
}

/** Blank when this session has no such minute mark (shorter than that duration). */
function bucketCell(row: SessionParticipationTimeRow, label: string): string {
  if (!(label in row.buckets)) return "";
  return cellValue(row.buckets[label]);
}

const thClass =
  "border-b bg-muted/30 px-1 py-1.5 text-center text-[10px] font-medium leading-tight text-muted-foreground sm:text-[11px]";
const tdClass =
  "border-b px-1 py-1.5 text-center text-[10px] tabular-nums leading-tight sm:text-[11px]";
const bucketThClass = cn(thClass, "w-14 min-w-[2.75rem] whitespace-nowrap");
const bucketTdClass = cn(tdClass, "w-14 min-w-[2.75rem] text-muted-foreground");
const sessionThClass =
  "sticky left-0 z-10 min-w-[200px] border-b border-r bg-muted/30 px-2 py-1.5 text-left text-[10px] font-medium leading-tight text-muted-foreground sm:text-[11px]";
const sessionTdClass =
  "sticky left-0 z-10 min-w-[200px] border-b border-r bg-card px-2 py-1.5 text-left text-[11px] font-medium leading-snug";

function ScrollTable({
  children,
  minWidth,
}: {
  children: React.ReactNode;
  minWidth: number;
}) {
  return (
    <div className="max-w-full overflow-x-auto overscroll-x-contain">
      <table
        className="w-full border-collapse rounded-md border text-left"
        style={{ minWidth }}
      >
        {children}
      </table>
    </div>
  );
}

function ParticipationTimeTableView({
  rows,
  bucketLabels,
}: {
  rows: SessionParticipationTimeRow[];
  bucketLabels: readonly string[];
}) {
  const totals = useMemo(
    () => sumParticipationTimeTotals(rows, bucketLabels),
    [rows, bucketLabels],
  );
  const colCount = 3 + bucketLabels.length;
  const minWidth = 280 + 56 + 56 + bucketLabels.length * 44;

  return (
    <ScrollTable minWidth={minWidth}>
      <colgroup>
        <col className="w-[40%]" />
        <col className="w-14" />
        <col className="w-14" />
        {bucketLabels.map((bucket) => (
          <col key={bucket} className="w-14" />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th className={sessionThClass}>Session</th>
          <th className={cn(thClass, "w-14")}>
            Dur.
            <span className="block font-normal opacity-80">(min)</span>
          </th>
          <th className={cn(thClass, "w-14")}>Unique</th>
          {bucketLabels.map((bucket) => (
            <th key={bucket} className={bucketThClass} title={`${bucket} min`}>
              {bucket}
              <span className="block font-normal opacity-70">min</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={colCount} className="h-16 text-center text-sm text-muted-foreground">
              No participation time data yet.
            </td>
          </tr>
        ) : (
          <>
            {rows.map((row) => (
              <tr key={row.sessionName}>
                <td className={sessionTdClass} title={row.sessionName}>
                  <span className="block whitespace-normal break-words">{row.sessionName}</span>
                </td>
                <td className={tdClass}>{row.sessionDurationMinutes}</td>
                <td className={tdClass}>{cellValue(row.uniqueParticipants)}</td>
                {bucketLabels.map((bucket) => (
                  <td key={bucket} className={bucketTdClass}>
                    {bucketCell(row, bucket)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-muted/20">
              <td className={cn(sessionTdClass, "bg-muted/30 font-semibold")}>Total</td>
              <td className={cn(tdClass, "font-semibold")}>{totals.sessionDurationMinutes}</td>
              <td className={cn(tdClass, "font-semibold")}>{cellValue(totals.uniqueParticipants)}</td>
              {bucketLabels.map((bucket) => (
                <td key={bucket} className={cn(bucketTdClass, "font-semibold")}>
                  {cellValue(totals.buckets[bucket])}
                </td>
              ))}
            </tr>
          </>
        )}
      </tbody>
    </ScrollTable>
  );
}

function ParticipationRateTableView({
  rows,
  slotLabels,
}: {
  rows: SessionParticipationRateRow[];
  slotLabels: string[];
}) {
  const colCount = 2 + slotLabels.length;
  const minWidth = 320 + 64 + Math.max(slotLabels.length, 1) * 72;

  return (
    <ScrollTable minWidth={minWidth}>
      <colgroup>
        <col />
        <col className="w-20" />
        {slotLabels.map((slot) => (
          <col key={slot} className="w-24" />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th className={sessionThClass}>Session</th>
          <th className={cn(thClass, "w-20 whitespace-nowrap")}>
            Dur.
            <span className="block font-normal opacity-80">(min)</span>
          </th>
          {slotLabels.map((slot) => (
            <th key={slot} className={cn(bucketThClass, "w-24")} title={slot}>
              {slot}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={colCount} className="h-16 text-center text-sm text-muted-foreground">
              No participation rate data yet.
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.sessionName}>
              <td className={sessionTdClass} title={row.sessionName}>
                <span className="block whitespace-normal break-words">{row.sessionName}</span>
              </td>
              <td className={tdClass}>{row.sessionDurationMinutes}</td>
              {slotLabels.map((slot) => (
                <td key={slot} className={cn(bucketTdClass, "w-24")}>
                  {cellValue(row.slots[slot])}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </ScrollTable>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0 shadow-sm", className)}>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
            <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 pt-0">{children}</CardContent>
    </Card>
  );
}

/**
 * Live Event Insights — session Participation Time + Participation Rate tables.
 * Prefers live WebSocket rows; falls back to day-toggle mock fixtures.
 */
export function SessionParticipationAnalytics() {
  const [selectedDay, setSelectedDay] = useState<ParticipationAnalyticsDayDate>("2026-08-20");
  const liveParticipation = useLiveAnalyticsStore((s) => s.snapshot?.participation ?? null);
  const mockDay = useMemo(() => getSessionParticipationForDay(selectedDay), [selectedDay]);

  const usingLiveTime = (liveParticipation?.timeRows.length ?? 0) > 0;
  const usingLiveRate = (liveParticipation?.rateRows.length ?? 0) > 0;
  const usingAnyLive = usingLiveTime || usingLiveRate;

  const timeRows = usingLiveTime ? liveParticipation!.timeRows : mockDay.timeRows;
  const timeBucketLabels = usingLiveTime
    ? liveParticipation!.timeBucketLabels
    : [...PARTICIPATION_DURATION_BUCKETS];
  const rateRows = usingLiveRate ? liveParticipation!.rateRows : mockDay.rateRows;
  const rateSlotLabels = usingLiveRate
    ? (liveParticipation!.rateSlotLabels.length > 0
        ? liveParticipation!.rateSlotLabels
        : ["Max"])
    : mockDay.rateSlotLabels;

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Session participation
        </h3>
        {!usingAnyLive && (
          <ChartFilterGroup
            options={DAY_FILTER_OPTIONS}
            value={selectedDay}
            onChange={setSelectedDay}
          />
        )}
      </div>

      <div className="grid min-w-0 gap-4">
        <SectionCard
          icon={Timer}
          title="Participation Time"
          description="Participant counts at each 5-minute mark up to that session’s duration. Scroll horizontally for longer sessions."
        >
          <ParticipationTimeTableView rows={timeRows} bucketLabels={timeBucketLabels} />
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {usingLiveTime
              ? "Live from analytics WebSocket — columns match session duration (5, 10, … min)"
              : "Sample layout until live participation time arrives"}
          </p>
        </SectionCard>

        <SectionCard
          icon={Clock3}
          title="Participation Rate"
          description="Participant count per slot (or max concurrent) during sessions."
        >
          <ParticipationRateTableView rows={rateRows} slotLabels={rateSlotLabels} />
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {usingLiveRate
              ? "Live from analytics WebSocket"
              : "Sample layout until live participation rate arrives"}
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

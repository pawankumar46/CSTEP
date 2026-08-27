"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Timer } from "lucide-react";
import { ChartFilterGroup } from "@/components/shared/ChartFilterGroup";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRegistrationIntervalDayLabel } from "@/lib/analytics-mappers";
import {
  buildParticipationRateTableExportRows,
  buildParticipationTimeTableExportRows,
  getParticipationRateTableExportColumns,
  getParticipationTimeTableExportColumns,
} from "@/lib/event-analytics-export";
import { slugifyFilename } from "@/lib/export-utils";
import { sortEventDaysByDate } from "@/lib/icas-conference";
import { buildParticipationDayRequest } from "@/lib/live-analytics-ws";
import {
  participationSessionRowKey,
  PARTICIPATION_ANALYTICS_DAY_DATES,
  sumParticipationTimeTotals,
  type ParticipationAnalyticsDayDate,
  type SessionParticipationRateRow,
  type SessionParticipationTimeRow,
} from "@/lib/participation-session-analytics";
import { cn } from "@/lib/utils";
import {
  getEventDaysDropdown,
  type EventDayDropdownOption,
} from "@/services/event.service";
import { useLiveAnalyticsStore } from "@/store/useLiveAnalyticsStore";

const ALL_DAY_VALUE = "all";
const DEFAULT_DAY_DATE: ParticipationAnalyticsDayDate = "2026-08-20";

const FALLBACK_DAY_OPTIONS = PARTICIPATION_ANALYTICS_DAY_DATES.map((date) => ({
  value: date,
  label: formatRegistrationIntervalDayLabel(date),
}));

function resolveDaySelection(
  days: EventDayDropdownOption[],
  current: string,
): string {
  if (current === ALL_DAY_VALUE) return current;
  if (days.some((day) => day.id === current)) return current;
  const byDate = days.find((day) => day.date.slice(0, 10) === current)?.id;
  return byDate ?? ALL_DAY_VALUE;
}

function dayLabelForSelection(
  days: EventDayDropdownOption[],
  selected: string,
): string {
  if (selected === ALL_DAY_VALUE) return "All days";
  const date = dayDateForSelection(days, selected);
  return formatRegistrationIntervalDayLabel(date);
}

function dayDateForSelection(
  days: EventDayDropdownOption[],
  selected: string,
): ParticipationAnalyticsDayDate {
  const date = days.find((day) => day.id === selected)?.date.slice(0, 10)
    ?? (selected.length >= 10 ? selected.slice(0, 10) : "");
  if ((PARTICIPATION_ANALYTICS_DAY_DATES as readonly string[]).includes(date)) {
    return date as ParticipationAnalyticsDayDate;
  }
  return DEFAULT_DAY_DATE;
}

function timeBucketLabelsForRows(
  rows: SessionParticipationTimeRow[],
  fallback: string[],
): string[] {
  const labels = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row.buckets)) labels.add(key);
  }
  if (labels.size === 0) return fallback;
  return [...labels].sort((a, b) => Number(a) - Number(b));
}

function rateSlotLabelsForRows(
  rows: SessionParticipationRateRow[],
  fallback: string[],
): string[] {
  const labels = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row.slots)) labels.add(key);
  }
  if (labels.size === 0) return fallback;
  return [...labels].sort((a, b) => {
    if (a === "Max") return 1;
    if (b === "Max") return -1;
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b);
  });
}

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
            {rows.map((row, index) => (
              <tr key={participationSessionRowKey(row, index)}>
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
          rows.map((row, index) => (
            <tr key={participationSessionRowKey(row, index)}>
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
  filters,
  action,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  filters?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0 shadow-sm", className)}>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
            </div>
          </div>
          {action}
        </div>
        {filters}
      </CardHeader>
      <CardContent className="min-w-0 pt-0">{children}</CardContent>
    </Card>
  );
}

/**
 * Live Event Insights — session Participation Time + Participation Rate tables.
 * Day chips send `{ action, day_id }` on the live analytics WebSocket.
 */
export function SessionParticipationAnalytics() {
  const [eventDays, setEventDays] = useState<EventDayDropdownOption[]>([]);
  const [timeDay, setTimeDay] = useState<string>(ALL_DAY_VALUE);
  const [rateDay, setRateDay] = useState<string>(ALL_DAY_VALUE);

  const eventId = useLiveAnalyticsStore((s) => s.eventId);
  const status = useLiveAnalyticsStore((s) => s.status);
  const sendJson = useLiveAnalyticsStore((s) => s.sendJson);
  const liveParticipation = useLiveAnalyticsStore((s) => s.snapshot?.participation ?? null);

  useEffect(() => {
    if (!eventId) {
      setEventDays([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const days = sortEventDaysByDate(await getEventDaysDropdown(eventId));
        if (cancelled) return;
        setEventDays(days);
        setTimeDay((current) => resolveDaySelection(days, current));
        setRateDay((current) => resolveDaySelection(days, current));
      } catch {
        if (!cancelled) setEventDays([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (status !== "connected") return;
    sendJson(buildParticipationDayRequest("participation_time", timeDay));
  }, [status, timeDay, sendJson]);

  useEffect(() => {
    if (status !== "connected") return;
    sendJson(buildParticipationDayRequest("participation_rate", rateDay));
  }, [status, rateDay, sendJson]);

  const timeDate = dayDateForSelection(eventDays, timeDay);
  const rateDate = dayDateForSelection(eventDays, rateDay);
  const timeDayLabel = dayLabelForSelection(eventDays, timeDay);
  const rateDayLabel = dayLabelForSelection(eventDays, rateDay);
  const dayFilterOptions = [
    { value: ALL_DAY_VALUE, label: "All" },
    ...(eventDays.length > 0
      ? eventDays.map((day) => ({
          value: day.id,
          label: formatRegistrationIntervalDayLabel(day.date.slice(0, 10)) || day.label,
        }))
      : FALLBACK_DAY_OPTIONS),
  ];

  const timeRows = liveParticipation?.timeRows ?? [];
  const rateRows = liveParticipation?.rateRows ?? [];
  const timeBucketLabels = timeBucketLabelsForRows(
    timeRows,
    liveParticipation?.timeBucketLabels ?? [],
  );
  const rateSlotLabels = rateSlotLabelsForRows(
    rateRows,
    liveParticipation?.rateSlotLabels?.length
      ? liveParticipation.rateSlotLabels
      : ["Max"],
  );
  const hasLiveTime = timeRows.length > 0;
  const hasLiveRate = rateRows.length > 0;

  const timeExportRows = useMemo(
    () => buildParticipationTimeTableExportRows(timeRows, timeBucketLabels),
    [timeRows, timeBucketLabels],
  );
  const timeExportColumns = useMemo(
    () => getParticipationTimeTableExportColumns(timeBucketLabels),
    [timeBucketLabels],
  );
  const rateExportRows = useMemo(
    () => buildParticipationRateTableExportRows(rateRows, rateSlotLabels),
    [rateRows, rateSlotLabels],
  );
  const rateExportColumns = useMemo(
    () => getParticipationRateTableExportColumns(rateSlotLabels),
    [rateSlotLabels],
  );
  const timeExportFilename = slugifyFilename(
    timeDay === ALL_DAY_VALUE ? "participation-time-all" : `participation-time-${timeDate}`,
  );
  const rateExportFilename = slugifyFilename(
    rateDay === ALL_DAY_VALUE ? "participation-rate-all" : `participation-rate-${rateDate}`,
  );

  return (
    <div className="min-w-0 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Session participation
      </h3>

      <div className="grid min-w-0 gap-4">
        <SectionCard
          icon={Timer}
          title="Participation Time"
          description="Participant counts at each 5-minute mark up to that session’s duration. Scroll horizontally for longer sessions."
          filters={
            <ChartFilterGroup
              idPrefix="participation-time-day"
              options={dayFilterOptions}
              value={timeDay}
              onChange={setTimeDay}
            />
          }
          action={
            <ExportMenu
              filename={timeExportFilename}
              title={`Participation Time — ${timeDayLabel}`}
              columns={timeExportColumns}
              data={timeExportRows}
              disabled={timeRows.length === 0}
            />
          }
        >
          <ParticipationTimeTableView rows={timeRows} bucketLabels={timeBucketLabels} />
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {hasLiveTime
              ? "Live from analytics WebSocket — columns match session duration (5, 10, … min)"
              : status === "connected"
                ? "No participation time data for this selection."
                : "Connect to live analytics to load participation time."}
          </p>
        </SectionCard>

        <SectionCard
          icon={Clock3}
          title="Participation Rate"
          description="Participant count per slot (or max concurrent) during sessions."
          filters={
            <ChartFilterGroup
              idPrefix="participation-rate-day"
              options={dayFilterOptions}
              value={rateDay}
              onChange={setRateDay}
            />
          }
          action={
            <ExportMenu
              filename={rateExportFilename}
              title={`Participation Rate — ${rateDayLabel}`}
              columns={rateExportColumns}
              data={rateExportRows}
              disabled={rateRows.length === 0}
            />
          }
        >
          <ParticipationRateTableView rows={rateRows} slotLabels={rateSlotLabels} />
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {hasLiveRate
              ? "Live from analytics WebSocket"
              : status === "connected"
                ? "No participation rate data for this selection."
                : "Connect to live analytics to load participation rate."}
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

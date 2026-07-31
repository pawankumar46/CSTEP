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

const DAY_FILTER_OPTIONS = PARTICIPATION_ANALYTICS_DAY_DATES.map((date) => ({
  value: date,
  label: formatRegistrationIntervalDayLabel(date),
}));

function cellValue(value: number | undefined): string {
  if (value == null || value === 0) return "—";
  return String(value);
}

const thClass =
  "border-b bg-muted/30 px-0.5 py-1.5 text-center text-[10px] font-medium leading-tight text-muted-foreground sm:px-1 sm:text-[11px]";
const tdClass =
  "border-b px-0.5 py-1.5 text-center text-[10px] tabular-nums leading-tight sm:px-1 sm:text-[11px]";
const sessionThClass =
  "border-b bg-muted/30 px-1 py-1.5 text-left text-[10px] font-medium leading-tight text-muted-foreground sm:text-[11px]";
const sessionTdClass =
  "border-b px-1 py-1.5 text-left text-[10px] font-medium leading-tight sm:text-[11px]";

function FitTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="w-full overflow-hidden rounded-md border">
      <table className={cn("w-full table-fixed caption-bottom", className)}>{children}</table>
    </div>
  );
}

function ParticipationTimeTableView({
  rows,
}: {
  rows: SessionParticipationTimeRow[];
}) {
  const totals = useMemo(() => sumParticipationTimeTotals(rows), [rows]);
  const colCount = 3 + PARTICIPATION_DURATION_BUCKETS.length;

  return (
    <FitTable>
      <colgroup>
        <col className="w-[18%]" />
        <col className="w-[8%]" />
        <col className="w-[8%]" />
        {PARTICIPATION_DURATION_BUCKETS.map((bucket) => (
          <col key={bucket} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th className={sessionThClass}>Session</th>
          <th className={thClass}>
            Dur.
            <span className="block font-normal opacity-80">(min)</span>
          </th>
          <th className={thClass}>
            Unique
            <span className="block font-normal opacity-80">#</span>
          </th>
          {PARTICIPATION_DURATION_BUCKETS.map((bucket) => (
            <th key={bucket} className={thClass} title={`${bucket} mins`}>
              {bucket}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={colCount} className="h-16 text-center text-sm text-muted-foreground">
              No participation time data for this day yet.
            </td>
          </tr>
        ) : (
          <>
            {rows.map((row) => (
              <tr key={row.sessionName}>
                <td className={sessionTdClass} title={row.sessionName}>
                  <span className="line-clamp-2 break-words">{row.sessionName}</span>
                </td>
                <td className={tdClass}>{row.sessionDurationMinutes}</td>
                <td className={tdClass}>{row.uniqueParticipants}</td>
                {PARTICIPATION_DURATION_BUCKETS.map((bucket) => (
                  <td key={bucket} className={cn(tdClass, "text-muted-foreground")}>
                    {cellValue(row.buckets[bucket])}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-muted/40">
              <td className={cn(sessionTdClass, "bg-muted/40")}>TOTAL</td>
              <td className={cn(tdClass, "font-medium")}>{totals.sessionDurationMinutes}</td>
              <td className={cn(tdClass, "font-medium")}>{totals.uniqueParticipants}</td>
              {PARTICIPATION_DURATION_BUCKETS.map((bucket) => (
                <td key={bucket} className={cn(tdClass, "font-medium")}>
                  {cellValue(totals.buckets[bucket])}
                </td>
              ))}
            </tr>
          </>
        )}
      </tbody>
    </FitTable>
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

  return (
    <FitTable>
      <colgroup>
        <col className="w-[20%]" />
        <col className="w-[8%]" />
        {slotLabels.map((slot) => (
          <col key={slot} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th className={sessionThClass}>Session</th>
          <th className={thClass}>
            Dur.
            <span className="block font-normal opacity-80">(min)</span>
          </th>
          {slotLabels.map((slot) => (
            <th key={slot} className={thClass} title={slot}>
              {slot}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={colCount} className="h-16 text-center text-sm text-muted-foreground">
              No participation rate data for this day yet.
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.sessionName}>
              <td className={sessionTdClass} title={row.sessionName}>
                <span className="line-clamp-2 break-words">{row.sessionName}</span>
              </td>
              <td className={tdClass}>{row.sessionDurationMinutes}</td>
              {slotLabels.map((slot) => (
                <td key={slot} className={cn(tdClass, "text-muted-foreground")}>
                  {cellValue(row.slots[slot])}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </FitTable>
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
    <Card className={cn("min-w-0 overflow-hidden shadow-sm", className)}>
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
      <CardContent className="min-w-0 overflow-hidden pt-0">{children}</CardContent>
    </Card>
  );
}

/**
 * Live Event Insights — session Participation Time + Participation Rate tables.
 * Day toggle: 19 Aug / 20 Aug / 21 Aug. Placeholder data until BE APIs land.
 */
export function SessionParticipationAnalytics() {
  const [selectedDay, setSelectedDay] = useState<ParticipationAnalyticsDayDate>("2026-08-20");
  const dayData = useMemo(() => getSessionParticipationForDay(selectedDay), [selectedDay]);

  return (
    <div className="min-w-0 space-y-3 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Session participation
        </h3>
        <ChartFilterGroup
          options={DAY_FILTER_OPTIONS}
          value={selectedDay}
          onChange={setSelectedDay}
        />
      </div>

      <div className="grid min-w-0 gap-4">
        <SectionCard
          icon={Timer}
          title="Participation Time"
          description="How long unique participants stayed in each session (duration buckets in minutes). Sample layout until the API is available."
        >
          <ParticipationTimeTableView rows={dayData.timeRows} />
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Participation time — live API coming soon
          </p>
        </SectionCard>

        <SectionCard
          icon={Clock3}
          title="Participation Rate"
          description="Participant count at each 15-minute clock slot during sessions. Sample layout until the API is available."
        >
          <ParticipationRateTableView
            rows={dayData.rateRows}
            slotLabels={dayData.rateSlotLabels}
          />
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Participation rate — live API coming soon
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

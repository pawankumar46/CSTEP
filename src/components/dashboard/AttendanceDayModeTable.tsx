"use client";

import { useMemo } from "react";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildAttendanceDayModeRows } from "@/lib/analytics-mappers";
import { slugifyFilename } from "@/lib/export-utils";
import {
  ATTENDANCE_DAY_MODE_EXPORT_COLUMNS,
  type AttendanceDayModeRow,
} from "@/lib/event-analytics-export";
import type { EventAnalyticsDay } from "@/types";

export type AttendanceInsightModeFilter = "all" | "physical" | "virtual";

interface AttendanceDayModeTableProps {
  days: EventAnalyticsDay[];
  dateFilter: string;
  modeFilter: AttendanceInsightModeFilter;
  onDateFilterChange: (value: string) => void;
  onModeFilterChange: (value: AttendanceInsightModeFilter) => void;
  exportSlug: string;
}

export function AttendanceDayModeTable({
  days,
  dateFilter,
  modeFilter,
  onDateFilterChange,
  onModeFilterChange,
  exportSlug,
}: AttendanceDayModeTableProps) {
  const baseRows = useMemo(() => buildAttendanceDayModeRows(days), [days]);

  const displayRows = useMemo(() => {
    let rows = baseRows;
    if (dateFilter !== "all") {
      rows = rows.filter((row) => row.isoDate === dateFilter);
    }
    if (modeFilter === "physical") {
      rows = rows.filter((row) => row.physical > 0);
    }
    if (modeFilter === "virtual") {
      rows = rows.filter((row) => row.virtual > 0);
    }
    return rows;
  }, [baseRows, dateFilter, modeFilter]);

  const totals = useMemo(
    () =>
      displayRows.reduce(
        (acc, row) => ({
          physical: acc.physical + row.physical,
          virtual: acc.virtual + row.virtual,
          total: acc.total + row.total,
        }),
        { physical: 0, virtual: 0, total: 0 },
      ),
    [displayRows],
  );

  const showPhysical = modeFilter !== "virtual";
  const showVirtual = modeFilter !== "physical";

  const exportRows: AttendanceDayModeRow[] = useMemo(
    () =>
      displayRows.map((row) => ({
        date: row.dateLabel,
        physical: row.physical,
        virtual: row.virtual,
        total: row.total,
      })),
    [displayRows],
  );

  const exportFilename = slugifyFilename(exportSlug);
  const colSpanLead = 1;

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-3 px-4 py-3">
        <CardTitle className="text-sm font-semibold">Attendance by date & mode</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="insight-filter-date">Filter by date</Label>
            <Select value={dateFilter} onValueChange={onDateFilterChange}>
              <SelectTrigger id="insight-filter-date">
                <SelectValue placeholder="All dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dates</SelectItem>
                {baseRows.map((row) => (
                  <SelectItem key={row.isoDate} value={row.isoDate}>
                    {row.dateLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="insight-filter-mode">Filter by mode</Label>
            <Select
              value={modeFilter}
              onValueChange={(value) => onModeFilterChange(value as AttendanceInsightModeFilter)}
            >
              <SelectTrigger id="insight-filter-mode">
                <SelectValue placeholder="All modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modes</SelectItem>
                <SelectItem value="physical">Physical</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="mb-3 flex justify-end">
          <ExportMenu
            filename={exportFilename}
            title="Attendance by date and mode"
            columns={ATTENDANCE_DAY_MODE_EXPORT_COLUMNS}
            data={exportRows}
            disabled={exportRows.length === 0}
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                {showPhysical && <TableHead className="text-right">Physical</TableHead>}
                {showVirtual && <TableHead className="text-right">Virtual</TableHead>}
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={colSpanLead + (showPhysical ? 1 : 0) + (showVirtual ? 1 : 0) + 1}
                    className="h-16 text-center text-muted-foreground"
                  >
                    No attendance data for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {displayRows.map((row) => (
                    <TableRow key={row.isoDate}>
                      <TableCell className="font-medium">{row.dateLabel}</TableCell>
                      {showPhysical && (
                        <TableCell className="text-right tabular-nums">{row.physical}</TableCell>
                      )}
                      {showVirtual && (
                        <TableCell className="text-right tabular-nums">{row.virtual}</TableCell>
                      )}
                      <TableCell className="text-right tabular-nums">{row.total}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell className="font-medium">Total</TableCell>
                    {showPhysical && (
                      <TableCell className="text-right font-medium tabular-nums">
                        {totals.physical}
                      </TableCell>
                    )}
                    {showVirtual && (
                      <TableCell className="text-right font-medium tabular-nums">
                        {totals.virtual}
                      </TableCell>
                    )}
                    <TableCell className="text-right font-medium tabular-nums">
                      {totals.total}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

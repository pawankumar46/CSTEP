"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MapPin, Monitor, Users } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { EmptyState } from "@/components/shared/EmptyState";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRegistrationIntervalDayLabel } from "@/lib/analytics-mappers";
import { slugifyFilename } from "@/lib/export-utils";
import { ATTENDANCE_MODE_USERS_EXPORT_COLUMNS } from "@/lib/registration-export";
import { getAllAttendanceModeUsers, getAttendanceModeUsers } from "@/services/analytics.service";
import { getAllEvents } from "@/services/event.service";
import type {
  AttendanceMode,
  AttendanceModeUserRow,
  Event,
  RegistrationStatus,
} from "@/types";

const TABLE_PAGE_SIZE = 10;

const EVENT_DAY_OPTIONS = ["2026-08-19", "2026-08-20", "2026-08-21"] as const;

const MODE_OPTIONS: { value: "all" | AttendanceMode; label: string }[] = [
  { value: "all", label: "All" },
  { value: "physical", label: "Physical" },
  { value: "virtual", label: "Virtual" },
];

const STATUS_VARIANT: Record<
  RegistrationStatus,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  pending: "warning",
  accepted: "success",
  rejected: "destructive",
  on_hold: "secondary",
};

function pickDefaultEvent(events: Event[]): Event | null {
  if (events.length === 0) return null;
  return events.find((event) => event.id === "11") ?? events[0];
}

export function AttendanceModeAnalytics() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [dayDate, setDayDate] = useState<string>("all");
  const [attendanceMode, setAttendanceMode] = useState<"all" | AttendanceMode>("all");
  const [rows, setRows] = useState<AttendanceModeUserRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const list = await getAllEvents();
        if (cancelled) return;
        setEvents(list);
        const preferred = pickDefaultEvent(list);
        if (preferred) setSelectedEventId(preferred.id);
      } catch (err) {
        if (!cancelled) {
          setEventsError(err instanceof Error ? err.message : "Failed to load events");
        }
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadPage = useCallback(async () => {
    if (!selectedEventId) return;

    setLoading(true);
    setFetchError(null);
    try {
      const result = await getAttendanceModeUsers({
        eventId: selectedEventId,
        dayDate: dayDate === "all" ? undefined : dayDate,
        attendanceMode: attendanceMode === "all" ? undefined : attendanceMode,
        page,
        pageSize: TABLE_PAGE_SIZE,
      });
      setRows(result.rows);
      setTotalCount(result.total);
      setTotalPages(result.totalPages);
      setHasNext(result.hasNext);
      setHasPrevious(result.hasPrevious);
    } catch (err) {
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
      setHasNext(false);
      setHasPrevious(false);
      setFetchError(err instanceof Error ? err.message : "Failed to load attendance mode users");
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, dayDate, attendanceMode, page]);

  useEffect(() => {
    if (!selectedEventId) {
      setRows([]);
      setTotalCount(0);
      setFetchError(null);
      return;
    }
    void loadPage();
  }, [selectedEventId, loadPage]);

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setPage(1);
  };

  const handleDayChange = (value: string) => {
    setDayDate(value);
    setPage(1);
  };

  const handleModeChange = (value: string) => {
    setAttendanceMode(value as "all" | AttendanceMode);
    setPage(1);
  };

  const columns = useMemo<ColumnDef<AttendanceModeUserRow>[]>(
    () => [
      { accessorKey: "userName", header: "User Name" },
      { accessorKey: "phone", header: "Phone" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "designation", header: "Designation" },
      {
        accessorKey: "orgName",
        header: "Organization",
        cell: ({ row }) => row.original.orgName || "—",
      },
      {
        id: "days",
        header: "Days & mode",
        cell: ({ row }) => (
          <div className="flex max-w-[16rem] flex-wrap gap-1">
            {row.original.days.length === 0 ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              row.original.days.map((day) => (
                <Badge key={day.id} variant="outline" className="font-normal">
                  {formatRegistrationIntervalDayLabel(day.date)} ·{" "}
                  {day.attendanceMode === "virtual" ? "Virtual" : "Physical"}
                </Badge>
              ))
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]} className="capitalize">
            {row.original.status === "on_hold" ? "Hold" : row.original.status.replace("_", " ")}
          </Badge>
        ),
      },
    ],
    [],
  );

  const modeLabel =
    attendanceMode === "all"
      ? "All modes"
      : attendanceMode === "virtual"
        ? "Virtual"
        : "Physical";
  const dayLabel =
    dayDate === "all" ? "All days" : formatRegistrationIntervalDayLabel(dayDate);

  const exportFilename = slugifyFilename(
    `attendance-mode-${modeLabel}-${dayLabel}-${selectedEvent?.name ?? "event"}`,
  );
  const exportTitle = selectedEvent
    ? `Attendance Mode — ${selectedEvent.name} (${modeLabel}, ${dayLabel})`
    : `Attendance Mode (${modeLabel}, ${dayLabel})`;

  const fetchAllForExport = useCallback(async () => {
    if (!selectedEventId) return [];
    return getAllAttendanceModeUsers({
      eventId: selectedEventId,
      dayDate: dayDate === "all" ? undefined : dayDate,
      attendanceMode: attendanceMode === "all" ? undefined : attendanceMode,
    });
  }, [selectedEventId, dayDate, attendanceMode]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Filter by event day and attendance mode. Choosing All for mode omits the mode query
            param.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {eventsError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
              <p className="text-sm text-destructive">{eventsError}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="attendance-event">Event</Label>
              {eventsLoading ? (
                <p className="text-sm text-muted-foreground">Loading events…</p>
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events available.</p>
              ) : (
                <Select value={selectedEventId ?? ""} onValueChange={handleEventChange}>
                  <SelectTrigger id="attendance-event">
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendance-day">Participation day</Label>
              <Select
                value={dayDate}
                onValueChange={handleDayChange}
                disabled={!selectedEventId}
              >
                <SelectTrigger id="attendance-day">
                  <SelectValue placeholder="Choose a day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All days</SelectItem>
                  {EVENT_DAY_OPTIONS.map((date) => (
                    <SelectItem key={date} value={date}>
                      {formatRegistrationIntervalDayLabel(date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendance-mode">Attendance mode</Label>
              <Select
                value={attendanceMode}
                onValueChange={handleModeChange}
                disabled={!selectedEventId}
              >
                <SelectTrigger id="attendance-mode">
                  <SelectValue placeholder="Choose mode" />
                </SelectTrigger>
                <SelectContent>
                  {MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        {option.value === "physical" ? (
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        ) : option.value === "virtual" ? (
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                        ) : null}
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {fetchError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <p className="text-sm text-destructive">{fetchError}</p>
        </div>
      )}

      {!selectedEventId && !eventsLoading && (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Users}
              title="Select an event"
              description="Choose an event to load attendance mode registrations."
            />
          </CardContent>
        </Card>
      )}

      {selectedEventId && loading && rows.length === 0 && <DashboardSkeleton />}

      {selectedEventId && (!loading || rows.length > 0) && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">Registrations</CardTitle>
              <CardDescription>
                {totalCount} result{totalCount === 1 ? "" : "s"}
              </CardDescription>
            </div>
            <ExportMenu
              data={rows}
              columns={ATTENDANCE_MODE_USERS_EXPORT_COLUMNS}
              filename={exportFilename}
              title={exportTitle}
              disabled={rows.length === 0}
              fetchAllData={fetchAllForExport}
              allFilename={`${exportFilename}-all`}
              allTitle={`${exportTitle} — All`}
            />
          </CardHeader>
          <CardContent>
            {rows.length === 0 && !loading ? (
              <EmptyState
                icon={Users}
                title="No registrations found"
                description="Try another day or attendance mode."
              />
            ) : rows.length > 0 ? (
              <DataTable
                columns={columns}
                data={rows}
                searchKey="userName"
                searchPlaceholder="Search by name…"
                pageSize={TABLE_PAGE_SIZE}
                serverPagination={{
                  page,
                  totalPages,
                  hasNext,
                  hasPrevious,
                  onPageChange: setPage,
                }}
              />
            ) : null}
            {loading && rows.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">Refreshing…</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

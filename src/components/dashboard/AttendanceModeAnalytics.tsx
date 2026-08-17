"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MapPin, Monitor, Users } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { SearchBar } from "@/components/shared/SearchBar";
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
import { formatDateTime } from "@/lib/utils";
import { getAttendanceModeUsersExportColumns } from "@/lib/registration-export";
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
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

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

  useEffect(() => {
    if (!selectedEventId) {
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
      setHasNext(false);
      setHasPrevious(false);
      setFetchError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    void (async () => {
      try {
        const result = await getAttendanceModeUsers({
          eventId: selectedEventId,
          dayDate: dayDate === "all" ? undefined : dayDate,
          attendanceMode: attendanceMode === "all" ? undefined : attendanceMode,
          search: appliedSearch || undefined,
          page,
          pageSize: TABLE_PAGE_SIZE,
        });
        if (cancelled) return;
        setRows(result.rows);
        setTotalCount(result.total);
        setTotalPages(result.totalPages);
        setHasNext(result.hasNext);
        setHasPrevious(result.hasPrevious);
      } catch (err) {
        if (cancelled) return;
        setRows([]);
        setTotalCount(0);
        setTotalPages(1);
        setHasNext(false);
        setHasPrevious(false);
        setFetchError(err instanceof Error ? err.message : "Failed to load attendance mode users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedEventId, dayDate, attendanceMode, page, appliedSearch]);

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setSearchDraft("");
    setAppliedSearch("");
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

  const handleSearchSubmit = useCallback(() => {
    setAppliedSearch(searchDraft.trim());
    setPage(1);
  }, [searchDraft]);

  const handleSearchClear = useCallback(() => {
    setSearchDraft("");
    setAppliedSearch("");
    setPage(1);
  }, []);

  const visibleDayDates = useMemo(
    () =>
      dayDate === "all"
        ? [...EVENT_DAY_OPTIONS]
        : EVENT_DAY_OPTIONS.filter((date) => date === dayDate),
    [dayDate],
  );

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
      ...visibleDayDates.map((date) => ({
        id: `day-${date}`,
        header: formatRegistrationIntervalDayLabel(date),
        cell: ({ row }: { row: { original: AttendanceModeUserRow } }) => {
          const day = row.original.days.find((item) => item.date === date);
          if (!day) {
            return <span className="text-muted-foreground">—</span>;
          }
          const label = day.attendanceMode === "virtual" ? "Virtual" : "Physical";
          return (
            <Badge variant="secondary" className="font-medium">
              {label}
            </Badge>
          );
        },
      })),
      {
        accessorKey: "createdAt",
        header: "Date of Registration",
        cell: ({ row }) =>
          row.original.createdAt ? (
            <span className="whitespace-nowrap text-sm">
              {formatDateTime(row.original.createdAt)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "updatedAt",
        header: "Modified",
        cell: ({ row }) =>
          row.original.updatedAt ? (
            <span className="whitespace-nowrap text-sm">
              {formatDateTime(row.original.updatedAt)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
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
    [visibleDayDates],
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

  const exportColumns = useMemo(
    () => getAttendanceModeUsersExportColumns(dayDate),
    [dayDate],
  );

  const fetchAllForExport = useCallback(async () => {
    if (!selectedEventId) return [];
    return getAllAttendanceModeUsers({
      eventId: selectedEventId,
      dayDate: dayDate === "all" ? undefined : dayDate,
      attendanceMode: attendanceMode === "all" ? undefined : attendanceMode,
      search: appliedSearch || undefined,
    });
  }, [selectedEventId, dayDate, attendanceMode, appliedSearch]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Filter registrations by event day and attendance mode (Physical / Virtual).
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

      {fetchError && !loading && (
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

      {selectedEventId && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">Registrations</CardTitle>
              <CardDescription>
                {loading
                  ? "Loading attendance mode users…"
                  : `${totalCount} result${totalCount === 1 ? "" : "s"}`}
              </CardDescription>
            </div>
            <ExportMenu
              data={rows}
              columns={exportColumns}
              filename={exportFilename}
              title={exportTitle}
              disabled={rows.length === 0 || loading}
              fetchAllData={fetchAllForExport}
              allFilename={`${exportFilename}-all`}
              allTitle={`${exportTitle} — All`}
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <SearchBar
                  value={searchDraft}
                  onChange={setSearchDraft}
                  onSubmit={handleSearchSubmit}
                  onClear={handleSearchClear}
                  placeholder="Search by name… (press Enter)"
                  className="max-w-sm"
                />
                <TableSkeleton rows={8} />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={rows}
                searchPlaceholder="Search by name…"
                serverSearch={{
                  value: searchDraft,
                  onChange: setSearchDraft,
                  onSubmit: handleSearchSubmit,
                  onClear: handleSearchClear,
                  appliedValue: appliedSearch,
                  placeholder: "Search by name… (press Enter)",
                }}
                pageSize={TABLE_PAGE_SIZE}
                serverPagination={{
                  page,
                  totalPages,
                  hasNext,
                  hasPrevious,
                  onPageChange: setPage,
                }}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

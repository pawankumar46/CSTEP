"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, MapPin, Monitor, Users } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { SearchBar } from "@/components/shared/SearchBar";
import { TableColumnChooser } from "@/components/shared/TableColumnChooser";
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
import {
  createDefaultAttendanceModeVisibility,
  filterAttendanceModeExportColumns,
  filterAttendanceModeTableColumns,
  getAttendanceModeColumnOptions,
  mergeAttendanceModeVisibility,
} from "@/lib/attendance-mode-columns";
import { formatRegistrationIntervalDayLabel } from "@/lib/analytics-mappers";
import { sortEventDaysByDate } from "@/lib/icas-conference";
import { slugifyFilename } from "@/lib/export-utils";
import { cn, formatDateTime } from "@/lib/utils";
import { getAttendanceModeUsersExportColumns } from "@/lib/registration-export";
import { getAllAttendanceModeUsers, getAttendanceModeUsers } from "@/services/analytics.service";
import { getAllEvents, getEventDaysDropdown, type EventDayDropdownOption } from "@/services/event.service";
import { updateRegistrationDayAttendance } from "@/services/lobby.service";
import { useAuthStore } from "@/store/useAuthStore";
import type {
  AttendanceMode,
  AttendanceModeUserRow,
  Event,
  RegistrationStatus,
  UserRole,
} from "@/types";

const TABLE_PAGE_SIZE = 10;
const ALL_DAYS_VALUE = "all";
const ATTENDANCE_ACTION_ROLES: UserRole[] = ["moderator", "event_administrator"];

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

function dayLabelForSelection(
  eventDays: EventDayDropdownOption[],
  selectedDayId: string,
): string {
  if (selectedDayId === ALL_DAYS_VALUE) return "All days";
  const day = eventDays.find((item) => item.id === selectedDayId);
  return day ? day.label : "Selected day";
}

function visibleDatesForSelection(
  eventDays: EventDayDropdownOption[],
  selectedDayId: string,
): string[] {
  if (selectedDayId === ALL_DAYS_VALUE) {
    return sortEventDaysByDate(eventDays).map((day) => day.date.slice(0, 10));
  }
  const day = eventDays.find((item) => item.id === selectedDayId);
  return day ? [day.date.slice(0, 10)] : [];
}

export function AttendanceModeAnalytics() {
  const user = useAuthStore((state) => state.user);
  const canManageAttendance = user
    ? ATTENDANCE_ACTION_ROLES.includes(user.role)
    : false;
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDays, setEventDays] = useState<EventDayDropdownOption[]>([]);
  const [eventDaysLoading, setEventDaysLoading] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string>(ALL_DAYS_VALUE);
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
  const [attendanceLoadingKey, setAttendanceLoadingKey] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [visibleColumnIds, setVisibleColumnIds] = useState<Set<string>>(() =>
    createDefaultAttendanceModeVisibility([]),
  );

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
      setEventDays([]);
      setSelectedDayId(ALL_DAYS_VALUE);
      return;
    }

    let cancelled = false;
    setEventDaysLoading(true);

    void (async () => {
      try {
        const days = sortEventDaysByDate(await getEventDaysDropdown(selectedEventId));
        if (cancelled) return;
        setEventDays(days);
        setSelectedDayId((current) =>
          current === ALL_DAYS_VALUE || days.some((day) => day.id === current)
            ? current
            : ALL_DAYS_VALUE,
        );
      } catch {
        if (!cancelled) {
          setEventDays([]);
          setSelectedDayId(ALL_DAYS_VALUE);
        }
      } finally {
        if (!cancelled) setEventDaysLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedEventId]);

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
          dayId: selectedDayId === ALL_DAYS_VALUE ? undefined : selectedDayId,
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
  }, [selectedEventId, selectedDayId, attendanceMode, page, appliedSearch]);

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedDayId(ALL_DAYS_VALUE);
    setSearchDraft("");
    setAppliedSearch("");
    setPage(1);
  };

  const handleDayChange = (value: string) => {
    setSelectedDayId(value);
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

  const handleToggleDayAttendance = useCallback(
    async (
      registrationId: string,
      registrationDayId: string,
      nextAttended: boolean,
    ) => {
      const key = `${registrationId}:${registrationDayId}`;
      setAttendanceLoadingKey(key);
      setAttendanceError(null);
      try {
        await updateRegistrationDayAttendance(registrationDayId, nextAttended);
        setRows((current) =>
          current.map((row) =>
            row.id !== registrationId
              ? row
              : {
                  ...row,
                  days: row.days.map((day) =>
                    day.id === registrationDayId
                      ? { ...day, isAttended: nextAttended }
                      : day,
                  ),
                },
          ),
        );
      } catch (error) {
        setAttendanceError(
          error instanceof Error ? error.message : "Failed to update attendance",
        );
      } finally {
        setAttendanceLoadingKey(null);
      }
    },
    [],
  );

  const visibleDayDates = useMemo(
    () => visibleDatesForSelection(eventDays, selectedDayId),
    [eventDays, selectedDayId],
  );

  const columnOptions = useMemo(
    () => getAttendanceModeColumnOptions(visibleDayDates),
    [visibleDayDates],
  );

  useEffect(() => {
    setVisibleColumnIds((current) => mergeAttendanceModeVisibility(current, visibleDayDates));
  }, [visibleDayDates]);

  const handleColumnToggle = useCallback((id: string, visible: boolean) => {
    setVisibleColumnIds((current) => {
      const next = new Set(current);
      if (visible) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleResetColumns = useCallback(() => {
    setVisibleColumnIds(createDefaultAttendanceModeVisibility(visibleDayDates));
  }, [visibleDayDates]);

  const allColumns = useMemo<ColumnDef<AttendanceModeUserRow>[]>(
    () => [
      { accessorKey: "userName", header: "User Name" },
      { accessorKey: "phone", header: "Phone" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "designation",
        header: "Designation",
        cell: ({ row }) =>
          row.original.designation?.trim() ? (
            <span className="text-sm">{row.original.designation}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "orgName",
        header: "Organization",
        cell: ({ row }) =>
          row.original.orgName?.trim() ? (
            <span className="text-sm">{row.original.orgName}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "city",
        header: "City",
        cell: ({ row }) =>
          row.original.city?.trim() ? (
            <span className="text-sm">{row.original.city}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "state",
        header: "State",
        cell: ({ row }) =>
          row.original.state?.trim() ? (
            <span className="text-sm">{row.original.state}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
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
          const attended = day.isAttended === true;
          const notAttended = day.isAttended === false;
          const loadingKey = `${row.original.id}:${day.id}`;
          const isUpdating = attendanceLoadingKey === loadingKey;

          if (!canManageAttendance || !day.id) {
            return (
              <Badge
                variant="outline"
                className={cn(
                  "font-normal",
                  attended &&
                    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                  notAttended &&
                    "border-destructive/40 bg-destructive/10 text-destructive",
                )}
              >
                {label}
              </Badge>
            );
          }

          return (
            <button
              type="button"
              disabled={isUpdating || attendanceLoadingKey !== null}
              onClick={() =>
                void handleToggleDayAttendance(
                  row.original.id,
                  day.id,
                  !attended,
                )
              }
              title={attended ? `Mark ${label} absent` : `Mark ${label} present`}
              aria-label={
                attended
                  ? `Mark ${row.original.userName} absent on ${date}`
                  : `Mark ${row.original.userName} present on ${date}`
              }
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              <Badge
                variant="outline"
                className={cn(
                  "cursor-pointer font-normal",
                  attended &&
                    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400",
                  notAttended &&
                    "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15",
                )}
              >
                {isUpdating ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                {label}
              </Badge>
            </button>
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
    [
      attendanceLoadingKey,
      canManageAttendance,
      handleToggleDayAttendance,
      visibleDayDates,
    ],
  );

  const columns = useMemo(
    () => filterAttendanceModeTableColumns(allColumns, visibleColumnIds),
    [allColumns, visibleColumnIds],
  );

  const modeLabel =
    attendanceMode === "all"
      ? "All modes"
      : attendanceMode === "virtual"
        ? "Virtual"
        : "Physical";
  const dayLabel = dayLabelForSelection(eventDays, selectedDayId);

  const exportFilename = slugifyFilename(
    `attendance-mode-${modeLabel}-${dayLabel}-${selectedEvent?.name ?? "event"}`,
  );
  const exportTitle = selectedEvent
    ? `Attendance Mode — ${selectedEvent.name} (${modeLabel}, ${dayLabel})`
    : `Attendance Mode (${modeLabel}, ${dayLabel})`;

  const exportColumns = useMemo(() => {
    const allExportColumns = getAttendanceModeUsersExportColumns(visibleDayDates);
    return filterAttendanceModeExportColumns(
      allExportColumns,
      visibleColumnIds,
      visibleDayDates,
    );
  }, [visibleColumnIds, visibleDayDates]);

  const fetchAllForExport = useCallback(async () => {
    if (!selectedEventId) return [];
    return getAllAttendanceModeUsers({
      eventId: selectedEventId,
      dayId: selectedDayId === ALL_DAYS_VALUE ? undefined : selectedDayId,
      attendanceMode: attendanceMode === "all" ? undefined : attendanceMode,
      search: appliedSearch || undefined,
    });
  }, [selectedEventId, selectedDayId, attendanceMode, appliedSearch]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Filter registrations by event day and attendance mode. Green is present;
            red is absent.
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
                value={selectedDayId}
                onValueChange={handleDayChange}
                disabled={!selectedEventId || eventDaysLoading}
              >
                <SelectTrigger id="attendance-day">
                  <SelectValue placeholder="Choose a day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_DAYS_VALUE}>All days</SelectItem>
                  {eventDays.map((day) => (
                    <SelectItem key={day.id} value={day.id}>
                      {day.label}
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

      {attendanceError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <p className="text-sm text-destructive">{attendanceError}</p>
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
                {canManageAttendance && (
                  <span className="mt-1 block">
                    Click a Physical/Virtual badge to toggle present or absent.
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <TableColumnChooser
                options={columnOptions}
                visibleIds={visibleColumnIds}
                onToggle={handleColumnToggle}
                onReset={handleResetColumns}
                disabled={loading}
              />
              <ExportMenu
                data={rows}
                columns={exportColumns}
                filename={exportFilename}
                title={exportTitle}
                disabled={rows.length === 0 || loading || exportColumns.length === 0}
                fetchAllData={fetchAllForExport}
                allFilename={`${exportFilename}-all`}
                allTitle={`${exportTitle} — All`}
              />
            </div>
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

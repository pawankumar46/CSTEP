"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, MapPin, Monitor, Users, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { SearchBar } from "@/components/shared/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn, formatDateTime } from "@/lib/utils";
import { getAttendanceModeUsersExportColumns } from "@/lib/registration-export";
import {
  ATTENDANCE_MARK_API_READY,
  bulkMarkRegistrationAttendance,
  getAllAttendanceModeUsers,
  getAttendanceModeUsers,
} from "@/services/analytics.service";
import { getAllEvents } from "@/services/event.service";
import type {
  AttendanceMarkStatus,
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

function modeMarkButtonClass(mark: AttendanceMarkStatus | null | undefined): string {
  if (mark === "present") {
    return "border-transparent bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400";
  }
  if (mark === "absent") {
    return "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/15";
  }
  return "border-border bg-muted/70 text-muted-foreground hover:bg-muted";
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [listVersion, setListVersion] = useState(0);
  const [markLoading, setMarkLoading] = useState(false);
  const [pendingPresentKey, setPendingPresentKey] = useState<string | null>(null);
  const [markError, setMarkError] = useState<string | null>(null);
  const [markSuccess, setMarkSuccess] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const canMarkAbsent = dayDate !== "all";
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allVisibleIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const allVisibleSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedSet.has(id));
  const selectedCount = selectedIds.length;

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
      setSelectedIds([]);
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
  }, [selectedEventId, dayDate, attendanceMode, page, appliedSearch, listVersion]);

  useEffect(() => {
    const allowed = new Set(rows.map((row) => row.id));
    setSelectedIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [rows]);

  useEffect(() => {
    if (!markSuccess && !markError) return;
    const timer = window.setTimeout(() => {
      setMarkSuccess(null);
      setMarkError(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [markSuccess, markError]);

  const applyLocalMarks = useCallback(
    (ids: string[], date: string, status: AttendanceMarkStatus) => {
      const idSet = new Set(ids);
      setRows((prev) =>
        prev.map((row) => {
          if (!idSet.has(row.id)) return row;
          return {
            ...row,
            days: row.days.map((day) =>
              day.date === date ? { ...day, attendanceMark: status } : day,
            ),
          };
        }),
      );
    },
    [],
  );

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setSearchDraft("");
    setAppliedSearch("");
    setSelectedIds([]);
    setPage(1);
  };

  const handleDayChange = (value: string) => {
    setDayDate(value);
    setSelectedIds([]);
    setPage(1);
  };

  const handleModeChange = (value: string) => {
    setAttendanceMode(value as "all" | AttendanceMode);
    setSelectedIds([]);
    setPage(1);
  };

  const handleSearchSubmit = useCallback(() => {
    setAppliedSearch(searchDraft.trim());
    setSelectedIds([]);
    setPage(1);
  }, [searchDraft]);

  const handleSearchClear = useCallback(() => {
    setSearchDraft("");
    setAppliedSearch("");
    setSelectedIds([]);
    setPage(1);
  }, []);

  const handleMarkPresent = useCallback(
    async (registrationId: string, date: string) => {
      const key = `${registrationId}:${date}`;
      setPendingPresentKey(key);
      setMarkError(null);
      setMarkSuccess(null);
      try {
        if (ATTENDANCE_MARK_API_READY) {
          await bulkMarkRegistrationAttendance([registrationId], "present", date);
          setListVersion((v) => v + 1);
          setMarkSuccess(
            `Marked present for ${formatRegistrationIntervalDayLabel(date)}.`,
          );
        } else {
          applyLocalMarks([registrationId], date, "present");
          setMarkSuccess(
            `Marked present for ${formatRegistrationIntervalDayLabel(date)} (preview — API under development).`,
          );
        }
      } catch (err) {
        setMarkError(err instanceof Error ? err.message : "Failed to mark present");
      } finally {
        setPendingPresentKey(null);
      }
    },
    [applyLocalMarks],
  );

  const handleMarkAbsent = useCallback(async () => {
    if (!canMarkAbsent || selectedIds.length === 0 || dayDate === "all") return;

    setMarkLoading(true);
    setMarkError(null);
    setMarkSuccess(null);
    try {
      if (ATTENDANCE_MARK_API_READY) {
        await bulkMarkRegistrationAttendance(selectedIds, "absent", dayDate);
        setSelectedIds([]);
        setListVersion((v) => v + 1);
        setMarkSuccess(
          `Marked ${selectedIds.length} registration${selectedIds.length === 1 ? "" : "s"} absent for ${formatRegistrationIntervalDayLabel(dayDate)}.`,
        );
      } else {
        applyLocalMarks(selectedIds, dayDate, "absent");
        setSelectedIds([]);
        setMarkSuccess(
          `Marked ${selectedIds.length} registration${selectedIds.length === 1 ? "" : "s"} absent for ${formatRegistrationIntervalDayLabel(dayDate)} (preview — API under development).`,
        );
      }
    } catch (err) {
      setMarkError(err instanceof Error ? err.message : "Failed to mark absent");
    } finally {
      setMarkLoading(false);
    }
  }, [applyLocalMarks, canMarkAbsent, dayDate, selectedIds]);

  const visibleDayDates = useMemo(
    () =>
      dayDate === "all"
        ? [...EVENT_DAY_OPTIONS]
        : EVENT_DAY_OPTIONS.filter((date) => date === dayDate),
    [dayDate],
  );

  const columns = useMemo<ColumnDef<AttendanceModeUserRow>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={allVisibleSelected}
            disabled={markLoading || rows.length === 0}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedIds(allVisibleIds);
              } else {
                setSelectedIds([]);
              }
            }}
            aria-label="Select all visible rows"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedSet.has(row.original.id)}
            disabled={markLoading}
            onCheckedChange={(checked) => {
              setSelectedIds((prev) =>
                checked
                  ? [...prev, row.original.id]
                  : prev.filter((id) => id !== row.original.id),
              );
            }}
            aria-label={`Select ${row.original.userName}`}
          />
        ),
      },
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
          const loadingKey = `${row.original.id}:${date}`;
          const isPending = pendingPresentKey === loadingKey;
          return (
            <button
              type="button"
              disabled={markLoading || pendingPresentKey !== null}
              onClick={() => void handleMarkPresent(row.original.id, date)}
              title={`Mark ${label} present for ${formatRegistrationIntervalDayLabel(date)}`}
              aria-label={`Mark ${row.original.userName} present (${label}) on ${formatRegistrationIntervalDayLabel(date)}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-60",
                modeMarkButtonClass(day.attendanceMark),
              )}
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {label}
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
      allVisibleIds,
      allVisibleSelected,
      handleMarkPresent,
      markLoading,
      pendingPresentKey,
      rows.length,
      selectedSet,
      visibleDayDates,
    ],
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
            Filter by event day and attendance mode. Click Physical/Virtual (gray → green) to mark
            present. Select rows and use Absent for no-shows.
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

      {markError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <p className="text-sm text-destructive">{markError}</p>
        </div>
      )}

      {markSuccess && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{markSuccess}</p>
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
                <span className="mt-1 block">
                  Click Physical/Virtual to mark present (turns green). Select rows and Mark Absent
                  for no-shows
                  {!canMarkAbsent ? " — pick a participation day first for Absent." : "."}
                </span>
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedCount > 0 && (
                <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
              )}
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                disabled={
                  markLoading ||
                  pendingPresentKey !== null ||
                  selectedCount === 0 ||
                  !canMarkAbsent ||
                  loading
                }
                onClick={() => void handleMarkAbsent()}
                title={
                  canMarkAbsent
                    ? "Mark selected as Absent"
                    : "Select a participation day first"
                }
              >
                {markLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Marking…
                  </>
                ) : (
                  <>
                    <X className="h-3.5 w-3.5" />
                    Mark Absent
                  </>
                )}
              </Button>
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

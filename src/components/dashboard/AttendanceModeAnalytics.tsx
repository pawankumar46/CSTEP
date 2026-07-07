"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  BarChart3, MapPin, Monitor, Users, UserCheck, UserX, UserPlus, Pause, Clock,
} from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { ChartCard } from "@/components/shared/ChartCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
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
import { buildRegistrationStatusDistribution } from "@/lib/analytics-mappers";
import { slugifyFilename } from "@/lib/export-utils";
import { ATTENDANCE_MODE_EXPORT_COLUMNS } from "@/lib/registration-export";
import { getRegistrationOptionLabel } from "@/lib/registration-options";
import { getAllEvents } from "@/services/event.service";
import { getEventRegistrationsPage, getEventRegistrationsByAttendanceMode } from "@/services/registration.service";
import type { AttendanceMode, Event, Registration, RegistrationStatus } from "@/types";

const ATTENDANCE_MODE_OPTIONS: {
  value: AttendanceMode;
  label: string;
  icon: typeof Monitor;
}[] = [
  { value: "virtual", label: "Virtual", icon: Monitor },
  { value: "physical", label: "Physical", icon: MapPin },
];

const STATUS_VARIANT: Record<RegistrationStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  pending: "warning",
  accepted: "success",
  rejected: "destructive",
  on_hold: "secondary",
};

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const AXIS_TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };
const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
};

const TABLE_PAGE_SIZE = 10;

function ChartContainer({ height, children }: { height: number; children: React.ReactNode }) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function countByStatus(registrations: Registration[]) {
  return registrations.reduce(
    (acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<RegistrationStatus, number>,
  );
}

function buildFoodDistribution(registrations: Registration[]) {
  const counts = new Map<string, number>();

  for (const row of registrations) {
    const label = getRegistrationOptionLabel(row.foodPreference);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length],
    }))
    .filter((item) => item.value > 0);
}

const columns: ColumnDef<Registration>[] = [
  { accessorKey: "userName", header: "User Name" },
  { accessorKey: "phone", header: "Phone" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "participationDate",
    header: "Participation Dates",
    cell: ({ row }) => row.original.participationDateLabel ?? row.original.participationDate,
  },
  {
    accessorKey: "participationTime",
    header: "Participation Time",
    cell: ({ row }) => (row.original.participationTime === "full_day" ? "Full Day" : "Half Day"),
  },
  {
    accessorKey: "foodPreference",
    header: "Food Preference",
    cell: ({ row }) => getRegistrationOptionLabel(row.original.foodPreference),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANT[row.original.status]} className="capitalize">
        {row.original.status.replace("_", " ")}
      </Badge>
    ),
  },
];

export function AttendanceModeAnalytics() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [summaryRegistrations, setSummaryRegistrations] = useState<Registration[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const list = await getAllEvents();
        if (!cancelled) setEvents(list);
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

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const loadTablePage = useCallback(async () => {
    if (!selectedEventId || !attendanceMode) return;

    setLoading(true);
    setFetchError(null);

    try {
      const result = await getEventRegistrationsPage({
        eventId: selectedEventId,
        attendanceMode,
        page,
        pageSize: TABLE_PAGE_SIZE,
      });
      setRegistrations(result.registrations);
      setTotalCount(result.total);
      setTotalPages(result.totalPages);
      setHasNext(result.hasNext);
      setHasPrevious(result.hasPrevious);
    } catch (err) {
      setRegistrations([]);
      setFetchError(err instanceof Error ? err.message : "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, attendanceMode, page]);

  const loadSummary = useCallback(async () => {
    if (!selectedEventId || !attendanceMode) return;

    setSummaryLoading(true);

    try {
      const result = await getEventRegistrationsByAttendanceMode(selectedEventId, attendanceMode);
      setSummaryRegistrations(result.registrations);
      setTotalCount(result.total);
    } catch (err) {
      setSummaryRegistrations([]);
      setFetchError(err instanceof Error ? err.message : "Failed to load registration summary");
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedEventId, attendanceMode]);

  useEffect(() => {
    if (!selectedEventId || !attendanceMode) {
      setRegistrations([]);
      setSummaryRegistrations([]);
      setTotalCount(0);
      setFetchError(null);
      return;
    }
    loadSummary();
  }, [selectedEventId, attendanceMode, loadSummary]);

  useEffect(() => {
    if (!selectedEventId || !attendanceMode) return;
    loadTablePage();
  }, [selectedEventId, attendanceMode, page, loadTablePage]);

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setAttendanceMode(null);
    setPage(1);
    setRegistrations([]);
    setSummaryRegistrations([]);
    setTotalCount(0);
    setFetchError(null);
  };

  const handleModeChange = (value: AttendanceMode) => {
    setAttendanceMode(value);
    setPage(1);
    setFetchError(null);
  };

  const statusCounts = useMemo(() => countByStatus(summaryRegistrations), [summaryRegistrations]);
  const statusChartData = useMemo(
    () =>
      buildRegistrationStatusDistribution({
        ACCEPTED: statusCounts.accepted ?? 0,
        PENDING: statusCounts.pending ?? 0,
        HELD: statusCounts.on_hold ?? 0,
        REJECTED: statusCounts.rejected ?? 0,
      }),
    [statusCounts],
  );
  const foodChartData = useMemo(() => buildFoodDistribution(summaryRegistrations), [summaryRegistrations]);

  const modeLabel = attendanceMode === "virtual" ? "Virtual" : "Physical";
  const ModeIcon = attendanceMode === "virtual" ? Monitor : MapPin;

  const exportFilename = slugifyFilename(
    `${modeLabel.toLowerCase()}-registrations-${selectedEvent?.name ?? "event"}`,
  );
  const exportTitle = selectedEvent
    ? `${modeLabel} Registrations — ${selectedEvent.name}`
    : `${modeLabel} Registrations`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Select an event and attendance mode to load registrations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {eventsError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
              <p className="text-sm text-destructive">{eventsError}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="attendance-event">Step 1 — Event</Label>
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
              <Label htmlFor="attendance-mode">Step 2 — Attendance mode</Label>
              <Select
                value={attendanceMode ?? ""}
                onValueChange={(value) => handleModeChange(value as AttendanceMode)}
                disabled={!selectedEventId}
              >
                <SelectTrigger id="attendance-mode">
                  <SelectValue
                    placeholder={
                      selectedEventId ? "Choose virtual or physical" : "Select an event first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {ATTENDANCE_MODE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {option.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Loads registrations filtered by attendance mode from the API.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedEventId && !eventsLoading && events.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={BarChart3}
              title="Select an event"
              description="Choose an event above to view attendance mode analytics."
            />
          </CardContent>
        </Card>
      )}

      {selectedEventId && !attendanceMode && (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Users}
              title="Select an attendance mode"
              description="Choose virtual or physical to load registrations for this event."
            />
          </CardContent>
        </Card>
      )}

      {selectedEvent && attendanceMode && summaryLoading && <DashboardSkeleton />}

      {selectedEvent && attendanceMode && !summaryLoading && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{selectedEvent.name}</Badge>
            <Badge variant="outline" className="gap-1">
              <ModeIcon className="h-3 w-3" />
              {modeLabel}
            </Badge>
          </div>

          {fetchError && (
            <p className="text-sm text-destructive">{fetchError}</p>
          )}

          <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Total Registrations" value={totalCount} icon={UserPlus} />
            <StatCard title="Accepted" value={statusCounts.accepted ?? 0} icon={UserCheck} />
            <StatCard title="Pending" value={statusCounts.pending ?? 0} icon={Clock} />
            <StatCard title="On Hold" value={statusCounts.on_hold ?? 0} icon={Pause} />
            <StatCard title="Rejected" value={statusCounts.rejected ?? 0} icon={UserX} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <ChartCard title="Registration Status" description="Status breakdown for all matching registrations.">
              <ChartContainer height={180}>
                {statusChartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No registrations found
                  </div>
                ) : (
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="46%"
                      innerRadius={38}
                      outerRadius={58}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {statusChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                    />
                  </PieChart>
                )}
              </ChartContainer>
            </ChartCard>

            <ChartCard title="Food Preferences" description="Food preference breakdown for all matching registrations.">
              <ChartContainer height={180}>
                {foodChartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No food preference data
                  </div>
                ) : (
                  <BarChart data={foodChartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/60" />
                    <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                )}
              </ChartContainer>
            </ChartCard>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="py-3 px-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">
                    {modeLabel} Registrations
                  </CardTitle>
                  <CardDescription>
                    {totalCount} registration{totalCount === 1 ? "" : "s"} for this event and mode.
                  </CardDescription>
                </div>
                <ExportMenu
                  filename={exportFilename}
                  title={exportTitle}
                  columns={ATTENDANCE_MODE_EXPORT_COLUMNS}
                  data={summaryRegistrations}
                  disabled={summaryLoading}
                />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {loading && registrations.length === 0 && !fetchError ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading registrations…</p>
              ) : registrations.length === 0 && !fetchError ? (
                <EmptyState
                  icon={Users}
                  title="No registrations found"
                  description={`No ${modeLabel.toLowerCase()} registrations for this event yet.`}
                />
              ) : (
                <div className={loading ? "opacity-60 pointer-events-none" : undefined}>
                  <DataTable
                  columns={columns}
                  data={registrations}
                  searchKey="userName"
                  searchPlaceholder="Search by name…"
                  serverPagination={{
                    page,
                    totalPages,
                    hasNext,
                    hasPrevious,
                    onPageChange: setPage,
                  }}
                />
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

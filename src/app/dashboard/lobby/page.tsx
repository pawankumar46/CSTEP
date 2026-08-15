"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Check, Loader2, Pause, Pencil, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventSelectCard } from "@/components/dashboard/EventSelectCard";
import { AddLobbyUsersDialog } from "@/components/dashboard/AddLobbyUsersDialog";
import { EditRegistrationDialog } from "@/components/dashboard/EditRegistrationDialog";
import { SessionRegistrationsDialog } from "@/components/dashboard/SessionRegistrationsDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/useAuthStore";
import { useEventStore } from "@/store/useEventStore";
import { useLobbyStore } from "@/store/useLobbyStore";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { slugifyFilename } from "@/lib/export-utils";
import {
  ATTENDANCE_MODE_EXPORT_DAY_DATES,
  LOBBY_EXPORT_COLUMNS,
  lobbyAttendanceEntryForDate,
} from "@/lib/registration-export";
import { formatRegistrationIntervalDayLabel } from "@/lib/analytics-mappers";
import { getRegistrationOptionLabel } from "@/lib/registration-options";
import { cn } from "@/lib/utils";
import type { RegistrationEditFormValues } from "@/features/dashboard/admin-registration.schema";
import type { Registration, RegistrationStatus, UserRole } from "@/types";

const statusVariant: Record<RegistrationStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  pending: "warning",
  accepted: "success",
  rejected: "destructive",
  on_hold: "secondary",
};

const LOBBY_MANAGER_ROLES: UserRole[] = ["moderator", "event_administrator", "super_administrator"];
const LOBBY_ACTION_ROLES: UserRole[] = ["moderator", "event_administrator"];

export default function LobbyPage() {
  return (
    <RouteGuard allowedRoles={LOBBY_MANAGER_ROLES}>
      <LobbyContent />
    </RouteGuard>
  );
}

function LobbyContent() {
  const user = useAuthStore((s) => s.user);
  const { events, isLoading: eventsLoading, fetchEvents } = useEventStore();
  const {
    selectedEventId,
    registrations,
    registrationsLoading,
    registrationsSearch,
    registrationsPagination,
    error,
    clearError,
    setSelectedEventId,
    fetchRegistrations,
    clearRegistrationsSearch,
    fetchAllRegistrationsForExport,
    bulkUpdateStatus,
    updateRegistrationDayAttendance,
    updateRegistration,
    registerLobbyUser,
    signUpLobbyUser,
  } = useLobbyStore();
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | "all">("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editRegistrationOpen, setEditRegistrationOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false);
  const [sessionsRegistration, setSessionsRegistration] = useState<Registration | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<RegistrationStatus | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [attendanceLoadingKey, setAttendanceLoadingKey] = useState<string | null>(null);
  const selectedIdsRef = useRef<string[]>([]);
  selectedIdsRef.current = selectedIds;

  const canManage = user ? LOBBY_ACTION_ROLES.includes(user.role) : false;

  useEffect(() => {
    if (!error) return;

    const timer = window.setTimeout(() => {
      clearError();
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [error, clearError]);

  useEffect(() => {
    fetchEvents("upcoming");
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEventId) {
      setSearchDraft("");
      clearRegistrationsSearch();
      void fetchRegistrations(selectedEventId, 1, "");
    }
  }, [selectedEventId, fetchRegistrations, clearRegistrationsSearch]);

  const handleLobbySearchSubmit = useCallback(() => {
    if (!selectedEventId) return;
    void fetchRegistrations(selectedEventId, 1, searchDraft);
  }, [fetchRegistrations, searchDraft, selectedEventId]);

  const handleLobbySearchClear = useCallback(() => {
    if (!selectedEventId) return;
    setSearchDraft("");
    clearRegistrationsSearch();
    void fetchRegistrations(selectedEventId, 1, "");
  }, [clearRegistrationsSearch, fetchRegistrations, selectedEventId]);

  const handleLobbyPageChange = useCallback(
    (page: number) => {
      if (!selectedEventId) return;
      void fetchRegistrations(selectedEventId, page);
    },
    [fetchRegistrations, selectedEventId],
  );

  const filteredRegistrations = useMemo(() => {
    if (statusFilter === "all") return registrations;
    return registrations.filter((r) => r.status === statusFilter);
  }, [registrations, statusFilter]);

  useEffect(() => {
    const allowed = new Set(filteredRegistrations.map((r) => r.id));
    setSelectedIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [filteredRegistrations]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allVisibleIds = filteredRegistrations.map((r) => r.id);
  const allVisibleSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedSet.has(id));

  const selectedCount = selectedIds.length;

  const handleToggleDayAttendance = useCallback(
    async (registrationId: string, registrationDayId: string, nextAttended: boolean) => {
      const key = `${registrationId}:${registrationDayId}`;
      setAttendanceLoadingKey(key);
      try {
        await updateRegistrationDayAttendance(
          registrationId,
          registrationDayId,
          nextAttended,
        );
      } finally {
        setAttendanceLoadingKey(null);
      }
    },
    [updateRegistrationDayAttendance],
  );

  const applyStatusAction = useCallback(async (status: RegistrationStatus, ids: string[]) => {
    if (!selectedEventId || ids.length === 0) return;

    if (ids.length > 1) {
      setBulkLoading(true);
      setPendingBulkAction(status);
      try {
        await bulkUpdateStatus(ids, status);
        setSelectedIds([]);
      } finally {
        setBulkLoading(false);
        setPendingBulkAction(null);
      }
      return;
    }

    const id = ids[0];
    setActionLoadingId(id);
    try {
      await bulkUpdateStatus([id], status);
    } finally {
      setActionLoadingId(null);
    }
  }, [bulkUpdateStatus, selectedEventId]);

  const runBulkAction = useCallback(async (action: RegistrationStatus) => {
    await applyStatusAction(action, [...selectedIdsRef.current]);
  }, [applyStatusAction]);

  const handleEditRegistration = async (
    id: string,
    values: RegistrationEditFormValues,
    scheduleType?: "WHOLE_DAY" | "MULTI_SESSION",
  ) => {
    await updateRegistration(id, values, scheduleType);
  };

  const openEditDialog = (registration: Registration) => {
    setEditingRegistration(registration);
    setEditRegistrationOpen(true);
  };

  const openSessionsDialog = useCallback((registration: Registration) => {
    setSessionsRegistration(registration);
    setSessionsDialogOpen(true);
  }, []);

  const resolveActionIds = useCallback((rowId: string) => {
    const currentSelected = selectedIdsRef.current;
    return currentSelected.length > 1 ? [...currentSelected] : [rowId];
  }, []);

  const columns = useMemo<ColumnDef<Registration>[]>(() => {
    const selectionColumn: ColumnDef<Registration>[] = canManage
      ? [{
        id: "select",
        header: () => (
          <Checkbox
            checked={allVisibleSelected}
            disabled={bulkLoading}
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
            disabled={bulkLoading}
            onCheckedChange={(checked) => {
              setSelectedIds((prev) =>
                checked
                  ? [...prev, row.original.id]
                  : prev.filter((id) => id !== row.original.id)
              );
            }}
            aria-label={`Select ${row.original.userName}`}
          />
        ),
      }]
      : [];

    const baseColumns: ColumnDef<Registration>[] = [
      ...selectionColumn,
      { accessorKey: "userName", header: "User Name" },
      { accessorKey: "phone", header: "Phone Number" },
      { accessorKey: "email", header: "Email" },
      ...ATTENDANCE_MODE_EXPORT_DAY_DATES.map((date) => ({
        id: `day-${date}`,
        header: formatRegistrationIntervalDayLabel(date),
        cell: ({ row }: { row: { original: Registration } }) => {
          const entry = lobbyAttendanceEntryForDate(row.original, date);
          if (!entry) {
            return <span className="text-muted-foreground">—</span>;
          }
          const label = entry.attendanceMode === "virtual" ? "Virtual" : "Physical";
          const attended = entry.isAttended === true;
          const notAttended = entry.isAttended === false;
          const loadingKey =
            entry.id != null ? `${row.original.id}:${entry.id}` : null;
          const isLoading = loadingKey != null && attendanceLoadingKey === loadingKey;
          const canToggle = canManage && Boolean(entry.id);

          if (!canToggle) {
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
              disabled={isLoading || bulkLoading}
              title={
                attended
                  ? `Mark ${label} as not attended`
                  : `Mark ${label} as attended`
              }
              aria-label={
                attended
                  ? `Mark ${row.original.userName} not attended on ${date}`
                  : `Mark ${row.original.userName} attended on ${date}`
              }
              onClick={() =>
                void handleToggleDayAttendance(
                  row.original.id,
                  entry.id!,
                  !attended,
                )
              }
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              <Badge
                variant="outline"
                className={cn(
                  "font-normal cursor-pointer",
                  attended &&
                    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                  notAttended &&
                    "border-destructive/40 bg-destructive/10 text-destructive",
                )}
              >
                {isLoading ? "…" : label}
              </Badge>
            </button>
          );
        },
      })),
      {
        accessorKey: "registeredSessionsCount",
        header: "Sessions",
        cell: ({ row }) => {
          const count = row.original.registeredSessionsCount ?? 0;
          if (!canManage || count === 0) {
            return <span className="tabular-nums">{count}</span>;
          }
          return (
            <button
              type="button"
              className="tabular-nums font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              onClick={() => openSessionsDialog(row.original)}
              aria-label={`View ${count} sessions for ${row.original.userName}`}
            >
              {count}
            </button>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status]} className="capitalize">
            {row.original.status === "on_hold" ? "Hold" : row.original.status.replace("_", " ")}
          </Badge>
        ),
      },
    ];

    if (!canManage) return baseColumns;

    return [
      ...baseColumns,
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const isRowLoading = actionLoadingId === row.original.id;
          const bulkFromRow = selectedIds.length > 1;
          return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              title="Edit"
              disabled={bulkLoading || isRowLoading}
              onClick={() => openEditDialog(row.original)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-emerald-600"
              title={bulkFromRow ? `Approve ${selectedIds.length} selected` : "Accept"}
              disabled={bulkLoading || isRowLoading}
              onClick={() => void applyStatusAction("accepted", resolveActionIds(row.original.id))}
            >
              {(isRowLoading || (bulkLoading && pendingBulkAction === "accepted")) ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              title={bulkFromRow ? `Hold ${selectedIds.length} selected` : "Hold"}
              disabled={bulkLoading || isRowLoading}
              onClick={() => void applyStatusAction("on_hold", resolveActionIds(row.original.id))}
            >
              {(isRowLoading || (bulkLoading && pendingBulkAction === "on_hold")) ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Pause className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-destructive"
              title={bulkFromRow ? `Reject ${selectedIds.length} selected` : "Reject"}
              disabled={bulkLoading || isRowLoading}
              onClick={() => void applyStatusAction("rejected", resolveActionIds(row.original.id))}
            >
              {(isRowLoading || (bulkLoading && pendingBulkAction === "rejected")) ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
          </div>
          );
        },
      },
    ];
  }, [actionLoadingId, allVisibleIds, allVisibleSelected, applyStatusAction, attendanceLoadingKey, bulkLoading, canManage, handleToggleDayAttendance, openSessionsDialog, pendingBulkAction, resolveActionIds, selectedIds, selectedSet]);

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setStatusFilter("all");
    setSelectedIds([]);
  };

  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const exportFilename = slugifyFilename(
    selectedEvent ? `lobby-${selectedEvent.name}` : "lobby-registrations",
  );

  const fetchAllLobbyRegistrations = useCallback(async () => {
    if (!selectedEventId) return [];
    return fetchAllRegistrationsForExport(selectedEventId);
  }, [fetchAllRegistrationsForExport, selectedEventId]);

  if (eventsLoading && events.length === 0) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Lobby</h1>
        <p className="text-muted-foreground">Review and update participant registration status</p>
      </div>

      <EventSelectCard
        events={events}
        eventsLoading={eventsLoading}
        selectedEventId={selectedEventId}
        onEventChange={handleEventChange}
      />

      <EditRegistrationDialog
        open={editRegistrationOpen}
        onOpenChange={setEditRegistrationOpen}
        registration={editingRegistration}
        events={events}
        eventsLoading={eventsLoading}
        defaultEventId={selectedEventId}
        onSubmit={handleEditRegistration}
      />

      <SessionRegistrationsDialog
        open={sessionsDialogOpen}
        onOpenChange={setSessionsDialogOpen}
        registration={sessionsRegistration}
        canManage={canManage}
      />

      {!selectedEventId ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Select an event to view registered participants.
          </CardContent>
        </Card>
      ) : registrationsLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {registrationsPagination.total} registered participant
              {registrationsPagination.total === 1 ? "" : "s"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {canManage && selectedCount > 0 && (
                <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
              )}
              {canManage && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-600"
                    disabled={bulkLoading || actionLoadingId !== null || selectedCount === 0}
                    onClick={() => runBulkAction("accepted")}
                  >
                    {pendingBulkAction === "accepted" ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      "Approve"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkLoading || actionLoadingId !== null || selectedCount === 0}
                    onClick={() => runBulkAction("on_hold")}
                  >
                    {pendingBulkAction === "on_hold" ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Holding...
                      </>
                    ) : (
                      "Hold"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    disabled={bulkLoading || actionLoadingId !== null || selectedCount === 0}
                    onClick={() => runBulkAction("rejected")}
                  >
                    {pendingBulkAction === "rejected" ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      "Reject"
                    )}
                  </Button>
                </>
              )}
              <ExportMenu
                filename={exportFilename}
                title={selectedEvent ? `Manage Lobby — ${selectedEvent.name}` : "Manage Lobby"}
                columns={LOBBY_EXPORT_COLUMNS}
                data={filteredRegistrations}
                fetchAllData={fetchAllLobbyRegistrations}
                allFilename={`${exportFilename}-all`}
                allTitle={
                  selectedEvent
                    ? `Manage Lobby — ${selectedEvent.name} (All registered users)`
                    : "Manage Lobby (All registered users)"
                }
              />
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as RegistrationStatus | "all")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="on_hold">Hold</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="relative">
            {bulkLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/70">
                <div className="flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating registrations...
                </div>
              </div>
            )}
            <DataTable
              columns={columns}
              data={filteredRegistrations}
              searchPlaceholder="Search participants..."
              serverSearch={{
                value: searchDraft,
                onChange: setSearchDraft,
                onSubmit: handleLobbySearchSubmit,
                onClear: handleLobbySearchClear,
                appliedValue: registrationsSearch,
                placeholder: "Search participants… (press Enter)",
              }}
              searchExtra={
                canManage ? (
                  <AddLobbyUsersDialog
                    events={events}
                    defaultEventId={selectedEventId}
                    onSignUp={signUpLobbyUser}
                    onRegister={registerLobbyUser}
                  />
                ) : undefined
              }
              serverPagination={{
                page: registrationsPagination.page,
                totalPages: registrationsPagination.totalPages,
                hasNext: registrationsPagination.hasNext,
                hasPrevious: registrationsPagination.hasPrevious,
                onPageChange: handleLobbyPageChange,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

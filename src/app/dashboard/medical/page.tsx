"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Check, Loader2, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { EventSelectCard } from "@/components/dashboard/EventSelectCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { slugifyFilename } from "@/lib/export-utils";
import { MEDICAL_EXPORT_COLUMNS } from "@/lib/registration-export";
import { flattenMedicalAssistanceRows } from "@/lib/registration-mappers";
import { useAuthStore } from "@/store/useAuthStore";
import { useEventStore } from "@/store/useEventStore";
import { useLobbyStore } from "@/store/useLobbyStore";
import type { MedicalAssistanceRow, UserRole } from "@/types";

const LOBBY_ACTION_ROLES: UserRole[] = ["moderator", "event_administrator"];
type MedicalActionStatus = "accepted" | "rejected";

const requestStatusVariant = (
  status?: "pending" | "accepted" | "rejected"
): "success" | "warning" | "destructive" => {
  if (status === "accepted") return "success";
  if (status === "rejected") return "destructive";
  return "warning";
};

export default function MedicalPage() {
  return (
    <RouteGuard allowedRoles={["moderator", "event_administrator", "super_administrator"]}>
      <MedicalContent />
    </RouteGuard>
  );
}

function MedicalContent() {
  const user = useAuthStore((s) => s.user);
  const { events, isLoading: eventsLoading, fetchEvents } = useEventStore();
  const {
    selectedEventId,
    registrations,
    registrationsLoading,
    error,
    setSelectedEventId,
    fetchRegistrations,
    bulkUpdateMedicalStatus,
  } = useLobbyStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<MedicalActionStatus | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const selectedIdsRef = useRef<string[]>([]);
  selectedIdsRef.current = selectedIds;

  const canManage = user ? LOBBY_ACTION_ROLES.includes(user.role) : false;

  useEffect(() => {
    fetchEvents("upcoming");
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEventId) {
      fetchRegistrations(selectedEventId);
    }
  }, [selectedEventId, fetchRegistrations]);

  const medicalRows = useMemo(
    () => flattenMedicalAssistanceRows(registrations),
    [registrations],
  );

  useEffect(() => {
    const allowed = new Set(medicalRows.map((r) => r.id));
    setSelectedIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [medicalRows]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allVisibleIds = medicalRows.map((r) => r.id);
  const allVisibleSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedSet.has(id));
  const selectedCount = selectedIds.length;

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedIds([]);
  };

  const applyStatusAction = useCallback(async (status: MedicalActionStatus, ids: string[]) => {
    if (!selectedEventId || ids.length === 0) return;

    if (ids.length > 1) {
      setBulkLoading(true);
      setPendingBulkAction(status);
      try {
        await bulkUpdateMedicalStatus(ids, status);
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
      await bulkUpdateMedicalStatus([id], status);
    } finally {
      setActionLoadingId(null);
    }
  }, [bulkUpdateMedicalStatus, selectedEventId]);

  const runBulkAction = useCallback(async (action: MedicalActionStatus) => {
    await applyStatusAction(action, [...selectedIdsRef.current]);
  }, [applyStatusAction]);

  const resolveActionIds = useCallback((rowId: string) => {
    const currentSelected = selectedIdsRef.current;
    return currentSelected.length > 1 ? [...currentSelected] : [rowId];
  }, []);

  const columns = useMemo<ColumnDef<MedicalAssistanceRow>[]>(() => {
    const selectionColumn: ColumnDef<MedicalAssistanceRow>[] = canManage
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

    const baseColumns: ColumnDef<MedicalAssistanceRow>[] = [
      ...selectionColumn,
      { accessorKey: "userName", header: "User Name" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone", header: "Phone" },
      {
        accessorKey: "medicalNeeds",
        header: "Medical Needs",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-md" title={row.original.medicalNeeds}>
            {row.original.medicalNeeds}
          </span>
        ),
      },
      {
        accessorKey: "requiredDate",
        header: "Required Date",
      },
      {
        accessorKey: "status",
        header: "Medical Status",
        cell: ({ row }) => (
          <Badge variant={requestStatusVariant(row.original.status)} className="capitalize">
            {row.original.status}
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
                className="h-7 text-emerald-600"
                title={bulkFromRow ? `Accept ${selectedIds.length} selected` : "Accept"}
                disabled={bulkLoading || isRowLoading}
                onClick={() => void applyStatusAction("accepted", resolveActionIds(row.original.id))}
              >
                {isRowLoading || (bulkLoading && pendingBulkAction === "accepted") ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </>
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
                {isRowLoading || (bulkLoading && pendingBulkAction === "rejected") ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    Reject
                  </>
                )}
              </Button>
            </div>
          );
        },
      },
    ];
  }, [actionLoadingId, allVisibleIds, allVisibleSelected, applyStatusAction, bulkLoading, canManage, pendingBulkAction, resolveActionIds, selectedIds, selectedSet]);

  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const exportFilename = slugifyFilename(
    selectedEvent ? `medical-${selectedEvent.name}` : "medical-requests",
  );

  if (eventsLoading && events.length === 0) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Medical Requests</h1>
        <p className="text-muted-foreground">Review medical support requests for registered participants</p>
      </div>

      <EventSelectCard
        events={events}
        eventsLoading={eventsLoading}
        selectedEventId={selectedEventId}
        onEventChange={handleEventChange}
      />

      {!selectedEventId ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Select an event to view medical requests.
          </CardContent>
        </Card>
      ) : registrationsLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {medicalRows.length} medical request{medicalRows.length === 1 ? "" : "s"}
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
                        Accepting...
                      </>
                    ) : (
                      "Accept"
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
                title={selectedEvent ? `Manage Medical — ${selectedEvent.name}` : "Manage Medical"}
                columns={MEDICAL_EXPORT_COLUMNS}
                data={medicalRows}
              />
            </div>
          </div>
          <div className="relative">
            {bulkLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/70">
                <div className="flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating medical requests...
                </div>
              </div>
            )}
            <DataTable
              columns={columns}
              data={medicalRows}
              searchKey="userName"
              searchPlaceholder="Search users..."
              pageSize={10}
            />
          </div>
        </>
      )}
    </div>
  );
}

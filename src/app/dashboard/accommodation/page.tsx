"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowLeft, Check, Hotel, Loader2, Pause, Pencil, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { EventSelectCard } from "@/components/dashboard/EventSelectCard";
import { AddAccommodationAssistanceDialog } from "@/components/dashboard/AddAccommodationAssistanceDialog";
import { EditAccommodationAssistanceDialog } from "@/components/dashboard/EditAccommodationAssistanceDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { assistanceStatusVariant, formatAssistanceStatus } from "@/lib/assistance-status";
import { slugifyFilename } from "@/lib/export-utils";
import { ACCOMMODATION_EXPORT_COLUMNS } from "@/lib/registration-export";
import { useAuthStore } from "@/store/useAuthStore";
import { useEventStore } from "@/store/useEventStore";
import { useLobbyStore } from "@/store/useLobbyStore";
import type { AccommodationEditFormValues } from "@/features/dashboard/admin-accommodation.schema";
import type { AdminAccommodationAssistFormValues } from "@/features/dashboard/admin-accommodation.schema";
import type { AccommodationAssistanceRow, AssistanceActionStatus, UserRole } from "@/types";

const LOBBY_ACTION_ROLES: UserRole[] = ["moderator", "event_administrator"];

export default function AccommodationPage() {
  return (
    <RouteGuard allowedRoles={["moderator", "event_administrator", "super_administrator"]}>
      <AccommodationContent />
    </RouteGuard>
  );
}

function AccommodationContent() {
  const user = useAuthStore((s) => s.user);
  const { events, isLoading: eventsLoading, fetchEvents } = useEventStore();
  const {
    selectedEventId,
    accommodationAssistance,
    accommodationAssistanceLoading,
    accommodationPagination,
    error,
    setSelectedEventId,
    fetchAccommodationAssistance,
    bulkUpdateAccommodationStatus,
    addAccommodationAssistance,
    updateAccommodationAssistance,
  } = useLobbyStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addAccommodationOpen, setAddAccommodationOpen] = useState(false);
  const [editAccommodationOpen, setEditAccommodationOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AccommodationAssistanceRow | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<AssistanceActionStatus | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const selectedIdsRef = useRef<string[]>([]);
  selectedIdsRef.current = selectedIds;

  const canManage = user ? LOBBY_ACTION_ROLES.includes(user.role) : false;

  useEffect(() => {
    fetchEvents("upcoming");
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEventId) {
      void fetchAccommodationAssistance(selectedEventId, 1);
    }
  }, [selectedEventId, fetchAccommodationAssistance]);

  const handleAccommodationPageChange = useCallback((page: number) => {
    if (selectedEventId) {
      void fetchAccommodationAssistance(selectedEventId, page);
    }
  }, [fetchAccommodationAssistance, selectedEventId]);

  const accommodationRows = accommodationAssistance;

  useEffect(() => {
    const allowed = new Set(accommodationRows.map((r) => r.id));
    setSelectedIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [accommodationRows]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allVisibleIds = accommodationRows.map((r) => r.id);
  const allVisibleSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedSet.has(id));
  const selectedCount = selectedIds.length;

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedIds([]);
  };

  const handleAddAccommodation = async (values: AdminAccommodationAssistFormValues) => {
    await addAccommodationAssistance(values);
  };

  const handleEditAccommodation = async (id: string, values: AccommodationEditFormValues) => {
    await updateAccommodationAssistance(id, values);
  };

  const openEditDialog = (row: AccommodationAssistanceRow) => {
    setEditingRow(row);
    setEditAccommodationOpen(true);
  };

  const applyStatusAction = useCallback(async (status: AssistanceActionStatus, ids: string[]) => {
    if (!selectedEventId || ids.length === 0) return;

    if (ids.length > 1) {
      setBulkLoading(true);
      setPendingBulkAction(status);
      try {
        await bulkUpdateAccommodationStatus(ids, status);
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
      await bulkUpdateAccommodationStatus([id], status);
    } finally {
      setActionLoadingId(null);
    }
  }, [bulkUpdateAccommodationStatus, selectedEventId]);

  const runBulkAction = useCallback(async (action: AssistanceActionStatus) => {
    await applyStatusAction(action, [...selectedIdsRef.current]);
  }, [applyStatusAction]);

  const resolveActionIds = useCallback((rowId: string) => {
    const currentSelected = selectedIdsRef.current;
    return currentSelected.length > 1 ? [...currentSelected] : [rowId];
  }, []);

  const columns = useMemo<ColumnDef<AccommodationAssistanceRow>[]>(() => {
    const selectionColumn: ColumnDef<AccommodationAssistanceRow>[] = canManage
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

    const baseColumns: ColumnDef<AccommodationAssistanceRow>[] = [
      ...selectionColumn,
      { accessorKey: "userName", header: "User Name" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone", header: "Phone" },
      { accessorKey: "hotelName", header: "Hotel" },
      {
        accessorKey: "address",
        header: "Address",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-md" title={row.original.address}>
            {row.original.address}
          </span>
        ),
      },
      { accessorKey: "roomNo", header: "Room" },
      { accessorKey: "fromDate", header: "From" },
      { accessorKey: "toDate", header: "To" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={assistanceStatusVariant[row.original.status]} className="capitalize">
            {formatAssistanceStatus(row.original.status)}
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
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
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
                className="h-7"
                title={bulkFromRow ? `Hold ${selectedIds.length} selected` : "Hold"}
                disabled={bulkLoading || isRowLoading}
                onClick={() => void applyStatusAction("on_hold", resolveActionIds(row.original.id))}
              >
                {isRowLoading || (bulkLoading && pendingBulkAction === "on_hold") ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Pause className="h-3 w-3 mr-1" />
                    Hold
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
    selectedEvent ? `accommodation-${selectedEvent.name}` : "accommodation-requests",
  );

  if (eventsLoading && events.length === 0) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit text-muted-foreground">
        <Link href="/dashboard/assistance">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Manage Assistance
        </Link>
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manage Accommodation Requests</h1>
          <p className="text-muted-foreground">Review accommodation support requests for registered participants</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setAddAccommodationOpen(true)}>
            <Hotel className="h-4 w-4 mr-2" />
            Add accommodation assistance
          </Button>
        )}
      </div>

      <EventSelectCard
        events={events}
        eventsLoading={eventsLoading}
        selectedEventId={selectedEventId}
        onEventChange={handleEventChange}
      />

      <AddAccommodationAssistanceDialog
        open={addAccommodationOpen}
        onOpenChange={setAddAccommodationOpen}
        events={events}
        eventsLoading={eventsLoading}
        defaultEventId={selectedEventId}
        onSubmit={handleAddAccommodation}
      />

      <EditAccommodationAssistanceDialog
        open={editAccommodationOpen}
        onOpenChange={setEditAccommodationOpen}
        row={editingRow}
        events={events}
        eventsLoading={eventsLoading}
        defaultEventId={selectedEventId}
        onSubmit={handleEditAccommodation}
      />

      {!selectedEventId ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Select an event to view accommodation requests.
          </CardContent>
        </Card>
      ) : accommodationAssistanceLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {accommodationPagination.total} accommodation request{accommodationPagination.total === 1 ? "" : "s"}
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
                title={selectedEvent ? `Manage Accommodation — ${selectedEvent.name}` : "Manage Accommodation"}
                columns={ACCOMMODATION_EXPORT_COLUMNS}
                data={accommodationRows}
              />
            </div>
          </div>
          <div className="relative">
            {bulkLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/70">
                <div className="flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating accommodation requests...
                </div>
              </div>
            )}
            <DataTable
              columns={columns}
              data={accommodationRows}
              searchKey="userName"
              searchPlaceholder="Search users..."
              serverPagination={{
                page: accommodationPagination.page,
                totalPages: accommodationPagination.totalPages,
                hasNext: accommodationPagination.hasNext,
                hasPrevious: accommodationPagination.hasPrevious,
                onPageChange: handleAccommodationPageChange,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { EventSelectCard } from "@/components/dashboard/EventSelectCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuthStore } from "@/store/useAuthStore";
import { useEventStore } from "@/store/useEventStore";
import { useLobbyStore } from "@/store/useLobbyStore";
import type { Registration, UserRole } from "@/types";

const LOBBY_ACTION_ROLES: UserRole[] = ["moderator", "event_administrator"];

const requestStatusVariant = (
  status?: "pending" | "accepted" | "rejected"
): "success" | "warning" | "destructive" => {
  if (status === "accepted") return "success";
  if (status === "rejected") return "destructive";
  return "warning";
};

export default function TravelPage() {
  return (
    <RouteGuard allowedRoles={["moderator", "event_administrator", "super_administrator"]}>
      <TravelContent />
    </RouteGuard>
  );
}

function TravelContent() {
  const user = useAuthStore((s) => s.user);
  const { events, isLoading: eventsLoading, fetchEvents } = useEventStore();
  const {
    selectedEventId,
    registrations,
    registrationsLoading,
    error,
    setSelectedEventId,
    fetchRegistrations,
    updateTravelStatus,
  } = useLobbyStore();

  const canManage = user ? LOBBY_ACTION_ROLES.includes(user.role) : false;

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEventId) {
      fetchRegistrations(selectedEventId);
    }
  }, [selectedEventId, fetchRegistrations]);

  const travelRegistrations = useMemo(
    () => registrations.filter((r) => r.travelRequired),
    [registrations]
  );

  const columns = useMemo<ColumnDef<Registration>[]>(() => {
    const baseColumns: ColumnDef<Registration>[] = [
      { accessorKey: "userName", header: "User Name" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone", header: "Phone" },
      {
        id: "travelArrangement",
        header: "Travel Arrangement",
        cell: ({ row }) => row.original.travelArrangementLabel ?? "—",
      },
      {
        accessorKey: "travelStatus",
        header: "Travel Status",
        cell: ({ row }) => (
          <Badge variant={requestStatusVariant(row.original.travelStatus)} className="capitalize">
            {row.original.travelStatus ?? "pending"}
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
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-emerald-600"
              title="Accept"
              onClick={() => updateTravelStatus(row.original.id, "accepted")}
            >
              <Check className="h-3 w-3 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-destructive"
              title="Reject"
              onClick={() => updateTravelStatus(row.original.id, "rejected")}
            >
              <X className="h-3 w-3 mr-1" />
              Reject
            </Button>
          </div>
        ),
      },
    ];
  }, [canManage, updateTravelStatus]);

  if (eventsLoading && events.length === 0) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Travel Requests</h1>
        <p className="text-muted-foreground">Review travel arrangements for registered participants</p>
      </div>

      <EventSelectCard
        events={events}
        eventsLoading={eventsLoading}
        selectedEventId={selectedEventId}
        onEventChange={setSelectedEventId}
      />

      {!selectedEventId ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Select an event to view travel requests.
          </CardContent>
        </Card>
      ) : registrationsLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-sm text-muted-foreground">
            {travelRegistrations.length} travel request{travelRegistrations.length === 1 ? "" : "s"}
          </p>
          <DataTable
            columns={columns}
            data={travelRegistrations}
            searchKey="userName"
            searchPlaceholder="Search users..."
            pageSize={10}
          />
        </>
      )}
    </div>
  );
}

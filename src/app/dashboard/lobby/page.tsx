"use client";

import { useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Check, Pause, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventSelectCard } from "@/components/dashboard/EventSelectCard";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/useAuthStore";
import { useEventStore } from "@/store/useEventStore";
import { useLobbyStore } from "@/store/useLobbyStore";
import { RouteGuard } from "@/components/layout/RouteGuard";
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
    error,
    setSelectedEventId,
    fetchRegistrations,
    updateStatus,
  } = useLobbyStore();
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | "all">("all");

  const canManage = user ? LOBBY_ACTION_ROLES.includes(user.role) : false;

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEventId) {
      fetchRegistrations(selectedEventId);
    }
  }, [selectedEventId, fetchRegistrations]);

  const filteredRegistrations = useMemo(() => {
    if (statusFilter === "all") return registrations;
    return registrations.filter((r) => r.status === statusFilter);
  }, [registrations, statusFilter]);

  const columns = useMemo<ColumnDef<Registration>[]>(() => {
    const baseColumns: ColumnDef<Registration>[] = [
      { accessorKey: "userName", header: "User Name" },
      { accessorKey: "phone", header: "Phone Number" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "participationDate",
        header: "Participation Date",
        cell: ({ row }) => row.original.participationDateLabel ?? row.original.participationDate,
      },
      {
        accessorKey: "participationTime",
        header: "Participation Time",
        cell: ({ row }) => (row.original.participationTime === "full_day" ? "Full Day" : "Half Day"),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status]} className="capitalize">
            {row.original.status.replace("_", " ")}
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
              onClick={() => updateStatus(row.original.id, "accepted")}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              title="Hold"
              onClick={() => updateStatus(row.original.id, "on_hold")}
            >
              <Pause className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-destructive"
              title="Reject"
              onClick={() => updateStatus(row.original.id, "rejected")}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ),
      },
    ];
  }, [canManage, updateStatus]);

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setStatusFilter("all");
  };

  if (eventsLoading && events.length === 0) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Event Lobby</h1>
        <p className="text-muted-foreground">Manage participant registrations</p>
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredRegistrations.length} registered participant{filteredRegistrations.length === 1 ? "" : "s"}
            </p>
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
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DataTable
            columns={columns}
            data={filteredRegistrations}
            searchKey="userName"
            searchPlaceholder="Search participants..."
            pageSize={10}
          />
        </>
      )}
    </div>
  );
}

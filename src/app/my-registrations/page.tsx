"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { ClipboardList, Loader2, Trash2 } from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRegistrationIntervalDayLabel } from "@/lib/analytics-mappers";
import { ICAS_CONFERENCE, isIcasEventName } from "@/lib/icas-conference";
import {
  ATTENDANCE_MODE_EXPORT_DAY_DATES,
  lobbyAttendanceModeForDate,
  registeredSessionsForDate,
} from "@/lib/registration-export";
import { formatDateTime } from "@/lib/utils";
import { isEventRegistrationClosed } from "@/lib/event-registration-window";
import { ROUTES } from "@/lib/routes";
import { useRegistrationStore } from "@/store/useRegistrationStore";
import type { Registration, RegistrationStatus } from "@/types";

const STATUS_VARIANT: Record<
  RegistrationStatus,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  pending: "warning",
  accepted: "success",
  rejected: "destructive",
  on_hold: "secondary",
};

function formatStatus(status: RegistrationStatus): string {
  return status === "on_hold" ? "Hold" : status.replace("_", " ");
}

function formatRegistrationEventLabel(registration: Registration): string {
  const name = registration.eventName?.trim();
  if (name && isIcasEventName(name)) return ICAS_CONFERENCE.shortName;
  if (name) return name;
  if (String(registration.eventId) === "11") return ICAS_CONFERENCE.shortName;
  return registration.eventId ? `Event ${registration.eventId}` : "—";
}

function MyRegistrationsContent() {
  const router = useRouter();
  const {
    registrations,
    isLoading,
    error,
    fetchRegistrations,
    deleteRegistration,
  } = useRegistrationStore();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingRegistration, setDeletingRegistration] = useState<Registration | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await fetchRegistrations();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchRegistrations]);

  const openDeleteDialog = useCallback((registration: Registration) => {
    setDeletingRegistration(registration);
    setDeleteError(null);
    setDeleteOpen(true);
  }, []);

  const handleDeleteRegistration = async () => {
    if (!deletingRegistration) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await deleteRegistration(deletingRegistration.id);
      setDeleteOpen(false);
      setDeletingRegistration(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete registration");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const columns = useMemo<ColumnDef<Registration>[]>(
    () => [
      {
        id: "event",
        header: "Event",
        cell: ({ row }) => formatRegistrationEventLabel(row.original),
      },
      ...ATTENDANCE_MODE_EXPORT_DAY_DATES.map((date) => ({
        id: `day-${date}`,
        header: formatRegistrationIntervalDayLabel(date),
        cell: ({ row }: { row: { original: Registration } }) => {
          const mode = lobbyAttendanceModeForDate(row.original, date);
          const sessionCount = registeredSessionsForDate(row.original, date);
          if (mode === "—" && sessionCount === 0) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <div className="space-y-1">
              {mode !== "—" && (
                <Badge variant="outline" className="font-normal">
                  {mode}
                </Badge>
              )}
              {sessionCount > 0 && (
                <p className="text-xs text-muted-foreground tabular-nums">
                  {sessionCount} session{sessionCount === 1 ? "" : "s"}
                </p>
              )}
            </div>
          );
        },
      })),
      {
        accessorKey: "registeredSessionsCount",
        header: "Sessions",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.registeredSessionsCount ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]} className="capitalize">
            {formatStatus(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Registered",
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
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="Delete"
            onClick={() => openDeleteDialog(row.original)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Delete registration</span>
          </Button>
        ),
      },
    ],
    [openDeleteDialog],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Registrations</h1>
          <p className="text-muted-foreground">
            {isEventRegistrationClosed()
              ? "Events you registered for. New event registration is closed."
              : "Events you have registered for. You can remove a registration anytime."}
          </p>
        </div>
        {isEventRegistrationClosed() ? (
          <Button asChild>
            <Link href={ROUTES.recordings}>Watch Recordings</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href={ROUTES.eventRegister}>Register for event</Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading registrations…
        </div>
      ) : error && registrations.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => void fetchRegistrations()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : registrations.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No registrations yet"
          description={
            isEventRegistrationClosed()
              ? "You did not register for this event. You can still watch session recordings."
              : "You have not registered for an event. Register to see it listed here."
          }
          action={
            isEventRegistrationClosed()
              ? {
                  label: "Watch Recordings",
                  onClick: () => router.push(ROUTES.recordings),
                }
              : {
                  label: "Register for event",
                  onClick: () => router.push(ROUTES.eventRegister),
                }
          }
        />
      ) : (
        <DataTable columns={columns} data={registrations} pageSize={10} />
      )}

      <Button variant="outline" asChild>
        <Link href={ROUTES.home}>Back to Home</Link>
      </Button>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeletingRegistration(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete registration</DialogTitle>
            <DialogDescription>
              Remove your registration for{" "}
              {deletingRegistration
                ? formatRegistrationEventLabel(deletingRegistration)
                : "this event"}
              ? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteRegistration()}
              disabled={deleteSubmitting}
            >
              {deleteSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MyRegistrationsPage() {
  return (
    <RouteGuard loginRedirect={ROUTES.myRegistrations}>
      <div className="flex min-h-screen flex-col">
        <LandingNavbar />
        <main className="container mx-auto flex-1 px-4 py-8">
          <MyRegistrationsContent />
        </main>
        <LandingFooter />
      </div>
    </RouteGuard>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clock, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { assistanceStatusVariant, formatAssistanceStatus } from "@/lib/assistance-status";
import { formatParticipationDateDisplay } from "@/lib/registration-mappers";
import { cn } from "@/lib/utils";
import {
  approveSessionRegistration,
  bulkUpdateSessionRegistrationStatus,
  getLobbyRegistrationDetail,
  rejectSessionRegistration,
  type SessionBulkStatus,
} from "@/services/lobby.service";
import type { Registration, SessionRegistration } from "@/types";

interface SessionRegistrationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: Pick<Registration, "id" | "userName" | "email"> | null;
  canManage?: boolean;
}

function formatSessionTime(value: string): string {
  const [hh = "0", mm = "0"] = value.split(":");
  const hour = Number(hh);
  const minute = Number(mm);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function SessionRegistrationsDialog({
  open,
  onOpenChange,
  registration,
  canManage = false,
}: SessionRegistrationsDialogProps) {
  const [sessions, setSessions] = useState<SessionRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<SessionBulkStatus | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSessionIds = useMemo(() => sessions.map((session) => session.id), [sessions]);
  const allSelected =
    allSessionIds.length > 0 && allSessionIds.every((id) => selectedSet.has(id));
  const selectedCount = selectedIds.length;
  const isBusy = actionLoadingId !== null || bulkLoading;

  const loadSessions = useCallback(async (registrationId: string) => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const detail = await getLobbyRegistrationDetail(registrationId);
      const nextSessions = detail.sessionRegistrations ?? [];
      setSessions(nextSessions);
      setSelectedIds((prev) =>
        prev.filter((id) => nextSessions.some((session) => session.id === id)),
      );
    } catch (err) {
      setSessions([]);
      setSelectedIds([]);
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !registration) {
      setSessions([]);
      setError(null);
      setLoading(false);
      setActionLoadingId(null);
      setBulkLoading(false);
      setPendingBulkAction(null);
      setSelectedIds([]);
      setActionError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setActionError(null);
      setSelectedIds([]);
      try {
        const detail = await getLobbyRegistrationDetail(registration.id);
        if (!cancelled) {
          setSessions(detail.sessionRegistrations ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setSessions([]);
          setError(err instanceof Error ? err.message : "Failed to load sessions");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, registration]);

  const handleSessionAction = async (
    sessionId: string,
    action: "approve" | "reject",
  ) => {
    if (!registration) return;

    setActionLoadingId(sessionId);
    setActionError(null);
    try {
      if (action === "approve") {
        await approveSessionRegistration(registration.id, sessionId);
      } else {
        await rejectSessionRegistration(registration.id, sessionId);
      }
      await loadSessions(registration.id);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} session`,
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkAction = async (status: SessionBulkStatus) => {
    if (!registration || selectedIds.length === 0) return;

    setBulkLoading(true);
    setPendingBulkAction(status);
    setActionError(null);
    try {
      await bulkUpdateSessionRegistrationStatus(selectedIds, status);
      setSelectedIds([]);
      await loadSessions(registration.id);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : `Failed to ${status === "APPROVED" ? "approve" : "reject"} sessions`,
      );
    } finally {
      setBulkLoading(false);
      setPendingBulkAction(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registered Sessions</DialogTitle>
          <DialogDescription>
            {registration
              ? `${registration.userName}${registration.email ? ` · ${registration.email}` : ""}`
              : "Session details for this registration"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading sessions…
          </div>
        ) : error ? (
          <p className="py-6 text-sm text-destructive text-center">{error}</p>
        ) : sessions.length === 0 ? (
          <div className="py-10 text-center space-y-1">
            <p className="text-sm font-medium">No sessions registered</p>
            <p className="text-xs text-muted-foreground">
              This participant has not selected any sessions yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {actionError && (
              <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                {actionError}
              </p>
            )}

            {canManage && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    disabled={isBusy}
                    onCheckedChange={(checked) => {
                      setSelectedIds(checked ? allSessionIds : []);
                    }}
                    aria-label="Select all sessions"
                  />
                  <span className="text-xs text-muted-foreground">
                    {selectedCount > 0 ? `${selectedCount} selected` : "Select sessions"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-emerald-600"
                    disabled={isBusy || selectedCount === 0}
                    onClick={() => void handleBulkAction("APPROVED")}
                  >
                    {pendingBulkAction === "APPROVED" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-destructive"
                    disabled={isBusy || selectedCount === 0}
                    onClick={() => void handleBulkAction("REJECTED")}
                  >
                    {pendingBulkAction === "REJECTED" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            )}

            <ul className="space-y-3">
              {sessions.map((session) => {
                const isActionLoading = actionLoadingId === session.id;
                const canApprove = canManage && session.status !== "accepted";
                const canReject = canManage && session.status !== "rejected";
                const isSelected = selectedSet.has(session.id);

                return (
                  <li
                    key={session.id}
                    className="rounded-xl border border-border bg-card p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 min-w-0">
                        {canManage && (
                          <Checkbox
                            className="mt-0.5"
                            checked={isSelected}
                            disabled={isBusy}
                            onCheckedChange={(checked) => {
                              setSelectedIds((prev) =>
                                checked
                                  ? [...prev, session.id]
                                  : prev.filter((id) => id !== session.id),
                              );
                            }}
                            aria-label={`Select ${session.sessionTitle}`}
                          />
                        )}
                        <p className="font-medium text-sm leading-snug">{session.sessionTitle}</p>
                      </div>
                      <Badge
                        variant={assistanceStatusVariant[session.status]}
                        className="capitalize shrink-0"
                      >
                        {formatAssistanceStatus(session.status)}
                      </Badge>
                    </div>
                    <div className={cn(
                      "flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground",
                      canManage && "pl-6",
                    )}>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatParticipationDateDisplay(session.date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatSessionTime(session.startTime)} – {formatSessionTime(session.endTime)}
                      </span>
                      {session.track && (
                        <span className="capitalize">Track: {session.track}</span>
                      )}
                    </div>
                    {canManage && (canApprove || canReject) && (
                      <div className="flex items-center gap-2 pt-1 pl-6">
                        {canApprove && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-emerald-600"
                            disabled={isBusy}
                            onClick={() => void handleSessionAction(session.id, "approve")}
                          >
                            {isActionLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Approve
                          </Button>
                        )}
                        {canReject && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-destructive"
                            disabled={isBusy}
                            onClick={() => void handleSessionAction(session.id, "reject")}
                          >
                            {isActionLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                            Reject
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

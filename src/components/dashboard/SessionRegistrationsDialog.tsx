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
import { getRegistrationOptionLabel } from "@/lib/registration-options";
import { cn } from "@/lib/utils";
import {
  approveSessionRegistration,
  bulkUpdateSessionRegistrationStatus,
  getLobbyRegistrationDetail,
  rejectSessionRegistration,
  type SessionBulkStatus,
} from "@/services/lobby.service";
import type { Registration, RegistrationDay } from "@/types";

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
  const [days, setDays] = useState<RegistrationDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<SessionBulkStatus | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const daysWithSessions = useMemo(
    () => days.filter((day) => day.sessions.length > 0),
    [days],
  );
  const hasSessions = daysWithSessions.length > 0;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const rowKeyToSessionId = useMemo(() => {
    const map = new Map<string, string>();
    for (const day of days) {
      for (const session of day.sessions) {
        map.set(`${day.id}-${session.id}`, session.id);
      }
    }
    return map;
  }, [days]);
  const allRowKeys = useMemo(() => [...rowKeyToSessionId.keys()], [rowKeyToSessionId]);
  const allSelected =
    allRowKeys.length > 0 && allRowKeys.every((key) => selectedSet.has(key));
  const selectedCount = selectedIds.length;
  const isBusy = actionLoadingId !== null || bulkLoading;

  const buildDays = useCallback((detail: Registration): RegistrationDay[] => {
    if (detail.days && detail.days.length > 0) return detail.days;
    const sessions = detail.sessionRegistrations ?? [];
    if (sessions.length === 0) return [];
    return [
      {
        id: "all",
        dayId: "",
        date: sessions[0]?.date ?? "",
        attendanceMode: detail.attendanceMode,
        sessions,
      },
    ];
  }, []);

  const loadSessions = useCallback(
    async (registrationId: string) => {
      setLoading(true);
      setError(null);
      setActionError(null);
      try {
        const detail = await getLobbyRegistrationDetail(registrationId);
        const nextDays = buildDays(detail);
        const validKeys = new Set(
          nextDays.flatMap((day) =>
            day.sessions.map((session) => `${day.id}-${session.id}`),
          ),
        );
        setDays(nextDays);
        setSelectedIds((prev) => prev.filter((key) => validKeys.has(key)));
      } catch (err) {
        setDays([]);
        setSelectedIds([]);
        setError(err instanceof Error ? err.message : "Failed to load sessions");
      } finally {
        setLoading(false);
      }
    },
    [buildDays],
  );

  useEffect(() => {
    if (!open || !registration) {
      setDays([]);
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
          setDays(buildDays(detail));
        }
      } catch (err) {
        if (!cancelled) {
          setDays([]);
          setError(err instanceof Error ? err.message : "Failed to load sessions");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, registration, buildDays]);

  const handleSessionAction = async (
    rowKey: string,
    sessionId: string,
    action: "approve" | "reject",
  ) => {
    if (!registration) return;

    setActionLoadingId(rowKey);
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

    const sessionIds = [
      ...new Set(
        selectedIds
          .map((key) => rowKeyToSessionId.get(key))
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (sessionIds.length === 0) return;

    setBulkLoading(true);
    setPendingBulkAction(status);
    setActionError(null);
    try {
      await bulkUpdateSessionRegistrationStatus(sessionIds, status);
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
        ) : !hasSessions ? (
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
                      setSelectedIds(checked ? allRowKeys : []);
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

            <div className="space-y-4">
              {daysWithSessions.map((day) => (
                <div key={day.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {day.dayNumber ? `Day ${day.dayNumber}` : "Day"}
                      {day.date ? ` · ${formatParticipationDateDisplay(day.date)}` : ""}
                    </p>
                    <Badge variant="outline" className="shrink-0">
                      {getRegistrationOptionLabel(day.attendanceMode)}
                    </Badge>
                  </div>
                  <ul className="space-y-3">
                    {day.sessions.map((session) => {
                      const rowKey = `${day.id}-${session.id}`;
                      const isActionLoading = actionLoadingId === rowKey;
                      const canApprove = canManage && session.status !== "accepted";
                      const canReject = canManage && session.status !== "rejected";
                      const isSelected = selectedSet.has(rowKey);

                      return (
                        <li
                          key={rowKey}
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
                                        ? [...prev, rowKey]
                                        : prev.filter((key) => key !== rowKey),
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
                                  onClick={() => void handleSessionAction(rowKey, session.id, "approve")}
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
                                  onClick={() => void handleSessionAction(rowKey, session.id, "reject")}
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
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

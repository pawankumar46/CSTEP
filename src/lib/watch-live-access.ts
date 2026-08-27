import { isBaseUserRole, isStaffRole } from "@/lib/auth-utils";
import { readPublicEnv } from "@/lib/env";
import { formatEventDateRange } from "@/lib/event-display";
import { isEventPubliclyEnded, isEventRegistrationClosed } from "@/lib/event-registration-window";
import type { Event, UserRole } from "@/types";

export type EventStreamPhase = "upcoming" | "live" | "ended";

/**
 * Base users unlock Watch Live at this instant (IST).
 * - `NEXT_PUBLIC_STREAM_OPEN_TO_BASE_USERS=true` → force open
 * - `NEXT_PUBLIC_STREAM_OPEN_TO_BASE_USERS=false` → force closed
 * - unset → open at/after 19 Aug 2026 06:00 IST
 */
export const BASE_USER_STREAM_OPENS_AT = new Date("2026-08-19T06:00:00+05:30");
export const BASE_USER_STREAM_OPENS_LABEL = "19 August at 6:00 AM";

export function isTemporaryBaseUserStreamAccessActive(now = new Date()): boolean {
  const override = readPublicEnv("NEXT_PUBLIC_STREAM_OPEN_TO_BASE_USERS");
  if (override === "true") return true;
  if (override === "false") return false;
  return now.getTime() >= BASE_USER_STREAM_OPENS_AT.getTime();
}

export function canBypassStreamParticipantChecks(role?: UserRole): boolean {
  if (!role) return false;
  return isStaffRole(role);
}

export interface WatchLiveAccess {
  phase: EventStreamPhase | null;
  canWatchLive: boolean;
  disabledTitle: string;
  /** Unauthenticated users may sign in when the stream is live. */
  showSignInToWatch: boolean;
  /** Authenticated base users who still need event registration. */
  showRegisterToWatch: boolean;
}

type EventTiming = Pick<Event, "date" | "endDate" | "status">;

function parseEventTime(value: string): number | null {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/** Whether the event stream window is upcoming, live, or ended. */
export function getEventStreamPhase(event: EventTiming, now = new Date()): EventStreamPhase {
  if (isEventPubliclyEnded(now)) {
    return "ended";
  }

  if (event.status === "cancelled" || event.status === "completed") {
    return "ended";
  }

  if (event.status === "live") {
    return "live";
  }

  const nowMs = now.getTime();
  const start = parseEventTime(event.date);
  const end = parseEventTime(event.endDate ?? event.date);

  if (start === null || end === null) {
    return "ended";
  }

  if (nowMs < start) return "upcoming";
  if (nowMs > end) return "ended";
  return "live";
}

function upcomingTitle(event: EventTiming): string {
  const dates = formatEventDateRange(event.date, event.endDate);
  return dates
    ? `Live feed starts from 19th August (${dates})`
    : "Live feed starts from 19th August";
}

export function getWatchLiveAccess({
  event,
  isAuthenticated,
  isRegistered,
  role,
}: {
  event: EventTiming | null | undefined;
  isAuthenticated: boolean;
  isRegistered: boolean;
  role?: UserRole;
}): WatchLiveAccess {
  const denied = (
    disabledTitle: string,
    phase: EventStreamPhase | null = event ? getEventStreamPhase(event) : null,
    extras: Partial<Pick<WatchLiveAccess, "showSignInToWatch" | "showRegisterToWatch">> = {},
  ): WatchLiveAccess => ({
    phase,
    canWatchLive: false,
    disabledTitle,
    showSignInToWatch: false,
    showRegisterToWatch: false,
    ...extras,
  });

  if (!event) {
    return denied("Live stream is not available right now", null);
  }

  const phase = getEventStreamPhase(event);
  const streamOpenToBaseUsers = isTemporaryBaseUserStreamAccessActive();

  if (isAuthenticated && role && isStaffRole(role)) {
    return {
      phase,
      canWatchLive: true,
      disabledTitle: "",
      showSignInToWatch: false,
      showRegisterToWatch: false,
    };
  }

  if (phase === "ended") {
    return denied("This event has ended", phase);
  }

  if (phase === "upcoming") {
    return denied(upcomingTitle(event), phase);
  }

  if (!isAuthenticated) {
    return denied("Sign in to watch the live stream", phase, { showSignInToWatch: true });
  }

  if (!role || !isBaseUserRole(role)) {
    return denied("Live stream is only available to registered participants", phase);
  }

  if (!streamOpenToBaseUsers) {
    return denied(`Live stream opens on ${BASE_USER_STREAM_OPENS_LABEL}`, phase);
  }

  if (!isRegistered) {
    return denied("Register for the event to watch live", phase, {
      showRegisterToWatch: !isEventRegistrationClosed(),
    });
  }

  return {
    phase,
    canWatchLive: true,
    disabledTitle: "",
    showSignInToWatch: false,
    showRegisterToWatch: false,
  };
}

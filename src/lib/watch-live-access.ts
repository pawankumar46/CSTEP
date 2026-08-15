import { isBaseUserRole, isStaffRole } from "@/lib/auth-utils";
import { readPublicEnv } from "@/lib/env";
import { formatEventDateRange } from "@/lib/event-display";
import type { Event, UserRole } from "@/types";

export type EventStreamPhase = "upcoming" | "live" | "ended";

/** Base users unlock Watch Live at this instant (IST). */
export const BASE_USER_STREAM_OPENS_AT = new Date("2026-08-20T06:00:00+05:30");

export const BASE_USER_STREAM_OPENS_LABEL = "20 August at 6:00 AM";

/**
 * Base-user stream access schedule.
 * - `NEXT_PUBLIC_STREAM_OPEN_TO_BASE_USERS=true` → force open
 * - `NEXT_PUBLIC_STREAM_OPEN_TO_BASE_USERS=false` → force closed
 * - unset → open at/after 20 Aug 2026 06:00 IST
 */
export function isTemporaryBaseUserStreamAccessActive(now = new Date()): boolean {
  const override = readPublicEnv("NEXT_PUBLIC_STREAM_OPEN_TO_BASE_USERS");
  if (override === "true") return true;
  if (override === "false") return false;
  return now.getTime() >= BASE_USER_STREAM_OPENS_AT.getTime();
}

export function canBypassStreamParticipantChecks(role?: UserRole): boolean {
  if (!role) return false;
  if (isStaffRole(role)) return true;
  return isBaseUserRole(role) && isTemporaryBaseUserStreamAccessActive();
}

export interface WatchLiveAccess {
  phase: EventStreamPhase | null;
  canWatchLive: boolean;
  disabledTitle: string;
  /** Unauthenticated users may sign in when the stream is live. */
  showSignInToWatch: boolean;
}

type EventTiming = Pick<Event, "date" | "endDate" | "status">;

function parseEventTime(value: string): number | null {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/** Whether the event stream window is upcoming, live, or ended. */
export function getEventStreamPhase(event: EventTiming): EventStreamPhase {
  if (event.status === "cancelled" || event.status === "completed") {
    return "ended";
  }

  if (event.status === "live") {
    return "live";
  }

  const now = Date.now();
  const start = parseEventTime(event.date);
  const end = parseEventTime(event.endDate ?? event.date);

  if (start === null || end === null) {
    return "ended";
  }

  if (now < start) return "upcoming";
  if (now > end) return "ended";
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
  if (!event) {
    return {
      phase: null,
      canWatchLive: false,
      disabledTitle: "Live stream is not available right now",
      showSignInToWatch: false,
    };
  }

  const phase = getEventStreamPhase(event);
  const streamOpenToBaseUsers = isTemporaryBaseUserStreamAccessActive();

  if (isAuthenticated && role && isStaffRole(role)) {
    return {
      phase,
      canWatchLive: true,
      disabledTitle: "",
      showSignInToWatch: false,
    };
  }

  // Base users: locked until 20 Aug 6:00 AM IST (or env override).
  if (isAuthenticated && role && isBaseUserRole(role) && !streamOpenToBaseUsers) {
    return {
      phase,
      canWatchLive: false,
      disabledTitle: `Live stream opens on ${BASE_USER_STREAM_OPENS_LABEL}`,
      showSignInToWatch: false,
    };
  }

  if (isAuthenticated && role && isBaseUserRole(role) && streamOpenToBaseUsers) {
    return {
      phase,
      canWatchLive: true,
      disabledTitle: "",
      showSignInToWatch: false,
    };
  }

  if (!isAuthenticated && streamOpenToBaseUsers) {
    return {
      phase,
      canWatchLive: false,
      disabledTitle: "Sign in to watch the live stream",
      showSignInToWatch: true,
    };
  }

  if (phase === "ended") {
    return {
      phase,
      canWatchLive: false,
      disabledTitle: "This event has ended",
      showSignInToWatch: false,
    };
  }

  if (phase === "upcoming") {
    return {
      phase,
      canWatchLive: false,
      disabledTitle: upcomingTitle(event),
      showSignInToWatch: false,
    };
  }

  if (!isAuthenticated) {
    return {
      phase,
      canWatchLive: false,
      disabledTitle: "Sign in to watch the live stream",
      showSignInToWatch: true,
    };
  }

  if (!role || !isBaseUserRole(role)) {
    return {
      phase,
      canWatchLive: false,
      disabledTitle: "Live stream is only available to registered participants",
      showSignInToWatch: false,
    };
  }

  if (!isRegistered) {
    return {
      phase,
      canWatchLive: false,
      disabledTitle: "Register for the event to watch live",
      showSignInToWatch: false,
    };
  }

  return {
    phase,
    canWatchLive: true,
    disabledTitle: "",
    showSignInToWatch: false,
  };
}

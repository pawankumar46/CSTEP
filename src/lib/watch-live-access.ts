import { isBaseUserRole, isStaffRole } from "@/lib/auth-utils";
import { formatEventDateRange } from "@/lib/event-display";
import type { Event, UserRole } from "@/types";

export type EventStreamPhase = "upcoming" | "live" | "ended";

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

  // Moderators and event admins are not date-gated on Watch Live.
  if (isAuthenticated && role && isStaffRole(role)) {
    return {
      phase,
      canWatchLive: true,
      disabledTitle: "",
      showSignInToWatch: false,
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

  // Stream is in progress — base users only below this point.
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

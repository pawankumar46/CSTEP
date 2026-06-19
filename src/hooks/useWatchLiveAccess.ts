"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { getWatchLiveAccess, type WatchLiveAccess } from "@/lib/watch-live-access";
import type { Event } from "@/types";

export function useWatchLiveAccess(event?: Pick<Event, "date" | "endDate" | "status"> | null): WatchLiveAccess {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isRegistered, upcomingEvent } = useEventRegistration();

  const targetEvent = event ?? upcomingEvent;

  return useMemo(
    () =>
      getWatchLiveAccess({
        event: targetEvent,
        isAuthenticated,
        isRegistered,
        role: user?.role,
      }),
    [targetEvent, isAuthenticated, isRegistered, user?.role],
  );
}

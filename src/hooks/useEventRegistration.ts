"use client";

import { useEffect, useState } from "react";
import { getUpcomingEvents } from "@/services/event.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useRegistrationStore } from "@/store/useRegistrationStore";
import type { UpcomingEvent } from "@/types";

export function useEventRegistration() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isEventRegistered = useRegistrationStore((s) => s.isEventRegistered);
  const registeredEmail = useRegistrationStore((s) => s.registeredEmail);

  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setChecked(false);

    getUpcomingEvents()
      .then((events) => {
        if (!cancelled) setUpcomingEvents(events);
      })
      .catch(() => {
        if (!cancelled) setUpcomingEvents([]);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const localIsRegistered =
    isAuthenticated &&
    !!user &&
    isEventRegistered &&
    !!user.email &&
    registeredEmail?.toLowerCase() === user.email.toLowerCase();

  const isRegistered =
    isAuthenticated &&
    checked &&
    (upcomingEvents.length > 0
      ? upcomingEvents.some((event) => event.isRegistered)
      : localIsRegistered);

  return {
    isRegistered,
    checked,
    isAuthenticated,
    upcomingEvents,
    upcomingEvent: upcomingEvents[0] ?? null,
  };
}

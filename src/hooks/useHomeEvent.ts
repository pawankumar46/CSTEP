"use client";

import { useEffect, useState } from "react";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { getUserSummary } from "@/services/analytics.service";

export function useHomeEvent() {
  const {
    isAuthenticated,
    isRegistered,
    checked: upcomingLoaded,
    upcomingEvents,
    upcomingEvent,
  } = useEventRegistration();
  const [participantsRegistered, setParticipantsRegistered] = useState<number | null>(null);

  useEffect(() => {
    getUserSummary()
      .then((summary) => setParticipantsRegistered(summary.eventParticipants))
      .catch(() => setParticipantsRegistered(null));
  }, []);

  const isLoading = !upcomingLoaded;
  const hasEvent = upcomingLoaded && upcomingEvents.length > 0;

  return {
    isAuthenticated,
    isRegistered,
    isLoading,
    upcomingLoaded,
    hasEvent,
    upcomingEvents,
    upcomingEvent,
    participantsRegistered,
  };
}

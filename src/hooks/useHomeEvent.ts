"use client";

import { useEventRegistration } from "@/hooks/useEventRegistration";
import { useHomeDataStore } from "@/store/useHomeDataStore";

export function useHomeEvent() {
  const {
    isAuthenticated,
    isRegistered,
    checked: upcomingLoaded,
    upcomingEvents,
    upcomingEvent,
  } = useEventRegistration();

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
  };
}

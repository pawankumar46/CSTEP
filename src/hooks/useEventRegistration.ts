"use client";

import { useEffect } from "react";
import { useHomeDataStore } from "@/store/useHomeDataStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRegistrationStore } from "@/store/useRegistrationStore";

export function useEventRegistration() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isEventRegistered = useRegistrationStore((s) => s.isEventRegistered);
  const registeredEmail = useRegistrationStore((s) => s.registeredEmail);

  const authKey = `${isAuthenticated}:${user?.id ?? ""}`;
  const upcomingEvents = useHomeDataStore((s) => s.upcomingEvents);
  const checked = useHomeDataStore((s) => s.upcomingLoaded);
  const load = useHomeDataStore((s) => s.load);

  useEffect(() => {
    void load(authKey);
  }, [authKey, load]);

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

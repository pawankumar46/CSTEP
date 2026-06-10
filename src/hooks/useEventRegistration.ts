"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRegistrationStore } from "@/store/useRegistrationStore";

export function useEventRegistration() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isEventRegistered = useRegistrationStore((s) => s.isEventRegistered);
  const registeredEmail = useRegistrationStore((s) => s.registeredEmail);

  const isRegistered =
    isAuthenticated &&
    !!user &&
    isEventRegistered &&
    !!user.email &&
    registeredEmail?.toLowerCase() === user.email.toLowerCase();

  return { isRegistered, checked: true, isAuthenticated };
}

"use client";

import { useEffect } from "react";
import { AUTH_SESSION_REFRESHED_EVENT } from "@/lib/auth-session";
import { isStaffRole } from "@/lib/auth-utils";
import { useAuthStore } from "@/store/useAuthStore";
import {
  ACCESS_TOKEN_REFRESH_INTERVAL_MS,
  refreshStoredAccessToken,
} from "@/lib/auth-token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      await useAuthStore.persist.rehydrate();
      if (cancelled) return;

      useAuthStore.setState({ hasHydrated: true });
      await useAuthStore.getState().hydrate();
    };

    void initAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !refreshToken) return;

    const refreshSession = () => {
      void refreshStoredAccessToken();
    };

    const intervalId = window.setInterval(refreshSession, ACCESS_TOKEN_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, refreshToken]);

  useEffect(() => {
    const refetchAfterRefresh = () => {
      const authKey = user?.id ?? "guest";
      void import("@/store/useHomeDataStore").then(({ useHomeDataStore }) => {
        useHomeDataStore.getState().load(authKey, { force: true });
      });
      void import("@/store/useLobbyStore").then(({ useLobbyStore }) => {
        const { selectedEventId } = useLobbyStore.getState();
        if (!selectedEventId) return;

        const authUser = useAuthStore.getState().user;
        if (!authUser || !isStaffRole(authUser.role)) return;

        const path = window.location.pathname;
        if (!path.startsWith("/dashboard")) return;

        // Assistance services disabled
        // if (path.includes("/dashboard/travel")) {
        //   void useLobbyStore.getState().fetchTravelAssistance(selectedEventId);
        //   return;
        // }
        // if (path.includes("/dashboard/medical")) {
        //   void useLobbyStore.getState().fetchMedicalAssistance(selectedEventId);
        //   return;
        // }
        // if (path.includes("/dashboard/translation")) {
        //   void useLobbyStore.getState().fetchTranslationAssistance(selectedEventId);
        //   return;
        // }
        // if (path.includes("/dashboard/accommodation")) {
        //   void useLobbyStore.getState().fetchAccommodationAssistance(selectedEventId);
        //   return;
        // }
        if (path.includes("/dashboard/lobby")) {
          void useLobbyStore.getState().fetchRegistrations(selectedEventId);
        }
      });
    };

    window.addEventListener(AUTH_SESSION_REFRESHED_EVENT, refetchAfterRefresh);
    return () => window.removeEventListener(AUTH_SESSION_REFRESHED_EVENT, refetchAfterRefresh);
  }, [user?.id]);

  return <>{children}</>;
}

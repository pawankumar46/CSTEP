"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  ACCESS_TOKEN_REFRESH_INTERVAL_MS,
  refreshStoredAccessToken,
} from "@/lib/auth-token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const refreshToken = useAuthStore((s) => s.refreshToken);

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

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshSession();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isAuthenticated, refreshToken]);

  return <>{children}</>;
}

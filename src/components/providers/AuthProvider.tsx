"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

  return <>{children}</>;
}

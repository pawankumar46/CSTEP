"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { isBaseUserRole } from "@/lib/auth-utils";
import {
  canBypassStreamParticipantChecks,
  getEventStreamPhase,
  isTemporaryBaseUserStreamAccessActive,
} from "@/lib/watch-live-access";
import { ROUTES, buildAuthUrl } from "@/lib/routes";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";

export function StreamAccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasHydrated, user } = useAuthStore();
  const { isRegistered, checked, upcomingEvent } = useEventRegistration();

  const bypassStreamGates = user ? canBypassStreamParticipantChecks(user.role) : false;
  const baseUserStreamLocked =
    Boolean(user && isBaseUserRole(user.role) && !isTemporaryBaseUserStreamAccessActive());
  const needsRegistration = isAuthenticated && checked && !bypassStreamGates && !isRegistered;
  const streamPhase = upcomingEvent ? getEventStreamPhase(upcomingEvent) : null;
  const streamNotLive =
    !bypassStreamGates && !baseUserStreamLocked && checked && streamPhase !== "live";

  useEffect(() => {
    if (!hasHydrated || isLoading) return;
    if (isAuthenticated && !bypassStreamGates && !checked) return;

    if (!isAuthenticated) {
      router.replace(buildAuthUrl(ROUTES.login, { redirect: ROUTES.streaming }));
      return;
    }

    if (baseUserStreamLocked) {
      router.replace(ROUTES.home);
      return;
    }

    if (needsRegistration) {
      router.replace(ROUTES.eventRegister);
      return;
    }

    if (streamNotLive) {
      router.replace(ROUTES.home);
    }
  }, [
    hasHydrated,
    isLoading,
    isAuthenticated,
    bypassStreamGates,
    baseUserStreamLocked,
    checked,
    needsRegistration,
    streamNotLive,
    router,
  ]);

  const pendingRegistrationCheck = isAuthenticated && !bypassStreamGates && !checked;

  if (!hasHydrated || isLoading || pendingRegistrationCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isAuthenticated || baseUserStreamLocked || needsRegistration || streamNotLive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { isStaffRole } from "@/lib/auth-utils";
import { getEventStreamPhase } from "@/lib/watch-live-access";
import { ROUTES, buildAuthUrl } from "@/lib/routes";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";

export function StreamAccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasHydrated, user } = useAuthStore();
  const { isRegistered, checked, upcomingEvent } = useEventRegistration();

  const isStaff = user ? isStaffRole(user.role) : false;
  const needsRegistration = isAuthenticated && checked && !isStaff && !isRegistered;
  const streamPhase = upcomingEvent ? getEventStreamPhase(upcomingEvent) : null;
  const streamNotLive = !isStaff && checked && streamPhase !== "live";

  useEffect(() => {
    if (!hasHydrated || isLoading) return;
    if (isAuthenticated && !isStaff && !checked) return;

    if (!isAuthenticated) {
      router.replace(buildAuthUrl(ROUTES.login, { redirect: ROUTES.streaming }));
      return;
    }

    if (needsRegistration) {
      router.replace(ROUTES.eventRegister);
      return;
    }

    if (streamNotLive) {
      router.replace(ROUTES.home);
    }
  }, [hasHydrated, isLoading, isAuthenticated, isStaff, checked, needsRegistration, streamNotLive, router]);

  const pendingRegistrationCheck = isAuthenticated && !isStaff && !checked;

  if (!hasHydrated || isLoading || pendingRegistrationCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isAuthenticated || needsRegistration || streamNotLive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return <>{children}</>;
}

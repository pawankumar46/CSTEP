"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { isEventRegistrationClosed } from "@/lib/event-registration-window";
import { ROUTES, buildAuthUrl } from "@/lib/routes";

interface EventRegisterGuardProps {
  children: React.ReactNode;
}

export function EventRegisterGuard({ children }: EventRegisterGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, hasHydrated } = useAuthStore();
  const registrationClosed = isEventRegistrationClosed();

  useEffect(() => {
    if (!hasHydrated || isLoading) return;

    if (registrationClosed) {
      router.replace(ROUTES.home);
      return;
    }

    if (!isAuthenticated) {
      router.replace(buildAuthUrl(ROUTES.login, { redirect: ROUTES.eventRegister }));
    }
  }, [hasHydrated, isLoading, isAuthenticated, registrationClosed, router]);

  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (registrationClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return <>{children}</>;
}

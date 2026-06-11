"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { isStaffRole } from "@/lib/auth-utils";
import { ROUTES } from "@/lib/routes";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";

export function StreamAccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasHydrated, user } = useAuthStore();
  const { isRegistered, checked } = useEventRegistration();

  const isStaff = user ? isStaffRole(user.role) : false;
  const needsRegistration = isAuthenticated && checked && !isStaff && !isRegistered;

  useEffect(() => {
    if (!hasHydrated || isLoading) return;
    if (isAuthenticated && !isStaff && !checked) return;

    if (!isAuthenticated) {
      router.replace(`${ROUTES.login}?redirect=${ROUTES.streaming}`);
      return;
    }

    if (needsRegistration) {
      router.replace(ROUTES.eventRegister);
    }
  }, [hasHydrated, isLoading, isAuthenticated, isStaff, checked, needsRegistration, router]);

  const pendingRegistrationCheck = isAuthenticated && !isStaff && !checked;

  if (!hasHydrated || isLoading || pendingRegistrationCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isAuthenticated || needsRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return <>{children}</>;
}

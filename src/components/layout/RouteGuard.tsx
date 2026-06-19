"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { getDefaultRouteForRole } from "@/lib/auth-utils";
import { ROUTES, buildAuthUrl } from "@/lib/routes";
import type { UserRole } from "@/types";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  loginRedirect?: string;
}

export function RouteGuard({ children, allowedRoles, loginRedirect }: RouteGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, hasHydrated } = useAuthStore();

  const authReady = hasHydrated && !isLoading;
  const hasAccess =
    !allowedRoles || !user || allowedRoles.includes(user.role);

  useEffect(() => {
    if (!authReady) return;

    if (!isAuthenticated) {
      const redirectPath = loginRedirect ?? "/dashboard";
      router.replace(buildAuthUrl(ROUTES.login, { redirect: redirectPath }));
      return;
    }

    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getDefaultRouteForRole(user.role));
    }
  }, [authReady, isAuthenticated, user, allowedRoles, router, loginRedirect]);

  if (!authReady) {
    return (
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE_HIERARCHY } from "@/lib/constants";
import { getRoleFallbackRoute } from "@/lib/auth-utils";
import type { UserRole } from "@/types";

export function useRoleGuard(allowedRoles: UserRole[], redirectTo = "/login") {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace(redirectTo);
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace(getRoleFallbackRoute(user.role));
    }
  }, [user, isAuthenticated, allowedRoles, router, redirectTo]);

  const hasAccess =
    isAuthenticated &&
    user !== null &&
    allowedRoles.includes(user.role);

  return { user, hasAccess, isAuthenticated };
}

export function useMinRole(minRole: UserRole) {
  const { user, isAuthenticated } = useAuthStore();
  if (!user) return false;
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole];
}

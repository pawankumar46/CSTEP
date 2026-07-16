import type { UserRole } from "@/types";
import { ROUTES } from "@/lib/routes";

const STAFF_ROLES: UserRole[] = ["moderator", "event_administrator", "super_administrator"];

export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

export function isBaseUserRole(role: UserRole): boolean {
  return role === "base_user";
}

export function getDefaultRouteForRole(role: UserRole): string {
  return role === "base_user" ? "/" : "/dashboard";
}

export function getRoleFallbackRoute(role: UserRole): string {
  return role === "base_user" ? "/" : "/dashboard";
}

/** After login / signup OTP: staff → dashboard; base users → event-register if not registered. */
export async function resolvePostAuthDestination(
  userId: string,
  role: UserRole,
  redirectTo?: string | null,
): Promise<string> {
  const { sanitizeRedirect } = await import("@/lib/routes");
  const safeRedirect = sanitizeRedirect(redirectTo ?? null);
  if (safeRedirect) return safeRedirect;

  if (isStaffRole(role)) {
    return getDefaultRouteForRole(role);
  }

  try {
    const { useHomeDataStore } = await import("@/store/useHomeDataStore");
    const authKey = `true:${userId}`;
    await useHomeDataStore.getState().load(authKey, { force: true });
    const events = useHomeDataStore.getState().upcomingEvents;
    const isRegistered = events.some((event) => event.isRegistered);
    return isRegistered ? ROUTES.home : ROUTES.eventRegister;
  } catch {
    return ROUTES.home;
  }
}

export const DASHBOARD_ROLES: UserRole[] = STAFF_ROLES;

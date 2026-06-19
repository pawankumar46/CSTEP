import type { UserRole } from "@/types";

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

export const DASHBOARD_ROLES: UserRole[] = STAFF_ROLES;

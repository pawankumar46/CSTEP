import type { UserRole } from "@/types";

export const USER_ROLE_OPTIONS = [
  { value: "BASE_USER", label: "User" },
  { value: "MODERATOR", label: "Moderator" },
  { value: "EVENT_ADMIN", label: "Event Administrator" },
  { value: "SUPER_ADMIN", label: "Super Administrator" },
] as const;

export type ApiUserRole = (typeof USER_ROLE_OPTIONS)[number]["value"];

export const API_USER_ROLE_VALUES = USER_ROLE_OPTIONS.map((option) => option.value);

const API_TO_APP_ROLE: Record<string, UserRole> = {
  BASE_USER: "base_user",
  MODERATOR: "moderator",
  EVENT_ADMIN: "event_administrator",
  SUPER_ADMIN: "super_administrator",
  // Legacy / alternate values
  EVENT_ADMINISTRATOR: "event_administrator",
  SUPER_ADMINISTRATOR: "super_administrator",
  base_user: "base_user",
  moderator: "moderator",
  event_administrator: "event_administrator",
  super_administrator: "super_administrator",
};

export function mapApiRoleToAppRole(apiRole: string): UserRole {
  return API_TO_APP_ROLE[apiRole] ?? "base_user";
}

export function getApiRoleLabel(apiRole: string): string {
  return USER_ROLE_OPTIONS.find((option) => option.value === apiRole)?.label ?? apiRole;
}

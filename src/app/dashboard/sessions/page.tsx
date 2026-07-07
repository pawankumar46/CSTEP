"use client";

import { ManageSessions } from "@/components/dashboard/ManageSessions";
import { RouteGuard } from "@/components/layout/RouteGuard";
import type { UserRole } from "@/types";

const LOBBY_MANAGER_ROLES: UserRole[] = ["moderator", "event_administrator", "super_administrator"];

export default function SessionsPage() {
  return (
    <RouteGuard allowedRoles={LOBBY_MANAGER_ROLES}>
      <ManageSessions />
    </RouteGuard>
  );
}

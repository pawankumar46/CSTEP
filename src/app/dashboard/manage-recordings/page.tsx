"use client";

import { ManageRecordings } from "@/components/dashboard/ManageRecordings";
import { RouteGuard } from "@/components/layout/RouteGuard";
import type { UserRole } from "@/types";

const RECORDING_MANAGER_ROLES: UserRole[] = [
  "moderator",
  "event_administrator",
  "super_administrator",
];

export default function ManageRecordingsPage() {
  return (
    <RouteGuard allowedRoles={RECORDING_MANAGER_ROLES}>
      <ManageRecordings />
    </RouteGuard>
  );
}

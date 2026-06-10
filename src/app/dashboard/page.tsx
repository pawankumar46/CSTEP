"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { BaseUserDashboard } from "@/features/dashboard/BaseUserDashboard";
import { ModeratorDashboard } from "@/features/dashboard/ModeratorDashboard";
import { EventAdminDashboard } from "@/features/dashboard/EventAdminDashboard";
import { SuperAdminDashboard } from "@/features/dashboard/SuperAdminDashboard";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  switch (user.role) {
    case "super_administrator":
      return <SuperAdminDashboard />;
    case "event_administrator":
      return <EventAdminDashboard />;
    case "moderator":
      return <ModeratorDashboard />;
    default:
      return <BaseUserDashboard />;
  }
}

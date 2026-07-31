"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { DASHBOARD_ROLES } from "@/lib/auth-utils";
import { useLocationPermissionPromptOnMount } from "@/lib/location-permission";

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  useLocationPermissionPromptOnMount();

  return (
    <RouteGuard allowedRoles={DASHBOARD_ROLES}>
      <DashboardLayout>{children}</DashboardLayout>
    </RouteGuard>
  );
}

"use client";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { AnalyticsUnderDevelopment } from "@/components/dashboard/AnalyticsUnderDevelopment";

export default function AttendanceModeAnalyticsPage() {
  return (
    <RouteGuard allowedRoles={["moderator", "event_administrator", "super_administrator"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Attendance Mode Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Select an event, attendance mode, and optional participation date to view virtual or physical insights.
          </p>
        </div>

        <AnalyticsUnderDevelopment />
      </div>
    </RouteGuard>
  );
}

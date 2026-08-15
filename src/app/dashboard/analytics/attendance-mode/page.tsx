"use client";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { AttendanceModeAnalytics } from "@/components/dashboard/AttendanceModeAnalytics";

export default function AttendanceModeAnalyticsPage() {
  return (
    <RouteGuard allowedRoles={["moderator", "event_administrator", "super_administrator"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Attendance Mode Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Select an event and filters. Click Physical/Virtual (gray → green) to mark present;
            select rows and Mark Absent for no-shows.
          </p>
        </div>

        <AttendanceModeAnalytics />
      </div>
    </RouteGuard>
  );
}

"use client";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { EventAnalyticsOverview } from "@/components/dashboard/EventAnalyticsOverview";

export default function AnalyticsPage() {
  return (
    <RouteGuard allowedRoles={["moderator", "event_administrator", "super_administrator"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics Overview</h1>
          <p className="text-sm text-muted-foreground">
            Event-level registration, assistance, and streaming metrics.
          </p>
        </div>

        <EventAnalyticsOverview />
      </div>
    </RouteGuard>
  );
}

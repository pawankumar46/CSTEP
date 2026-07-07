"use client";

import { useEffect } from "react";
import { Users, UserCheck, UserX, UserPlus, Pause, Clock } from "lucide-react";
import { DashboardEventSections } from "@/components/dashboard/DashboardEventSections";
import { StatCard } from "@/components/shared/StatCard";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";

export function ModeratorDashboard() {
  const { analytics, isLoading, fetchAnalytics } = useAnalyticsStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading || !analytics) return <DashboardSkeleton />;

  const { summary } = analytics;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Moderator Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of registrations and participant management</p>
      </div>

      <div className="grid auto-rows-fr gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Registered Users" value={summary.totalUsers} icon={Users} />
        <StatCard title="Event Participants" value={summary.eventParticipants} icon={UserPlus} />
        <StatCard title="Accepted" value={summary.accepted} icon={UserCheck} />
        <StatCard title="Pending" value={summary.pending} icon={Clock} />
        <StatCard title="On Hold" value={summary.onHold} icon={Pause} />
        <StatCard title="Rejected" value={summary.rejected} icon={UserX} />
      </div>

      <DashboardEventSections />
    </div>
  );
}

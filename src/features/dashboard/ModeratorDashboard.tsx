"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, UserX, UserPlus, Pause, Clock } from "lucide-react";
import { DashboardEventSections } from "@/components/dashboard/DashboardEventSections";
import { StatCard } from "@/components/shared/StatCard";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { getUpcomingEvents } from "@/services/event.service";
import type { AnalyticsSummary } from "@/types";

const EMPTY_SUMMARY: AnalyticsSummary = {
  totalUsers: 0,
  eventParticipants: 0,
  accepted: 0,
  rejected: 0,
  onHold: 0,
  pending: 0,
};

export function ModeratorDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const events = await getUpcomingEvents();
        if (cancelled) return;

        const aggregated = events.reduce<AnalyticsSummary>((acc, event) => {
          const s = event.summary;
          if (!s) return acc;
          acc.totalUsers += s.totalRegisteredUsers;
          acc.eventParticipants += s.participantsAttended;
          acc.accepted += s.participantsAccepted;
          acc.rejected += s.participantsRejected;
          acc.onHold += s.participantsHeld;
          acc.pending += s.participantsPending;
          return acc;
        }, { ...EMPTY_SUMMARY });

        setSummary(aggregated);
      } catch {
        if (!cancelled) setSummary({ ...EMPTY_SUMMARY });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!summary) return <DashboardSkeleton />;

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
        <StatCard title="Hold" value={summary.onHold} icon={Pause} />
        <StatCard title="Rejected" value={summary.rejected} icon={UserX} />
      </div>

      <DashboardEventSections />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { Calendar, Users, Radio, Plus } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { EventCard } from "@/components/dashboard/EventCard";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import { useEventStore } from "@/store/useEventStore";
import Link from "next/link";

export function EventAdminDashboard() {
  const { analytics, isLoading, fetchAnalytics } = useAnalyticsStore();
  const { events, fetchEvents, deleteEvent } = useEventStore();

  useEffect(() => {
    fetchAnalytics();
    fetchEvents();
  }, [fetchAnalytics, fetchEvents]);

  if (isLoading || !analytics) return <DashboardSkeleton />;

  const liveEvents = events.filter((e) => e.status === "live").length;
  const publishedEvents = events.filter((e) => e.status === "published").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Administrator Dashboard</h1>
          <p className="text-muted-foreground">Manage events and monitor performance</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events"><Plus className="h-4 w-4 mr-2" /> Create Event</Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Events" value={events.length} icon={Calendar} />
        <StatCard title="Published" value={publishedEvents} icon={Radio} />
        <StatCard title="Live Now" value={liveEvents} icon={Radio} />
        <StatCard title="Total Registrations" value={analytics.summary.eventParticipants} icon={Users} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Events</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.slice(0, 6).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => {}}
              onDelete={(id) => deleteEvent(id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

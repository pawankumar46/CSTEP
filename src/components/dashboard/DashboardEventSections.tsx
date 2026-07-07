"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Radio } from "lucide-react";
import { EventCard } from "@/components/dashboard/EventCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getEvents } from "@/services/event.service";
import type { Event, EventListType } from "@/types";

const SECTION_CONFIG: {
  type: EventListType;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: typeof Calendar;
}[] = [
  {
    type: "upcoming",
    title: "Upcoming Events",
    emptyTitle: "No upcoming events",
    emptyDescription: "Scheduled events will appear here.",
    icon: Calendar,
  },
  {
    type: "live",
    title: "Current Events",
    emptyTitle: "No current events",
    emptyDescription: "Events that are live right now will appear here.",
    icon: Radio,
  },
  {
    type: "past",
    title: "Past Events",
    emptyTitle: "No past events",
    emptyDescription: "Completed events will appear here.",
    icon: Calendar,
  },
];

export function DashboardEventSections() {
  const [eventsByType, setEventsByType] = useState<Record<EventListType, Event[]>>({
    upcoming: [],
    live: [],
    past: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [upcoming, live, past] = await Promise.all([
          getEvents("upcoming"),
          getEvents("live"),
          getEvents("past"),
        ]);
        if (!cancelled) {
          setEventsByType({ upcoming, live, past });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load events");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {SECTION_CONFIG.map(({ type, title, emptyTitle, emptyDescription, icon }) => {
        const events = eventsByType[type];

        return (
          <section key={type}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {title}
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/events">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {events.length === 0 ? (
              <Card>
                <CardContent className="p-0">
                  <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {events.slice(0, 3).map((event) => (
                  <EventCard key={event.id} event={event} listType={type} showActions={false} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

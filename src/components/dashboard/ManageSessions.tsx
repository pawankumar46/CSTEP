"use client";

import { useEffect, useState } from "react";
import { EventSelectCard } from "@/components/dashboard/EventSelectCard";
import { SessionScheduler } from "@/components/dashboard/session-scheduler/SessionScheduler";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useEventStore } from "@/store/useEventStore";
import { useLobbyStore } from "@/store/useLobbyStore";
import { getEventDays } from "@/services/event.service";
import { formatSchedulerDayDate, type EventScheduleDay } from "@/lib/session-scheduler";

export function ManageSessions() {
  const { events, isLoading: eventsLoading, fetchEvents } = useEventStore();
  const { selectedEventId, setSelectedEventId } = useLobbyStore();
  const [scheduleDays, setScheduleDays] = useState<EventScheduleDay[] | null>(null);
  const [scheduleDaysError, setScheduleDaysError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents("upcoming");
  }, [fetchEvents]);

  const selectedEvent = events.find((event) => event.id === selectedEventId);

  useEffect(() => {
    let cancelled = false;

    const loadDays = async () => {
      if (!selectedEventId) {
        setScheduleDays(null);
        setScheduleDaysError(null);
        return;
      }

      try {
        setScheduleDaysError(null);
        const dayRows = await getEventDays(selectedEventId);
        if (cancelled) return;

        const mapped = dayRows
          .filter((day) => day.date)
          .sort((a, b) => a.dayNumber - b.dayNumber)
          .map((day) => {
            const dateLabel = formatSchedulerDayDate(day.date);
            return {
              value: day.date,
              label: dateLabel,
              shortLabel: dateLabel,
              dayId: day.id,
            };
          });

        setScheduleDays(mapped);
      } catch (error) {
        if (cancelled) return;
        setScheduleDays(null);
        setScheduleDaysError(
          error instanceof Error ? error.message : "Failed to load schedule days",
        );
      }
    };

    void loadDays();
    return () => {
      cancelled = true;
    };
  }, [selectedEventId]);

  if (eventsLoading && events.length === 0) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Sessions</h1>
        <p className="text-muted-foreground">
          Schedule and reschedule meeting sessions and breaks for up to 3 event days.
        </p>
      </div>

      <EventSelectCard
        events={events}
        eventsLoading={eventsLoading}
        selectedEventId={selectedEventId}
        onEventChange={setSelectedEventId}
      />

      {!selectedEventId ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Select an event to manage its sessions.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {scheduleDaysError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {scheduleDaysError}
            </div>
          )}
          <SessionScheduler
            key={`${selectedEventId}-${scheduleDays?.[0]?.value ?? selectedEvent?.date ?? "no-day"}`}
            eventId={selectedEventId}
            eventName={selectedEvent?.name}
            eventDate={selectedEvent?.date}
            eventEndDate={selectedEvent?.endDate}
            scheduleDaysOverride={scheduleDays ?? undefined}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, UserCheck, UserX, UserPlus, Pause, Clock, Eye, Radio,
  Plane, Stethoscope, Languages, Hotel, Users,
} from "lucide-react";
import { AnalyticsDistributionTable, AnalyticsMetricTable } from "@/components/dashboard/AnalyticsDistributionTable";
import { DashboardTrendCharts } from "@/components/dashboard/DashboardTrendCharts";
import { EventSelectCard } from "@/components/dashboard/EventSelectCard";
import { StatCard } from "@/components/shared/StatCard";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildAttendanceModeDistribution,
  buildFoodPreferenceDistribution,
  buildLanguageDistribution,
  buildParticipationDateTrend,
  buildParticipationTimeDistribution,
  buildRegistrationStatusDistribution,
  buildTransportModeDistribution,
  formatWatchDuration,
} from "@/lib/analytics-mappers";
import { slugifyFilename } from "@/lib/export-utils";
import { getAllEvents } from "@/services/event.service";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import type { Event } from "@/types";

export function EventAnalyticsOverview() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const {
    eventAnalytics,
    eventAnalyticsLoading,
    eventAnalyticsError,
    fetchEventAnalytics,
    clearEventAnalytics,
  } = useAnalyticsStore();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const list = await getAllEvents();
        if (!cancelled) setEvents(list);
      } catch (err) {
        if (!cancelled) {
          setEventsError(err instanceof Error ? err.message : "Failed to load events");
        }
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      clearEventAnalytics();
      return;
    }
    fetchEventAnalytics(selectedEventId);
  }, [selectedEventId, fetchEventAnalytics, clearEventAnalytics]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const tableData = useMemo(() => {
    if (!eventAnalytics) return null;

    const { registrations, participationDates, assistanceRequests } = eventAnalytics;

    return {
      status: buildRegistrationStatusDistribution(registrations.byStatus),
      attendanceMode: buildAttendanceModeDistribution(registrations.byAttendanceMode),
      food: buildFoodPreferenceDistribution(registrations.byFoodPreference),
      participationTime: buildParticipationTimeDistribution(registrations.byParticipationTime),
      participationDates: buildParticipationDateTrend(participationDates),
      transport: buildTransportModeDistribution(assistanceRequests.travel.byTransportMode ?? {}),
      languages: buildLanguageDistribution(assistanceRequests.translation.byLanguage ?? {}),
    };
  }, [eventAnalytics]);

  const streamingMetrics = useMemo(() => {
    if (!eventAnalytics) return [];

    const { streaming } = eventAnalytics;
    return [
      { metric: "Currently Watching", value: streaming.currentlyWatching },
      { metric: "Unique Viewers", value: streaming.uniqueViewers },
      { metric: "Broadcast Sessions", value: streaming.broadcastSessions },
      { metric: "Peak Concurrent Viewers", value: streaming.peakConcurrentViewers },
      { metric: "Avg Watch Time", value: formatWatchDuration(streaming.avgWatchDurationSeconds) },
      { metric: "Total Watch Time", value: formatWatchDuration(streaming.totalWatchTimeSeconds) },
      {
        metric: "Live Broadcast",
        value: streaming.primaryBroadcastActive ? "Active" : "Inactive",
      },
    ];
  }, [eventAnalytics]);

  const exportSlugPrefix = useMemo(
    () => slugifyFilename(eventAnalytics?.event.title ?? "event-analytics"),
    [eventAnalytics?.event.title],
  );

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  return (
    <div className="space-y-5">
      {eventsError && <p className="text-sm text-destructive">{eventsError}</p>}

      <EventSelectCard
        events={events}
        eventsLoading={eventsLoading}
        selectedEventId={selectedEventId}
        onEventChange={handleEventChange}
      />

      {!selectedEventId && !eventsLoading && events.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={BarChart3}
              title="Select an event"
              description="Choose an event above to view trends, registration, assistance, and streaming analytics."
            />
          </CardContent>
        </Card>
      )}

      {selectedEventId && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Trends
          </h3>
          <DashboardTrendCharts />
        </div>
      )}

      {selectedEventId && eventAnalyticsLoading && <DashboardSkeleton />}

      {eventAnalyticsError && (
        <p className="text-sm text-destructive">{eventAnalyticsError}</p>
      )}

      {eventAnalytics && tableData && !eventAnalyticsLoading && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{eventAnalytics.event.title}</h2>
            <Badge variant="outline" className="capitalize">
              {eventAnalytics.event.status.toLowerCase()}
            </Badge>
            {selectedEvent && selectedEvent.name !== eventAnalytics.event.title && (
              <Badge variant="secondary">{selectedEvent.name}</Badge>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Registrations
            </h3>
            <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard title="Total" value={eventAnalytics.registrations.total} icon={UserPlus} />
              <StatCard
                title="Accepted"
                value={eventAnalytics.registrations.byStatus.ACCEPTED ?? 0}
                icon={UserCheck}
              />
              <StatCard
                title="Pending"
                value={eventAnalytics.registrations.byStatus.PENDING ?? 0}
                icon={Clock}
              />
              <StatCard
                title="On Hold"
                value={eventAnalytics.registrations.byStatus.HELD ?? 0}
                icon={Pause}
              />
              <StatCard
                title="Rejected"
                value={eventAnalytics.registrations.byStatus.REJECTED ?? 0}
                icon={UserX}
              />
              <StatCard
                title="Undecided Mode"
                value={eventAnalytics.registrations.byAttendanceMode.UNDECIDED ?? 0}
                icon={Users}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Streaming
            </h3>
            <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Currently Watching"
                value={eventAnalytics.streaming.currentlyWatching}
                icon={Eye}
              />
              <StatCard
                title="Unique Viewers"
                value={eventAnalytics.streaming.uniqueViewers}
                icon={Users}
              />
              <StatCard
                title="Broadcast Sessions"
                value={eventAnalytics.streaming.broadcastSessions}
                icon={Radio}
              />
              <StatCard
                title="Peak Concurrent"
                value={eventAnalytics.streaming.peakConcurrentViewers}
                icon={BarChart3}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Registration Insights
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnalyticsDistributionTable
                title="Registration Status"
                data={tableData.status}
                exportSlug={`${exportSlugPrefix}-registration-status`}
                categoryHeader="Status"
                emptyMessage="No registration data."
              />
              <AnalyticsDistributionTable
                title="Attendance Mode"
                data={tableData.attendanceMode}
                exportSlug={`${exportSlugPrefix}-attendance-mode`}
                categoryHeader="Mode"
                emptyMessage="No attendance mode data."
              />
              <AnalyticsDistributionTable
                title="Participation Time"
                data={tableData.participationTime}
                exportSlug={`${exportSlugPrefix}-participation-time`}
                categoryHeader="Time slot"
                emptyMessage="No participation time data."
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AnalyticsDistributionTable
              title="Food Preferences"
              data={tableData.food}
              exportSlug={`${exportSlugPrefix}-food-preferences`}
              categoryHeader="Food preference"
              emptyMessage="No food preference data."
            />
            <AnalyticsDistributionTable
              title="Participation Dates"
              data={tableData.participationDates}
              exportSlug={`${exportSlugPrefix}-participation-dates`}
              categoryHeader="Date"
              emptyMessage="No participation date data."
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Assistance Requests
            </h3>
            <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Travel"
                value={eventAnalytics.assistanceRequests.travel.total}
                icon={Plane}
              />
              <StatCard
                title="Medical"
                value={eventAnalytics.assistanceRequests.medical.total}
                icon={Stethoscope}
              />
              <StatCard
                title="Translation"
                value={eventAnalytics.assistanceRequests.translation.total}
                icon={Languages}
              />
              <StatCard
                title="Accommodation"
                value={eventAnalytics.assistanceRequests.accommodation.total}
                icon={Hotel}
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <AnalyticsDistributionTable
                title="Travel by Transport Mode"
                data={tableData.transport}
                exportSlug={`${exportSlugPrefix}-travel-transport`}
                categoryHeader="Transport mode"
                emptyMessage="No travel transport data."
              />
              <AnalyticsDistributionTable
                title="Translation by Language"
                data={tableData.languages}
                exportSlug={`${exportSlugPrefix}-translation-language`}
                categoryHeader="Language"
                emptyMessage="No translation language data."
              />
            </div>
          </div>

          <AnalyticsMetricTable
            title="Streaming Details"
            rows={streamingMetrics}
            exportSlug={`${exportSlugPrefix}-streaming-details`}
            emptyMessage="No streaming data."
          />
        </>
      )}
    </div>
  );
}

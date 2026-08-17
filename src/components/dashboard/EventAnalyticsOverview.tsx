"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  Pause,
  Radio,
  TrendingUp,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { AnalyticsMetricTable } from "@/components/dashboard/AnalyticsDistributionTable";
import { AnalyticsCollapsibleSection } from "@/components/dashboard/AnalyticsCollapsibleSection";
import { EventFeedbackCharts } from "@/components/dashboard/EventFeedbackCharts";
import { LiveLoginInsightsCharts } from "@/components/dashboard/LiveLoginInsightsCharts";
import { ParticipationTimeTable } from "@/components/dashboard/ParticipationTimeTable";
import { SessionParticipationAnalytics } from "@/components/dashboard/SessionParticipationAnalytics";
import { RegistrationInsightsCharts } from "@/components/dashboard/RegistrationInsightsCharts";
import { StatCard } from "@/components/shared/StatCard";
import { isIcasEventName } from "@/lib/icas-conference";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  mapApiRegistrationInsights,
  type RegistrationTrendGranularity,
} from "@/lib/analytics-mappers";
import { slugifyFilename } from "@/lib/export-utils";
import { useLiveAnalyticsSocket } from "@/hooks/useLiveAnalyticsSocket";
import { getAllEvents } from "@/services/event.service";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import { useLiveAnalyticsStore } from "@/store/useLiveAnalyticsStore";
import type { Event } from "@/types";

/** Prefer known ICAS event, else highest registration count. */
function pickAnalyticsEvent(events: Event[]): Event | null {
  if (events.length === 0) return null;
  const preferred = events.find((event) => event.id === "11");
  if (preferred) return preferred;
  return [...events].sort(
    (a, b) => (b.registeredCount ?? 0) - (a.registeredCount ?? 0),
  )[0] ?? events[0];
}

export function EventAnalyticsOverview() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [trendGranularity, setTrendGranularity] = useState<RegistrationTrendGranularity>("daily");
  const [attendanceDateFilter, setAttendanceDateFilter] = useState<string>("all");

  const {
    analytics,
    isLoading,
    error,
    fetchAnalytics,
    eventAnalytics,
    eventAnalyticsError,
    fetchEventAnalytics,
    clearEventAnalytics,
    registrationCounts,
    registrationCountsLoading,
    registrationCountsError,
    fetchRegistrationCounts,
    clearRegistrationCounts,
    registrationTrend,
    registrationTrendLoading,
    registrationTrendError,
    fetchRegistrationTrend,
    clearRegistrationTrend,
    registrationAttendanceInsights,
    registrationAttendanceLoading,
    registrationAttendanceError,
    fetchRegistrationAttendanceInsights,
    clearRegistrationAttendanceInsights,
    registrationDemographics,
    registrationDemographicsLoading,
    registrationDemographicsError,
    fetchRegistrationDemographics,
    clearRegistrationDemographics,
    eventFeedbackAnalytics,
    eventFeedbackAnalyticsLoading,
    eventFeedbackAnalyticsError,
    fetchEventFeedbackAnalytics,
    clearEventFeedbackAnalytics,
    streamingSummary,
    streamingSummaryLoading,
    streamingSummaryError,
    fetchStreamingSummary,
    clearStreamingSummary,
  } = useAnalyticsStore();

  useLiveAnalyticsSocket(selectedEventId);
  const liveSnapshot = useLiveAnalyticsStore((s) => s.snapshot);
  const liveStreamingPartial = liveSnapshot?.streamingSummary ?? null;
  const liveFeedback = liveSnapshot?.feedback ?? null;

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const events = await getAllEvents();
        if (cancelled) return;
        const next = pickAnalyticsEvent(events);
        if (!next) return;
        setSelectedEvent(next);
        setSelectedEventId(next.id);
      } catch {
        // Fall back to mock dashboard top event below.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedEventId || !analytics) return;

    const defaultEventId =
      analytics.dashboard.topEventsByRegistrations.find((event) => event.id === "11")?.id
      ?? analytics.dashboard.topEventsByRegistrations[0]?.id
      ?? null;
    if (defaultEventId) {
      setSelectedEventId(defaultEventId);
    }
  }, [analytics, selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) {
      clearEventAnalytics();
      clearRegistrationCounts();
      clearRegistrationTrend();
      clearRegistrationAttendanceInsights();
      clearRegistrationDemographics();
      clearEventFeedbackAnalytics();
      clearStreamingSummary();
      return;
    }
    fetchEventAnalytics(selectedEventId);
    fetchRegistrationCounts(selectedEventId);
    fetchRegistrationAttendanceInsights(selectedEventId);
    fetchRegistrationDemographics(selectedEventId);
    fetchEventFeedbackAnalytics(selectedEventId);
    fetchStreamingSummary(selectedEventId);
  }, [
    selectedEventId,
    fetchEventAnalytics,
    clearEventAnalytics,
    fetchRegistrationCounts,
    clearRegistrationCounts,
    clearRegistrationTrend,
    fetchRegistrationAttendanceInsights,
    clearRegistrationAttendanceInsights,
    fetchRegistrationDemographics,
    clearRegistrationDemographics,
    fetchEventFeedbackAnalytics,
    clearEventFeedbackAnalytics,
    fetchStreamingSummary,
    clearStreamingSummary,
  ]);

  useEffect(() => {
    if (!selectedEventId) return;

    const intervalId = window.setInterval(() => {
      void fetchStreamingSummary(selectedEventId);
    }, 15_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedEventId, fetchStreamingSummary]);

  useEffect(() => {
    setAttendanceDateFilter("all");
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) return;
    fetchRegistrationTrend(selectedEventId, trendGranularity);
  }, [selectedEventId, trendGranularity, fetchRegistrationTrend]);

  const liveStreamingSummary = useMemo(() => {
    if (!streamingSummary && !liveStreamingPartial) return null;
    if (!streamingSummary) {
      return {
        currentlyWatching: liveStreamingPartial?.currentlyWatching ?? 0,
        uniqueViewers: liveStreamingPartial?.uniqueViewers ?? 0,
        broadcastSessions: liveStreamingPartial?.broadcastSessions ?? 0,
        peakConcurrentViewers: liveStreamingPartial?.peakConcurrentViewers ?? 0,
        avgWatchTimeSeconds: liveStreamingPartial?.avgWatchTimeSeconds ?? 0,
        avgWatchTimeDisplay: liveStreamingPartial?.avgWatchTimeDisplay ?? "—",
        totalWatchTimeSeconds: liveStreamingPartial?.totalWatchTimeSeconds ?? 0,
        totalWatchTimeDisplay: liveStreamingPartial?.totalWatchTimeDisplay ?? "—",
        liveBroadcast: liveStreamingPartial?.liveBroadcast ?? false,
      };
    }
    if (!liveStreamingPartial) return streamingSummary;
    return {
      ...streamingSummary,
      ...liveStreamingPartial,
    };
  }, [streamingSummary, liveStreamingPartial]);

  const streamingMetrics = useMemo(() => {
    if (!liveStreamingSummary) return [];

    return [
      { metric: "Currently Watching", value: liveStreamingSummary.currentlyWatching },
      { metric: "Unique Viewers", value: liveStreamingSummary.uniqueViewers },
      { metric: "Broadcast Sessions", value: liveStreamingSummary.broadcastSessions },
      { metric: "Peak Concurrent Viewers", value: liveStreamingSummary.peakConcurrentViewers },
      { metric: "Avg Watch Time", value: liveStreamingSummary.avgWatchTimeDisplay },
      { metric: "Total Watch Time", value: liveStreamingSummary.totalWatchTimeDisplay },
      {
        metric: "Live Broadcast",
        value: liveStreamingSummary.liveBroadcast ? "Active" : "Inactive",
      },
    ];
  }, [liveStreamingSummary]);

  const exportSlugPrefix = useMemo(
    () => slugifyFilename(selectedEvent?.name ?? eventAnalytics?.event.title ?? "event-analytics"),
    [selectedEvent?.name, eventAnalytics?.event.title],
  );

  const participationTimeSessions = useMemo(() => {
    // After a live WS update, trust participation_duration even when [] (no dummy rows).
    if (liveSnapshot?.raw != null) {
      return liveSnapshot.participationDurationSessions ?? [];
    }
    if (!eventAnalytics) return [];
    return eventAnalytics.participationTimeSessions ?? [];
  }, [liveSnapshot?.raw, liveSnapshot?.participationDurationSessions, eventAnalytics]);

  const showParticipationDuration =
    Boolean(eventAnalytics)
    || liveSnapshot?.raw != null;

  const registrationInsights = useMemo(() => {
    if (!eventAnalytics) return mapApiRegistrationInsights({});
    return eventAnalytics.registrationInsights;
  }, [eventAnalytics]);

  const selectedTopEvent =
    analytics?.dashboard.topEventsByRegistrations.find((event) => event.id === selectedEventId)
    ?? analytics?.dashboard.topEventsByRegistrations[0]
    ?? null;
  const eventTitle = selectedEvent?.name ?? selectedTopEvent?.title ?? eventAnalytics?.event.title;
  const eventStatus = selectedEvent?.status ?? selectedTopEvent?.status ?? eventAnalytics?.event.status;
  const showLiveRegistrationData =
    Boolean(selectedEventId)
    && (
      Boolean(registrationCounts)
      || Boolean(registrationCountsError)
      || Boolean(registrationTrend)
      || Boolean(registrationAttendanceInsights)
      || Boolean(registrationDemographics)
      || registrationCountsLoading
      || registrationTrendLoading
      || registrationAttendanceLoading
      || registrationDemographicsLoading
    );
  const initialEventLoading =
    Boolean(selectedEventId)
    && registrationCountsLoading
    && !registrationCounts
    && !registrationCountsError;

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading && !analytics && !selectedEventId && <DashboardSkeleton />}

      {!isLoading && !analytics && !selectedEventId && (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={BarChart3}
              title="Analytics unavailable"
              description="Dashboard analytics could not be loaded."
            />
          </CardContent>
        </Card>
      )}

      {(eventTitle || selectedTopEvent || selectedEventId) && (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{eventTitle ?? `Event ${selectedEventId}`}</h2>
            {eventStatus && (
              <Badge variant="outline" className="capitalize">
                {String(eventStatus).toLowerCase()}
              </Badge>
            )}
            {selectedEvent?.registeredCount != null && selectedEvent.registeredCount > 0 && (
              <Badge variant="secondary">{selectedEvent.registeredCount} registrations</Badge>
            )}
          </div>
          {eventTitle && isIcasEventName(eventTitle) && (
            <p className="text-sm text-muted-foreground">India Clean Air Summit</p>
          )}
        </div>
      )}

      {initialEventLoading && <DashboardSkeleton />}

      {eventAnalyticsError && (
        <p className="text-sm text-destructive">{eventAnalyticsError}</p>
      )}
      {registrationCountsError && (
        <p className="text-sm text-destructive">{registrationCountsError}</p>
      )}
      {registrationTrendError && (
        <p className="text-sm text-destructive">{registrationTrendError}</p>
      )}
      {registrationAttendanceError && (
        <p className="text-sm text-destructive">{registrationAttendanceError}</p>
      )}
      {registrationDemographicsError && (
        <p className="text-sm text-destructive">{registrationDemographicsError}</p>
      )}
      {eventFeedbackAnalyticsError && (
        <p className="text-sm text-destructive">{eventFeedbackAnalyticsError}</p>
      )}
      {streamingSummaryError && (
        <p className="text-sm text-destructive">{streamingSummaryError}</p>
      )}

      {showLiveRegistrationData && !initialEventLoading && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Registrations
            </h3>
            <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <StatCard
                title="Total registered for event"
                value={registrationCounts?.total ?? 0}
                icon={UserPlus}
              />
              <StatCard
                title="Accepted"
                value={registrationCounts?.accepted ?? 0}
                icon={CheckCircle2}
              />
              <StatCard
                title="Pending"
                value={registrationCounts?.pending ?? 0}
                icon={Clock}
              />
              <StatCard
                title="Hold"
                value={registrationCounts?.onHold ?? 0}
                icon={Pause}
              />
              <StatCard
                title="Rejected"
                value={registrationCounts?.rejected ?? 0}
                icon={UserX}
              />
            </div>
          </div>

          <AnalyticsCollapsibleSection title="Registration Insights">
            <RegistrationInsightsCharts
              insights={registrationInsights}
              registrationTrendDays={registrationTrend ? registrationTrend.results : null}
              registrationTrendLoading={registrationTrendLoading}
              registrationTrendError={registrationTrendError}
              trendGranularity={trendGranularity}
              onTrendGranularityChange={setTrendGranularity}
              attendanceInsights={registrationAttendanceInsights}
              attendanceInsightsLoading={registrationAttendanceLoading}
              attendanceInsightsError={registrationAttendanceError}
              attendanceDateFilter={attendanceDateFilter}
              onAttendanceDateFilterChange={setAttendanceDateFilter}
              demographics={registrationDemographics}
              demographicsLoading={registrationDemographicsLoading}
              demographicsError={registrationDemographicsError}
            />
          </AnalyticsCollapsibleSection>
        </div>
      )}

      {(streamingSummary
        || eventAnalytics
        || eventFeedbackAnalytics
        || streamingSummaryLoading
        || eventFeedbackAnalyticsLoading
        || Boolean(selectedEventId)) && !initialEventLoading && (
        <AnalyticsCollapsibleSection title="Live Event Insights">
          <LiveLoginInsightsCharts />

          <SessionParticipationAnalytics />

          <EventFeedbackCharts
            eventFeedback={liveFeedback ?? eventFeedbackAnalytics}
            eventFeedbackLoading={!liveFeedback && eventFeedbackAnalyticsLoading}
            eventFeedbackError={liveFeedback ? null : eventFeedbackAnalyticsError}
          />

          {streamingSummaryLoading && !liveStreamingSummary ? (
            <p className="py-4 text-sm text-muted-foreground">Loading streaming insights…</p>
          ) : liveStreamingSummary ? (
            <>
              <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Currently Watching"
                  value={liveStreamingSummary.currentlyWatching}
                  icon={Eye}
                />
                <StatCard
                  title="Unique Viewers"
                  value={liveStreamingSummary.uniqueViewers}
                  icon={Users}
                />
                <StatCard
                  title="Broadcast Sessions"
                  value={liveStreamingSummary.broadcastSessions}
                  icon={Radio}
                />
                <StatCard
                  title="Peak Concurrent"
                  value={liveStreamingSummary.peakConcurrentViewers}
                  icon={TrendingUp}
                />
              </div>
              <AnalyticsMetricTable
                title="Streaming Details"
                rows={streamingMetrics}
                exportSlug={`${exportSlugPrefix}-streaming-details`}
                emptyMessage="No streaming data."
              />
            </>
          ) : null}

          {showParticipationDuration && (
            <ParticipationTimeTable
              sessions={participationTimeSessions}
              exportSlug={`${exportSlugPrefix}-participation-duration`}
            />
          )}
        </AnalyticsCollapsibleSection>
      )}
    </div>
  );
}

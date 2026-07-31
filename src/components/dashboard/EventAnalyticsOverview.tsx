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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalyticsMetricTable } from "@/components/dashboard/AnalyticsDistributionTable";
import { AnalyticsCollapsibleSection } from "@/components/dashboard/AnalyticsCollapsibleSection";
import { EventFeedbackCharts } from "@/components/dashboard/EventFeedbackCharts";
import { LiveLoginInsightsCharts } from "@/components/dashboard/LiveLoginInsightsCharts";
import { ParticipationTimeTable } from "@/components/dashboard/ParticipationTimeTable";
import { SessionParticipationAnalytics } from "@/components/dashboard/SessionParticipationAnalytics";
import { RegistrationInsightsCharts } from "@/components/dashboard/RegistrationInsightsCharts";
import { ChartCard } from "@/components/shared/ChartCard";
import { ChartFilterGroup } from "@/components/shared/ChartFilterGroup";
import { StatCard } from "@/components/shared/StatCard";
import { isIcasEventName } from "@/lib/icas-conference";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildRegistrationIntervalTrend,
  formatRegistrationIntervalDayLabel,
  mapApiRegistrationInsights,
  type RegistrationTrendGranularity,
} from "@/lib/analytics-mappers";
import { slugifyFilename } from "@/lib/export-utils";
import { MOCK_PARTICIPATION_TIME_SESSIONS } from "@/mock/analytics-participation-time";
import { useLiveAnalyticsSocket } from "@/hooks/useLiveAnalyticsSocket";
import { getAllEvents } from "@/services/event.service";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import { useLiveAnalyticsStore } from "@/store/useLiveAnalyticsStore";
import type { Event, StreamingParticipationMode } from "@/types";

const COMPACT_CHART_HEIGHT = 128;
const PARTICIPATION_INTERVAL_MINUTES = 15;
const PARTICIPATION_MODE_OPTIONS: { value: StreamingParticipationMode; label: string }[] = [
  { value: "all", label: "All" },
  { value: "physical", label: "Physical" },
  { value: "virtual", label: "Virtual" },
];
const AXIS_TICK = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };
const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
};

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDateRange(startIso: string, endIso: string): string[] {
  const start = new Date(`${startIso.slice(0, 10)}T12:00:00`);
  const end = new Date(`${endIso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end && dates.length < 31) {
    dates.push(toLocalIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

/** Prefer known ICAS event, else highest registration count. */
function pickAnalyticsEvent(events: Event[]): Event | null {
  if (events.length === 0) return null;
  const preferred = events.find((event) => event.id === "11");
  if (preferred) return preferred;
  return [...events].sort(
    (a, b) => (b.registeredCount ?? 0) - (a.registeredCount ?? 0),
  )[0] ?? events[0];
}

function CompactIntervalBarChart({ data }: { data: { name: string; value: number }[] }) {
  const chartWidth = Math.max(260, data.length * 14);

  return (
    <div className="h-[128px] w-full overflow-x-auto">
      <BarChart
        width={chartWidth}
        height={COMPACT_CHART_HEIGHT}
        data={data}
        margin={{ top: 4, right: 8, left: -12, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/60" />
        <XAxis
          dataKey="name"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          interval={3}
          angle={-35}
          textAnchor="end"
          height={36}
        />
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={28}
          allowDecimals={false}
          domain={[0, (max: number) => Math.max(5, Math.ceil(max * 1.15))]}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={10} />
      </BarChart>
    </div>
  );
}

export function EventAnalyticsOverview() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [participationIntervalDate, setParticipationIntervalDate] = useState<string>(
    () => toLocalIsoDate(new Date()),
  );
  const [participationMode, setParticipationMode] = useState<StreamingParticipationMode>("all");
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
    streamingParticipationTrend,
    streamingParticipationTrendLoading,
    streamingParticipationTrendError,
    fetchStreamingParticipationTrend,
    clearStreamingParticipationTrend,
  } = useAnalyticsStore();

  useLiveAnalyticsSocket(selectedEventId);
  const liveStreamingPartial = useLiveAnalyticsStore((s) => s.snapshot?.streamingSummary ?? null);

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
      clearStreamingParticipationTrend();
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
    clearStreamingParticipationTrend,
  ]);

  useEffect(() => {
    setAttendanceDateFilter("all");
    setParticipationMode("all");
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) return;
    fetchRegistrationTrend(selectedEventId, trendGranularity);
  }, [selectedEventId, trendGranularity, fetchRegistrationTrend]);

  const participationDateOptions = useMemo(() => {
    const today = toLocalIsoDate(new Date());
    const fromEventDays = (eventAnalytics?.days ?? [])
      .map((day) => day.date.slice(0, 10))
      .filter(Boolean);
    const fromEventRange = selectedEvent?.date
      ? buildDateRange(selectedEvent.date, selectedEvent.endDate ?? selectedEvent.date)
      : [];

    return [...new Set([today, ...fromEventDays, ...fromEventRange])];
  }, [eventAnalytics?.days, selectedEvent?.date, selectedEvent?.endDate]);

  useEffect(() => {
    if (participationDateOptions.length === 0) return;
    if (!participationDateOptions.includes(participationIntervalDate)) {
      setParticipationIntervalDate(participationDateOptions[0]);
    }
  }, [participationDateOptions, participationIntervalDate]);

  useEffect(() => {
    if (!selectedEventId || !participationIntervalDate) return;
    fetchStreamingParticipationTrend(selectedEventId, {
      mode: participationMode,
      intervalMinutes: PARTICIPATION_INTERVAL_MINUTES,
      date: participationIntervalDate,
    });
  }, [
    selectedEventId,
    participationIntervalDate,
    participationMode,
    fetchStreamingParticipationTrend,
  ]);

  const participationIntervalTrend = useMemo(() => {
    if (!streamingParticipationTrend) return [];
    return buildRegistrationIntervalTrend({
      date: streamingParticipationTrend.date,
      intervalMinutes: streamingParticipationTrend.intervalMinutes,
      buckets: streamingParticipationTrend.buckets,
    });
  }, [streamingParticipationTrend]);

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
    if (!eventAnalytics) return [];
    const fromApi = eventAnalytics.participationTimeSessions ?? [];
    return fromApi.length > 0 ? fromApi : MOCK_PARTICIPATION_TIME_SESSIONS;
  }, [eventAnalytics]);

  const participationTimeIsPlaceholder = useMemo(() => {
    if (!eventAnalytics) return false;
    return (eventAnalytics.participationTimeSessions ?? []).length === 0;
  }, [eventAnalytics]);

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
      {streamingParticipationTrendError && (
        <p className="text-sm text-destructive">{streamingParticipationTrendError}</p>
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
        || streamingParticipationTrend
        || eventAnalytics
        || eventFeedbackAnalytics
        || streamingSummaryLoading
        || streamingParticipationTrendLoading
        || eventFeedbackAnalyticsLoading
        || Boolean(selectedEventId)) && !initialEventLoading && (
        <AnalyticsCollapsibleSection title="Live Event Insights">
          <LiveLoginInsightsCharts />

          <SessionParticipationAnalytics />

          <div className="max-w-xl space-y-2">
            <ChartCard
              compact
              title="Participation Trend"
              description="Activity per 15-minute interval. Filter by All, Physical, or Virtual."
              filters={
                <div className="flex flex-col items-end gap-2">
                  <ChartFilterGroup
                    options={PARTICIPATION_MODE_OPTIONS}
                    value={participationMode}
                    onChange={setParticipationMode}
                    className="justify-end"
                  />
                  {participationDateOptions.length > 0 ? (
                    <Select
                      value={participationIntervalDate}
                      onValueChange={setParticipationIntervalDate}
                    >
                      <SelectTrigger className="h-8 w-full max-w-[9.5rem] text-xs" aria-label="Event day">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {participationDateOptions.map((date) => (
                          <SelectItem key={date} value={date}>
                            {formatRegistrationIntervalDayLabel(date)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              }
            >
              {streamingParticipationTrendLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Loading participation trend…
                </p>
              ) : streamingParticipationTrendError ? (
                <p className="py-8 text-center text-sm text-destructive">
                  {streamingParticipationTrendError}
                </p>
              ) : participationIntervalTrend.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No participation activity in this period yet.
                </p>
              ) : (
                <CompactIntervalBarChart data={participationIntervalTrend} />
              )}
            </ChartCard>
          </div>

          <EventFeedbackCharts
            eventFeedback={eventFeedbackAnalytics}
            eventFeedbackLoading={eventFeedbackAnalyticsLoading}
            eventFeedbackError={eventFeedbackAnalyticsError}
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

          {eventAnalytics && (
            <ParticipationTimeTable
              sessions={participationTimeSessions}
              exportSlug={`${exportSlugPrefix}-participation-time`}
              usingPlaceholder={participationTimeIsPlaceholder}
            />
          )}
        </AnalyticsCollapsibleSection>
      )}
    </div>
  );
}

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
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalyticsMetricTable } from "@/components/dashboard/AnalyticsDistributionTable";
import {
  AttendanceDayModeTable,
  type AttendanceInsightModeFilter,
} from "@/components/dashboard/AttendanceDayModeTable";
import { AnalyticsCollapsibleSection } from "@/components/dashboard/AnalyticsCollapsibleSection";
import { ParticipationTimeTable } from "@/components/dashboard/ParticipationTimeTable";
import { ChartCard } from "@/components/shared/ChartCard";
import { StatCard } from "@/components/shared/StatCard";
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
  buildDayTrend,
  buildRegistrationIntervalTrend,
  formatRegistrationIntervalDayLabel,
  formatWatchDuration,
} from "@/lib/analytics-mappers";
import { slugifyFilename } from "@/lib/export-utils";
import { readPublicEnv } from "@/lib/env";
import { MOCK_PARTICIPATION_TIME_SESSIONS } from "@/mock/analytics-participation-time";
import { MOCK_REGISTRATION_INTERVALS_BY_DAY } from "@/mock/analytics-registration-intervals";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";

const analyticsUiPreview = readPublicEnv("NEXT_PUBLIC_ANALYTICS_USE_MOCK") === "true";

const COMPACT_CHART_HEIGHT = 128;
const AXIS_TICK = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };
const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
};

function CompactLineChartContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[128px] w-full">
      <ResponsiveContainer width="100%" height={COMPACT_CHART_HEIGHT}>
        {children}
      </ResponsiveContainer>
    </div>
  );
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
  const [insightDateFilter, setInsightDateFilter] = useState<string>("all");
  const [insightModeFilter, setInsightModeFilter] = useState<AttendanceInsightModeFilter>("all");
  const [participationIntervalDate, setParticipationIntervalDate] = useState<string>("2026-08-20");

  const {
    analytics,
    isLoading,
    error,
    fetchAnalytics,
    eventAnalytics,
    eventAnalyticsLoading,
    eventAnalyticsError,
    fetchEventAnalytics,
    clearEventAnalytics,
  } = useAnalyticsStore();

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (selectedEventId || !analytics) return;

    const defaultEventId =
      analytics.dashboard.topEventsByRegistrations[0]?.id
      ?? (analytics.dashboard.events.total === 1 ? analytics.dashboard.topEventsByRegistrations[0]?.id : null);

    if (defaultEventId) {
      setSelectedEventId(defaultEventId);
    }
  }, [analytics, selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) {
      clearEventAnalytics();
      return;
    }
    fetchEventAnalytics(selectedEventId);
  }, [selectedEventId, fetchEventAnalytics, clearEventAnalytics]);

  useEffect(() => {
    setInsightDateFilter("all");
    setInsightModeFilter("all");
  }, [selectedEventId]);

  useEffect(() => {
    if (!eventAnalytics?.days.length) return;
    const defaultDate =
      eventAnalytics.days.find((d) => d.date === "2026-08-20")?.date
      ?? eventAnalytics.days[0]?.date
      ?? "2026-08-20";
    setParticipationIntervalDate(defaultDate);
  }, [eventAnalytics?.event.id, eventAnalytics?.days]);

  const tableData = useMemo(() => {
    if (!eventAnalytics) return null;

    const { days } = eventAnalytics;

    return {
      registrationTrend: buildDayTrend(days),
    };
  }, [eventAnalytics]);

  const registrationIntervalDays = useMemo(() => {
    if (!eventAnalytics) return [];
    const fromApi = eventAnalytics.registrationIntervalsByDay ?? [];
    return fromApi.length > 0 ? fromApi : MOCK_REGISTRATION_INTERVALS_BY_DAY;
  }, [eventAnalytics]);

  const participationIntervalTrend = useMemo(() => {
    const day = registrationIntervalDays.find((d) => d.date === participationIntervalDate)
      ?? registrationIntervalDays[0];
    return buildRegistrationIntervalTrend(day);
  }, [registrationIntervalDays, participationIntervalDate]);

  const streamingMetrics = useMemo(() => {
    if (!eventAnalytics) return [];

    const { streaming } = eventAnalytics;
    return [
      { metric: "Currently Watching", value: streaming.currentlyWatching },
      { metric: "Unique Viewers", value: streaming.uniqueViewers },
      { metric: "Broadcast Sessions", value: streaming.broadcastSessions },
      { metric: "Viewer Sessions", value: streaming.totalViewerSessions },
      { metric: "Peak Concurrent Viewers", value: streaming.peakConcurrentViewers },
      { metric: "Logins", value: streaming.logins },
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

  const participationTimeSessions = useMemo(() => {
    if (!eventAnalytics) return [];
    const fromApi = eventAnalytics.participationTimeSessions ?? [];
    return fromApi.length > 0 ? fromApi : MOCK_PARTICIPATION_TIME_SESSIONS;
  }, [eventAnalytics]);

  const participationTimeIsPlaceholder = useMemo(() => {
    if (!eventAnalytics) return false;
    return (eventAnalytics.participationTimeSessions ?? []).length === 0;
  }, [eventAnalytics]);

  const selectedTopEvent = analytics?.dashboard.topEventsByRegistrations[0] ?? null;

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading && !analytics && <DashboardSkeleton />}

      {!isLoading && !analytics && (
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

      {analytics && selectedTopEvent && (
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{selectedTopEvent.title}</h2>
          {analyticsUiPreview && (
            <Badge variant="secondary">UI preview (mock data)</Badge>
          )}
          <Badge variant="outline" className="capitalize">
            {selectedTopEvent.status.toLowerCase()}
          </Badge>
          <Badge variant="secondary">{selectedTopEvent.registrationCount} registrations</Badge>
        </div>
      )}

      {selectedEventId && eventAnalyticsLoading && <DashboardSkeleton />}

      {eventAnalyticsError && (
        <p className="text-sm text-destructive">{eventAnalyticsError}</p>
      )}

      {eventAnalytics && tableData && !eventAnalyticsLoading && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Registrations
            </h3>
            <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <StatCard title="Total" value={eventAnalytics.registrations.total} icon={UserPlus} />
              <StatCard
                title="Accepted"
                value={eventAnalytics.registrations.byStatus.ACCEPTED ?? 0}
                icon={CheckCircle2}
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
            </div>
            {analytics && (
              <div className="mt-3 max-w-xs">
                <StatCard
                  title="Total Users"
                  value={analytics.dashboard.users.total}
                  icon={Users}
                />
              </div>
            )}
          </div>

          <AnalyticsCollapsibleSection title="Trends">
            <div className="grid gap-3 md:grid-cols-2 md:max-w-4xl">
              <ChartCard
                compact
                title="Registration Trend"
                description="Registrations by event day."
              >
                <CompactLineChartContainer>
                  <LineChart
                    data={tableData.registrationTrend}
                    margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/60" />
                    <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={AXIS_TICK}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                      allowDecimals={false}
                      domain={[0, (max: number) => Math.max(5, Math.ceil(max * 1.15))]}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </CompactLineChartContainer>
              </ChartCard>

              <ChartCard
                compact
                title="Participation Trend"
                description="Registrations per 15-minute interval."
                filters={
                  registrationIntervalDays.length > 0 ? (
                    <Select value={participationIntervalDate} onValueChange={setParticipationIntervalDate}>
                      <SelectTrigger className="h-8 w-full max-w-[9.5rem] text-xs" aria-label="Event day">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {registrationIntervalDays.map((day) => (
                          <SelectItem key={day.date} value={day.date}>
                            {formatRegistrationIntervalDayLabel(day.date)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null
                }
              >
                <CompactIntervalBarChart data={participationIntervalTrend} />
              </ChartCard>
            </div>
          </AnalyticsCollapsibleSection>

          <AnalyticsCollapsibleSection title="Registration Insights">
            <AttendanceDayModeTable
              days={eventAnalytics.days}
              dateFilter={insightDateFilter}
              modeFilter={insightModeFilter}
              onDateFilterChange={setInsightDateFilter}
              onModeFilterChange={setInsightModeFilter}
              exportSlug={`${exportSlugPrefix}-attendance-by-day-mode`}
            />
          </AnalyticsCollapsibleSection>

          <AnalyticsCollapsibleSection title="Live Event Insights">
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
                icon={TrendingUp}
              />
            </div>
            <AnalyticsMetricTable
              title="Streaming Details"
              rows={streamingMetrics}
              exportSlug={`${exportSlugPrefix}-streaming-details`}
              emptyMessage="No streaming data."
            />
            <ParticipationTimeTable
              sessions={participationTimeSessions}
              exportSlug={`${exportSlugPrefix}-participation-time`}
              usingPlaceholder={participationTimeIsPlaceholder}
            />
          </AnalyticsCollapsibleSection>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  BarChart3, UserCheck, UserX, UserPlus, Pause, Clock, Eye, Radio,
  Plane, Stethoscope, Languages, Hotel, Users,
} from "lucide-react";
import { EventSelectCard } from "@/components/dashboard/EventSelectCard";
import { StatCard } from "@/components/shared/StatCard";
import { ChartCard } from "@/components/shared/ChartCard";
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
import { getAllEvents } from "@/services/event.service";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import type { Event } from "@/types";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const AXIS_TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };
const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
};

function ChartContainer({ height, children }: { height: number; children: React.ReactNode }) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

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

  const chartData = useMemo(() => {
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
              description="Choose an event above to view registration, assistance, and streaming analytics."
            />
          </CardContent>
        </Card>
      )}

      {selectedEventId && eventAnalyticsLoading && <DashboardSkeleton />}

      {eventAnalyticsError && (
        <p className="text-sm text-destructive">{eventAnalyticsError}</p>
      )}

      {eventAnalytics && chartData && !eventAnalyticsLoading && (
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <p className="mt-2 text-xs text-muted-foreground">
              Avg watch time: {formatWatchDuration(eventAnalytics.streaming.avgWatchDurationSeconds)}
              {" · "}
              Total watch time: {formatWatchDuration(eventAnalytics.streaming.totalWatchTimeSeconds)}
              {" · "}
              Live broadcast: {eventAnalytics.streaming.primaryBroadcastActive ? "Active" : "Inactive"}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Registration Insights
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ChartCard title="Registration Status" compact>
                <ChartContainer height={168}>
                  {chartData.status.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No registration data
                    </div>
                  ) : (
                    <PieChart>
                      <Pie
                        data={chartData.status}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="46%"
                        innerRadius={38}
                        outerRadius={58}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {chartData.status.map((entry, i) => (
                          <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                      />
                    </PieChart>
                  )}
                </ChartContainer>
              </ChartCard>

              <ChartCard title="Attendance Mode" compact>
                <ChartContainer height={168}>
                  <BarChart data={chartData.attendanceMode} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/60" />
                    <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ChartContainer>
              </ChartCard>

              <ChartCard title="Participation Time" compact>
                <ChartContainer height={168}>
                  <BarChart data={chartData.participationTime} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/60" />
                    <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ChartContainer>
              </ChartCard>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ChartCard title="Food Preferences" compact>
              <ChartContainer height={180}>
                {chartData.food.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No food preference data
                  </div>
                ) : (
                  <PieChart>
                    <Pie
                      data={chartData.food}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="44%"
                      innerRadius={32}
                      outerRadius={50}
                      paddingAngle={1}
                      strokeWidth={0}
                    >
                      {chartData.food.map((entry, i) => (
                        <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={7}
                      wrapperStyle={{ fontSize: 10, paddingTop: 2 }}
                    />
                  </PieChart>
                )}
              </ChartContainer>
            </ChartCard>

            <ChartCard title="Participation Dates" compact>
              <ChartContainer height={180}>
                <BarChart data={chartData.participationDates} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/60" />
                  <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ChartContainer>
            </ChartCard>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Assistance Requests
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <ChartCard title="Travel by Transport Mode" compact>
                <ChartContainer height={152}>
                  <BarChart data={chartData.transport} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/60" />
                    <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ChartContainer>
              </ChartCard>

              <ChartCard title="Translation by Language" compact>
                <ChartContainer height={152}>
                  <BarChart
                    data={chartData.languages}
                    layout="vertical"
                    margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/60" />
                    <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={56}
                      tick={{ ...AXIS_TICK, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={14} />
                  </BarChart>
                </ChartContainer>
              </ChartCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

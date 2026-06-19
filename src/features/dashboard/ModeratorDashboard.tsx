"use client";

import { useEffect } from "react";
import { Users, UserCheck, UserX, UserPlus, Activity, Pause, Clock } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { StatCard } from "@/components/shared/StatCard";
import { ChartCard } from "@/components/shared/ChartCard";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import { useEventStore } from "@/store/useEventStore";
import { formatDate } from "@/lib/utils";

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

export function ModeratorDashboard() {
  const { analytics, isLoading, fetchAnalytics } = useAnalyticsStore();
  const { events, fetchEvents } = useEventStore();

  useEffect(() => {
    fetchAnalytics();
    fetchEvents("upcoming");
  }, [fetchAnalytics, fetchEvents]);

  if (isLoading || !analytics) return <DashboardSkeleton />;

  const { summary } = analytics;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Moderator Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of registrations and participant management</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Registered Users" value={summary.totalUsers} icon={Users} />
        <StatCard title="Event Participants" value={summary.eventParticipants} icon={UserPlus} />
        <StatCard title="Accepted Participants" value={summary.accepted} icon={UserCheck} />
        <StatCard title="Pending Participants" value={summary.pending} icon={Clock} />
        <StatCard title="On Hold Participants" value={summary.onHold} icon={Pause} />
        <StatCard title="Rejected Participants" value={summary.rejected} icon={UserX} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ChartCard title="Registration Trend" compact>
          <ChartContainer height={168}>
            <LineChart data={analytics.registrationTrend} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/60" />
              <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Participation Trend" compact>
          <ChartContainer height={168}>
            <BarChart data={analytics.participationTrend} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/60" />
              <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Food Preferences" compact>
          <ChartContainer height={168}>
            <PieChart>
              <Pie
                data={analytics.foodPreferences}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                innerRadius={38}
                outerRadius={58}
                paddingAngle={2}
                strokeWidth={0}
              >
                {analytics.foodPreferences.map((entry, i) => (
                  <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Translation Requests" compact>
          <ChartContainer height={168}>
            <BarChart data={analytics.translationRequests} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/60" />
              <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={56} tick={{ ...AXIS_TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={14} />
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-2">
            {[
              { action: "Registration accepted", user: "James Smith", time: "2 min ago" },
              { action: "Travel request approved", user: "Mary Johnson", time: "15 min ago" },
              { action: "New registration", user: "Robert Williams", time: "1 hour ago" },
              { action: "Translation approved", user: "Patricia Brown", time: "2 hours ago" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                <div>
                  <p className="font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.user}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-2">
            {events.filter((e) => e.status === "published" || e.status === "live").slice(0, 4).map((event) => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                <div>
                  <p className="font-medium">{event.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                </div>
                <Badge variant={event.status === "live" ? "success" : "default"} className="capitalize">
                  {event.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Users, UserCheck, UserX, UserPlus, Pause } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { ChartCard } from "@/components/shared/ChartCard";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";

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

export default function AnalyticsPage() {
  return (
    <RouteGuard allowedRoles={["moderator", "event_administrator", "super_administrator"]}>
      <AnalyticsContent />
    </RouteGuard>
  );
}

function AnalyticsContent() {
  const { analytics, isLoading, error, fetchAnalytics } = useAnalyticsStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading || !analytics) return <DashboardSkeleton />;

  const { summary } = analytics;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Comprehensive event and user analytics</p>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          User Summary
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Users" value={summary.totalUsers} icon={Users} />
          <StatCard title="Participants Registered" value={summary.eventParticipants} icon={UserPlus} />
          <StatCard title="Accepted" value={summary.accepted} icon={UserCheck} />
          <StatCard title="Rejected" value={summary.rejected} icon={UserX} />
          <StatCard title="On Hold" value={summary.onHold} icon={Pause} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Participation Summary
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ChartCard title="Registration Trend" compact>
            <ChartContainer height={168}>
              <LineChart data={analytics.registrationTrend} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/60" />
                <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </ChartCard>

          <ChartCard title="Registration Week on Week " compact>
            <ChartContainer height={168}>
              <BarChart data={analytics.participationTrend} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/60" />
                <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ChartContainer>
          </ChartCard>

          <ChartCard title="Status Distribution" compact>
            <ChartContainer height={168}>
              <PieChart>
                <Pie
                  data={analytics.statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="46%"
                  innerRadius={38}
                  outerRadius={58}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {analytics.statusDistribution.map((entry, i) => (
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
            </ChartContainer>
          </ChartCard>

        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Additional Analytics
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ChartCard title="Food Preferences" compact>
            <ChartContainer height={152}>
              <PieChart>
                <Pie
                  data={analytics.foodPreferences}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="44%"
                  innerRadius={32}
                  outerRadius={50}
                  paddingAngle={1}
                  strokeWidth={0}
                >
                  {analytics.foodPreferences.map((entry, i) => (
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
            </ChartContainer>
          </ChartCard>

          <ChartCard title="Travel Requirements" compact>
            <ChartContainer height={152}>
              <BarChart data={analytics.travelRequirements} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/60" />
                <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ChartContainer>
          </ChartCard>

          <ChartCard title="Language Requests" compact>
            <ChartContainer height={152}>
              <BarChart
                data={analytics.languageRequests}
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
    </div>
  );
}

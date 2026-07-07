"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ChartCard } from "@/components/shared/ChartCard";
import { ChartFilterGroup } from "@/components/shared/ChartFilterGroup";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import {
  getParticipationTrendData,
  getRegistrationTrendData,
  type ParticipationTrendMode,
  type RegistrationTrendPeriod,
} from "@/lib/moderator-dashboard-charts";

const AXIS_TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };
const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
};

const REGISTRATION_PERIOD_OPTIONS = [
  { value: "daily" as const, label: "Daily" },
  { value: "weekly" as const, label: "Weekly" },
  { value: "monthly" as const, label: "Monthly" },
];

const PARTICIPATION_MODE_OPTIONS = [
  { value: "physical" as const, label: "Physical" },
  { value: "virtual" as const, label: "Virtual" },
  { value: "all" as const, label: "All" },
];

function ChartContainer({ height, children }: { height: number; children: React.ReactNode }) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardTrendCharts() {
  const { analytics, isLoading, fetchAnalytics } = useAnalyticsStore();
  const [registrationPeriod, setRegistrationPeriod] = useState<RegistrationTrendPeriod>("daily");
  const [participationMode, setParticipationMode] = useState<ParticipationTrendMode>("all");

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const registrationTrendData = useMemo(
    () => (analytics ? getRegistrationTrendData(analytics, registrationPeriod) : []),
    [analytics, registrationPeriod],
  );

  const participationTrendData = useMemo(
    () => (analytics ? getParticipationTrendData(analytics, participationMode) : []),
    [analytics, participationMode],
  );

  if (isLoading || !analytics) {
    return (
      <div className="grid auto-rows-fr gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="shadow-sm">
            <CardHeader className="space-y-2 px-3 py-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-full" />
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <Skeleton className="h-[168px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid auto-rows-fr gap-3 sm:grid-cols-2">
      <ChartCard
        title="Registration Trend"
        compact
        filters={
          <ChartFilterGroup
            options={REGISTRATION_PERIOD_OPTIONS}
            value={registrationPeriod}
            onChange={setRegistrationPeriod}
          />
        }
      >
        <ChartContainer height={168}>
          <LineChart data={registrationTrendData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/60" />
            <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        title="Participation Trend"
        compact
        filters={
          <ChartFilterGroup
            options={PARTICIPATION_MODE_OPTIONS}
            value={participationMode}
            onChange={setParticipationMode}
          />
        }
      >
        <ChartContainer height={168}>
          <BarChart data={participationTrendData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/60" />
            <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartContainer>
      </ChartCard>
    </div>
  );
}

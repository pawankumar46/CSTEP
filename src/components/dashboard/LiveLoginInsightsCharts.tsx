"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Globe2, MapPin, Users } from "lucide-react";
import { CountryRegistrationsGlobe } from "@/components/dashboard/CountryRegistrationsGlobe";
import { IndiaStateRegistrationsMap } from "@/components/dashboard/IndiaStateRegistrationsMap";
import { ChartFilterGroup } from "@/components/shared/ChartFilterGroup";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LiveAnalyticsConnectionStatus } from "@/lib/live-analytics-api-contract";
import { cn } from "@/lib/utils";
import { useLiveAnalyticsStore } from "@/store/useLiveAnalyticsStore";
import type { DistributionDataPoint, StreamingParticipationMode } from "@/types";

const LOGIN_MODE_OPTIONS: { value: StreamingParticipationMode; label: string }[] = [
  { value: "all", label: "All" },
  { value: "physical", label: "Physical" },
  { value: "virtual", label: "Virtual" },
];

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 10,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
};

const EMPTY_SESSION_PLACEHOLDER: DistributionDataPoint[] = [
  { name: "Session 1", value: 0 },
  { name: "Session 2", value: 0 },
  { name: "Session 3", value: 0 },
  { name: "Session 4", value: 0 },
];

function InsightCard({
  icon: Icon,
  title,
  description,
  filters,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  filters?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex h-full flex-col overflow-hidden shadow-sm", className)}>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
            </div>
          </div>
          {filters}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">{children}</CardContent>
    </Card>
  );
}

function VirtualOnlyBadge() {
  return (
    <Badge variant="secondary" className="shrink-0 text-xs font-normal">
      Virtual
    </Badge>
  );
}

function LiveStatusBadge({
  status,
  error,
}: {
  status: LiveAnalyticsConnectionStatus;
  error: string | null;
}) {
  const label =
    status === "connected"
      ? "Live"
      : status === "connecting"
        ? "Connecting…"
        : status === "error"
          ? "Live error"
          : status === "disconnected"
            ? "Reconnecting…"
            : "Offline";

  return (
    <Badge
      variant={status === "connected" ? "success" : status === "error" ? "destructive" : "secondary"}
      className="shrink-0 text-xs font-normal"
      title={error ?? undefined}
    >
      <span
        className={cn(
          "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
          status === "connected" && "bg-emerald-400",
          status === "connecting" && "animate-pulse bg-amber-400",
          status === "disconnected" && "animate-pulse bg-amber-400",
          status === "error" && "bg-destructive-foreground",
          status === "idle" && "bg-muted-foreground",
        )}
        aria-hidden
      />
      {label}
    </Badge>
  );
}

function SessionMaxVirtualChart({ data }: { data: DistributionDataPoint[] }) {
  const chartHeight = Math.max(data.length * 36 + 8, 140);
  const maxValue = Math.max(1, ...data.map((row) => row.value));

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden pr-1" style={{ maxHeight: 240 }}>
      <div style={{ height: chartHeight, width: "100%" }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 36, left: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/50" />
            <XAxis type="number" hide domain={[0, Math.ceil(maxValue * 1.15)]} />
            <YAxis
              type="category"
              dataKey="name"
              width={88}
              tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [`${Number(value ?? 0)} max`, "Virtual"]}
            />
            <Bar
              dataKey="value"
              fill={maxValue > 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.35)"}
              radius={[0, 6, 6, 0]}
              maxBarSize={18}
            >
              <LabelList
                dataKey="value"
                position="right"
                className="fill-muted-foreground"
                style={{ fontSize: 11 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function pickModeSeries(
  series: { all: DistributionDataPoint[]; physical: DistributionDataPoint[]; virtual: DistributionDataPoint[] } | undefined,
  mode: StreamingParticipationMode,
): DistributionDataPoint[] {
  if (!series) return [];
  if (mode === "physical") return series.physical;
  if (mode === "virtual") return series.virtual;
  return series.all.length > 0 ? series.all : [...series.physical, ...series.virtual];
}

/**
 * Live Event Insights — login visuals fed by `/ws/analytics/{eventId}/`.
 * 1. Statewise Login — Physical / Virtual / All
 * 2. Countrywise Login — Virtual
 * 3. Session Wise Max Virtual Participant count — Virtual
 */
export function LiveLoginInsightsCharts() {
  const [stateLoginMode, setStateLoginMode] =
    useState<StreamingParticipationMode>("all");

  const status = useLiveAnalyticsStore((s) => s.status);
  const error = useLiveAnalyticsStore((s) => s.error);
  const snapshot = useLiveAnalyticsStore((s) => s.snapshot);

  const stateLoginData = useMemo(
    () => pickModeSeries(snapshot?.statewiseLogin, stateLoginMode),
    [snapshot?.statewiseLogin, stateLoginMode],
  );
  const countryLoginData = useMemo(
    () => snapshot?.countrywiseLoginVirtual ?? [],
    [snapshot?.countrywiseLoginVirtual],
  );
  const sessionMaxVirtualData = useMemo(() => {
    const live = snapshot?.sessionMaxVirtual ?? [];
    return live.length > 0 ? live : EMPTY_SESSION_PLACEHOLDER;
  }, [snapshot?.sessionMaxVirtual]);

  const hasLiveState = stateLoginData.some((row) => row.value > 0);
  const hasLiveCountry = countryLoginData.some((row) => row.value > 0);
  const hasLiveSession = (snapshot?.sessionMaxVirtual ?? []).some((row) => row.value > 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Login insights
        </h3>
        <LiveStatusBadge status={status} error={error} />
      </div>

      {error && status === "error" && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <InsightCard
          icon={MapPin}
          title="Statewise Login"
          description="Logins from India by state. Filter by Physical, Virtual, or All."
          filters={
            <ChartFilterGroup
              options={LOGIN_MODE_OPTIONS}
              value={stateLoginMode}
              onChange={setStateLoginMode}
              className="justify-end"
            />
          }
        >
          <IndiaStateRegistrationsMap data={stateLoginData} />
          {!hasLiveState && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Waiting for live statewise login data…
            </p>
          )}
        </InsightCard>

        <InsightCard
          icon={Globe2}
          title="Countrywise Login"
          description="Virtual logins by country on the globe."
          filters={<VirtualOnlyBadge />}
        >
          <CountryRegistrationsGlobe data={countryLoginData} />
          {!hasLiveCountry && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Waiting for live countrywise login data…
            </p>
          )}
        </InsightCard>

        <InsightCard
          icon={Users}
          title="Session Wise Max Virtual Participants"
          description="Peak concurrent virtual participants per session."
          filters={<VirtualOnlyBadge />}
          className="lg:col-span-2 xl:col-span-1"
        >
          <SessionMaxVirtualChart data={sessionMaxVirtualData} />
          {!hasLiveSession && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Waiting for live session max virtual data…
            </p>
          )}
        </InsightCard>
      </div>
    </div>
  );
}

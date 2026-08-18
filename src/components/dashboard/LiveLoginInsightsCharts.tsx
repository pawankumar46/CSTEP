"use client";

import { useMemo } from "react";
import { Globe2, MapPin, UserX, Users } from "lucide-react";
import { CountryRegistrationsGlobe } from "@/components/dashboard/CountryRegistrationsGlobe";
import { IndiaStateRegistrationsMap } from "@/components/dashboard/IndiaStateRegistrationsMap";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LiveAnalyticsConnectionStatus } from "@/lib/live-analytics-api-contract";
import { cn } from "@/lib/utils";
import { useLiveAnalyticsStore } from "@/store/useLiveAnalyticsStore";
import type { DistributionDataPoint } from "@/types";

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
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex h-full flex-col overflow-hidden shadow-sm", className)}>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
            <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">{children}</CardContent>
    </Card>
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
  const maxValue = Math.max(1, ...data.map((row) => row.value));

  return (
    <div
      className="w-full space-y-1.5 overflow-y-auto overflow-x-hidden pr-1 scroll-smooth"
      style={{ maxHeight: 240 }}
    >
      {data.map((item, index) => {
        const widthPercent = Math.max(
          (item.value / maxValue) * 100,
          item.value > 0 ? 8 : 0,
        );

        return (
          <div
            key={`${item.name}-${index}`}
            className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <p
                className="min-w-0 flex-1 text-[11px] font-medium leading-tight text-foreground line-clamp-2"
                title={item.name}
              >
                {item.name}
              </p>
              <p className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{item.value}</span>
                <span> max</span>
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{
                  width: `${widthPercent}%`,
                  opacity: item.value > 0 ? 1 : 0.35,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NoShowTable({
  rows,
}: {
  rows: { dayNumber: number; registered: number; attended: number; noShow: number }[];
}) {
  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30 text-left text-[11px] text-muted-foreground">
            <th className="px-2 py-1.5 font-medium">Day</th>
            <th className="px-2 py-1.5 text-right font-medium">Registered</th>
            <th className="px-2 py-1.5 text-right font-medium">Attended</th>
            <th className="px-2 py-1.5 text-right font-medium">No-show</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.dayNumber} className="border-b last:border-0">
              <td className="px-2 py-1.5 font-medium">Day {row.dayNumber}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{row.registered}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{row.attended}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{row.noShow}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getCombinedLoginSeries(
  series:
    | { all: DistributionDataPoint[]; physical: DistributionDataPoint[]; virtual: DistributionDataPoint[] }
    | undefined,
): DistributionDataPoint[] {
  if (!series) return [];
  return series.all.length > 0 ? series.all : [...series.physical, ...series.virtual];
}

/**
 * Live Event Insights — login visuals fed by `/ws/analytics/{eventId}/`.
 */
export function LiveLoginInsightsCharts() {
  const status = useLiveAnalyticsStore((s) => s.status);
  const error = useLiveAnalyticsStore((s) => s.error);
  const snapshot = useLiveAnalyticsStore((s) => s.snapshot);

  const stateLoginData = useMemo(
    () => getCombinedLoginSeries(snapshot?.statewiseLogin),
    [snapshot?.statewiseLogin],
  );
  const countryLoginData = useMemo(
    () => snapshot?.countrywiseLoginVirtual ?? [],
    [snapshot?.countrywiseLoginVirtual],
  );
  const sessionMaxVirtualData = useMemo(() => {
    const live = snapshot?.sessionMaxVirtual ?? [];
    if (live.length === 0) return EMPTY_SESSION_PLACEHOLDER;
    const sorted = [...live].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
    const withData = sorted.filter((row) => row.value > 0);
    return withData.length > 0 ? withData : sorted;
  }, [snapshot?.sessionMaxVirtual]);
  const noShowRows = snapshot?.noShow ?? [];

  const hasLiveState = stateLoginData.length > 0;
  const hasLiveCountry = countryLoginData.length > 0;
  const hasLiveSession = (snapshot?.sessionMaxVirtual ?? []).length > 0;

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
          description="Logins from India by state."
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
          description="Logins by country on the globe."
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
          className="lg:col-span-2 xl:col-span-1"
        >
          <SessionMaxVirtualChart data={sessionMaxVirtualData} />
          {!hasLiveSession && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Waiting for live session max virtual data…
            </p>
          )}
        </InsightCard>

        <InsightCard
          icon={UserX}
          title="No-show by day - Virtual Attendees"
          description="Registered vs attended vs no-show for each event day."
          className="lg:col-span-2 xl:col-span-3"
        >
          {noShowRows.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Waiting for live no-show data…
            </p>
          ) : (
            <NoShowTable rows={noShowRows} />
          )}
        </InsightCard>
      </div>
    </div>
  );
}

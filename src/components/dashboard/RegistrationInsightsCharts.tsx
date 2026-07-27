"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Globe2, MapPin, MessageSquareText, Monitor, UserRound, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildAttendanceModeByDateChart,
  buildAttendanceModeInsightChart,
  buildAttendanceModeSlicesChart,
  buildDemographicBarChartAll,
  buildDemographicDonutChart,
  buildDesignationInsightChart,
  buildFeedbackByDayChart,
  buildFeedbackBySessionChart,
  buildGenderInsightChart,
  buildRegistrationTrendChart,
  buildStateInsightChart,
  formatRegistrationIntervalDayLabel,
  type RegistrationTrendGranularity,
} from "@/lib/analytics-mappers";
import { ChartFilterGroup } from "@/components/shared/ChartFilterGroup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  DistributionDataPoint,
  EventFeedbackAnalytics,
  RegistrationAttendanceInsights,
  RegistrationDemographics,
  RegistrationInsights,
} from "@/types";

const TREND_GRANULARITY_OPTIONS: { value: RegistrationTrendGranularity; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const TREND_DESCRIPTIONS: Record<RegistrationTrendGranularity, string> = {
  daily: "How many people signed up over the last 7 days.",
  weekly: "How many people signed up each week (recent weeks).",
  monthly: "How many people signed up each month (recent months).",
};

const TREND_TOTAL_LABELS: Record<RegistrationTrendGranularity, string> = {
  daily: "total this week",
  weekly: "total in view",
  monthly: "total in view",
};

const COLORS = {
  day: "#3b82f6",
  physical: "#0ea5e9",
  virtual: "#8b5cf6",
  male: "#3b82f6",
  female: "#ec4899",
  other: "#94a3b8",
  state: ["#3b82f6", "#0ea5e9", "#06b6d4", "#14b8a6", "#22c55e", "#94a3b8"],
  designation: "#6366f1",
  mixed: "#f59e0b",
};

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 10,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
};

function totalOf(data: DistributionDataPoint[]) {
  return data.reduce((sum, item) => sum + item.value, 0);
}

function peopleLabel(count: number) {
  return `${count} ${count === 1 ? "person" : "people"}`;
}

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

function LegendList({
  data,
  colors,
}: {
  data: DistributionDataPoint[];
  colors: string[];
}) {
  const total = totalOf(data);
  return (
    <ul className="space-y-2">
      {data.map((item, index) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: colors[index % colors.length] }}
                aria-hidden
              />
              <span className="truncate text-foreground">{item.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {item.value}
              <span className="ml-1 text-xs">({pct}%)</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PeopleTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number; name?: string; payload?: { name?: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);
  const name = label || payload[0]?.payload?.name || payload[0]?.name || "";
  return (
    <div style={TOOLTIP_STYLE} className="px-3 py-2">
      <p className="font-medium">{name}</p>
      <p className="text-muted-foreground">{peopleLabel(value)} registered</p>
    </div>
  );
}

function FeedbackCountTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: {
    value?: number;
    name?: string;
    payload?: { name?: string; secondaryValue?: number };
  }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const count = Number(payload[0]?.value ?? 0);
  const avg = Number(payload[0]?.payload?.secondaryValue ?? 0);
  const name = label || payload[0]?.payload?.name || payload[0]?.name || "";
  return (
    <div style={TOOLTIP_STYLE} className="px-3 py-2">
      <p className="font-medium">{name}</p>
      <p className="text-muted-foreground">
        {count} response{count === 1 ? "" : "s"}
      </p>
      {avg > 0 ? (
        <p className="text-xs text-muted-foreground">Avg rating {avg.toFixed(1)}</p>
      ) : null}
    </div>
  );
}

const SCROLLABLE_BAR_ROW_HEIGHT = 36;

function ScrollableDemographicBarChart({
  data,
  yAxisWidth,
  tickFontSize = 12,
  maxViewportHeight = 240,
  defaultBarFill,
  allowDecimals = false,
  tooltip = "people",
  domainMax,
}: {
  data: DistributionDataPoint[];
  yAxisWidth: number;
  tickFontSize?: number;
  maxViewportHeight?: number;
  defaultBarFill?: string;
  allowDecimals?: boolean;
  tooltip?: "people" | "feedback";
  domainMax?: number;
}) {
  const chartHeight = Math.max(data.length * SCROLLABLE_BAR_ROW_HEIGHT + 8, 120);

  return (
    <div
      className="w-full overflow-y-auto overflow-x-hidden pr-1"
      style={{ maxHeight: maxViewportHeight }}
    >
      <div style={{ height: chartHeight, width: "100%" }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 36, left: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/50" />
            <XAxis
              type="number"
              hide
              allowDecimals={allowDecimals}
              domain={domainMax != null ? [0, domainMax] : undefined}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={yAxisWidth}
              tick={{ fontSize: tickFontSize, fill: "hsl(var(--foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={tooltip === "feedback" ? <FeedbackCountTooltip /> : <PeopleTooltip />}
              cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
            />
            <Bar
              dataKey="value"
              fill={defaultBarFill ?? COLORS.designation}
              radius={[0, 8, 8, 0]}
              maxBarSize={18}
              background={{ fill: "hsl(var(--muted) / 0.35)", radius: 8 }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={entry.color ?? defaultBarFill ?? COLORS.designation}
                />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                className="fill-foreground text-xs font-medium"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DonutWithLegend({
  data,
  colors,
  centerLabel,
}: {
  data: DistributionDataPoint[];
  colors: string[];
  centerLabel: string;
}) {
  const total = totalOf(data);
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="relative mx-auto h-[180px] w-full max-w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<PeopleTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-semibold tabular-nums leading-none">{total}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{centerLabel}</p>
        </div>
      </div>
      <LegendList data={data} colors={colors} />
    </div>
  );
}

interface RegistrationInsightsChartsProps {
  insights: RegistrationInsights;
  /** Live trend from GET /analytics/registrations/trend/ */
  registrationTrendDays?: { date: string; count: number }[] | null;
  registrationTrendLoading?: boolean;
  registrationTrendError?: string | null;
  trendGranularity: RegistrationTrendGranularity;
  onTrendGranularityChange: (value: RegistrationTrendGranularity) => void;
  /** Live attendance from GET /analytics/registrations/insights/ */
  attendanceInsights?: RegistrationAttendanceInsights | null;
  attendanceInsightsLoading?: boolean;
  attendanceInsightsError?: string | null;
  attendanceDateFilter: string;
  onAttendanceDateFilterChange: (value: string) => void;
  demographics?: RegistrationDemographics | null;
  demographicsLoading?: boolean;
  demographicsError?: string | null;
  eventFeedback?: EventFeedbackAnalytics | null;
  eventFeedbackLoading?: boolean;
  eventFeedbackError?: string | null;
}

export function RegistrationInsightsCharts({
  insights,
  registrationTrendDays,
  registrationTrendLoading,
  registrationTrendError,
  trendGranularity,
  onTrendGranularityChange,
  attendanceInsights,
  attendanceInsightsLoading,
  attendanceInsightsError,
  attendanceDateFilter,
  onAttendanceDateFilterChange,
  demographics,
  demographicsLoading,
  demographicsError,
  eventFeedback,
  eventFeedbackLoading,
  eventFeedbackError,
}: RegistrationInsightsChartsProps) {
  const byState = useMemo(() => {
    if (demographics) {
      return buildDemographicBarChartAll(demographics.byState);
    }
    return buildStateInsightChart(insights.byState);
  }, [demographics, insights.byState]);

  const byCountry = useMemo(() => {
    if (demographics) {
      return buildDemographicBarChartAll(demographics.byCountry);
    }
    return [];
  }, [demographics]);

  const byGender = useMemo(() => {
    if (demographics) {
      return buildDemographicDonutChart(demographics.byGender);
    }
    return buildGenderInsightChart(insights.byGender);
  }, [demographics, insights.byGender]);

  const byDesignation = useMemo(() => {
    if (demographics) {
      return buildDemographicBarChartAll(demographics.byDesignation);
    }
    return buildDesignationInsightChart(insights.byDesignation);
  }, [demographics, insights.byDesignation]);

  const feedbackByDay = useMemo(
    () => (eventFeedback ? buildFeedbackByDayChart(eventFeedback.byDay) : []),
    [eventFeedback],
  );

  const feedbackBySession = useMemo(
    () => (eventFeedback ? buildFeedbackBySessionChart(eventFeedback.bySession) : []),
    [eventFeedback],
  );

  const dayTrend = useMemo(() => {
    // Prefer live trend payload whenever it was fetched (even if all zeros).
    if (registrationTrendDays != null) {
      return buildRegistrationTrendChart(registrationTrendDays, trendGranularity);
    }
    return buildRegistrationTrendChart(insights.byDayLast7, trendGranularity);
  }, [insights.byDayLast7, registrationTrendDays, trendGranularity]);

  const attendanceMode = useMemo(() => {
    if (attendanceInsights) {
      if (attendanceDateFilter !== "all") {
        const day = attendanceInsights.attendanceModeByDate.find(
          (item) => item.date === attendanceDateFilter,
        );
        return buildAttendanceModeByDateChart(day);
      }
      return buildAttendanceModeSlicesChart(attendanceInsights.attendanceMode);
    }
    return buildAttendanceModeInsightChart(insights.byAttendanceMode);
  }, [attendanceInsights, attendanceDateFilter, insights.byAttendanceMode]);

  const attendanceDateOptions = useMemo(
    () => attendanceInsights?.attendanceModeByDate ?? [],
    [attendanceInsights],
  );

  const dayTotal = useMemo(() => dayTrend.reduce((sum, d) => sum + d.value, 0), [dayTrend]);

  const attendanceColors = useMemo(
    () =>
      attendanceMode.map((item) =>
        item.name === "Physical"
          ? COLORS.physical
          : item.name === "Virtual"
            ? COLORS.virtual
            : item.name === "Mixed"
              ? COLORS.mixed
              : COLORS.other,
      ),
    [attendanceMode],
  );
  const genderColors = useMemo(
    () => byGender.map((item, index) => item.color ?? COLORS.state[index % COLORS.state.length]),
    [byGender],
  );

  return (
    <div className="space-y-3">
    

      <div className="grid gap-3 lg:grid-cols-2">
        <InsightCard
          icon={CalendarDays}
          title="Registrations Over Time"
          description={TREND_DESCRIPTIONS[trendGranularity]}
          className="lg:col-span-2 max-w-2xl"
          filters={
            <ChartFilterGroup
              options={TREND_GRANULARITY_OPTIONS}
              value={trendGranularity}
              onChange={onTrendGranularityChange}
              className="shrink-0"
            />
          }
        >
          {registrationTrendLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading registrations…</p>
          ) : registrationTrendError ? (
            <p className="py-8 text-center text-sm text-destructive">{registrationTrendError}</p>
          ) : dayTrend.every((d) => d.value === 0) ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No registrations for this period.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">
                <span className="text-2xl font-semibold tabular-nums">{dayTotal}</span>
                <span className="ml-2 text-muted-foreground">{TREND_TOTAL_LABELS[trendGranularity]}</span>
              </p>
              <div className={cn("w-full", trendGranularity === "daily" ? "h-[150px]" : "h-[200px]")}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dayTrend}
                    margin={{
                      top: 18,
                      right: 8,
                      left: -18,
                      bottom: trendGranularity === "weekly" ? 36 : 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: trendGranularity === "weekly" ? 10 : 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={0}
                      textAnchor="middle"
                      height={trendGranularity === "weekly" ? 56 : 30}
                    />
                    <YAxis hide allowDecimals={false} />
                    <Tooltip content={<PeopleTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.35)" }} />
                    <Bar dataKey="value" fill={COLORS.day} radius={[6, 6, 0, 0]} maxBarSize={28}>
                      <LabelList
                        dataKey="value"
                        position="top"
                        className="fill-muted-foreground text-[10px]"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </InsightCard>

        <InsightCard
          icon={Monitor}
          title="How people will attend"
          description="Physical, Virtual, and Mixed only. Filter by event day when available."
          filters={
            attendanceDateOptions.length > 0 ? (
              <Select value={attendanceDateFilter} onValueChange={onAttendanceDateFilterChange}>
                <SelectTrigger className="h-8 w-[9.5rem] text-xs" aria-label="Attendance day">
                  <SelectValue placeholder="All days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All days</SelectItem>
                  {attendanceDateOptions.map((day) => (
                    <SelectItem key={day.date} value={day.date}>
                      {formatRegistrationIntervalDayLabel(day.date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null
          }
        >
          {attendanceInsightsLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading attendance…</p>
          ) : attendanceInsightsError ? (
            <p className="py-8 text-center text-sm text-destructive">{attendanceInsightsError}</p>
          ) : attendanceMode.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No attendance data yet.</p>
          ) : (
            <DonutWithLegend
              data={attendanceMode}
              colors={attendanceColors}
              centerLabel="registrations"
            />
          )}
        </InsightCard>

        <InsightCard
          icon={UserRound}
          title="Gender split"
          description="How registrations break down by gender."
        >
          {demographicsLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading gender data…</p>
          ) : demographicsError ? (
            <p className="py-8 text-center text-sm text-destructive">{demographicsError}</p>
          ) : byGender.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No gender data yet.</p>
          ) : (
            <DonutWithLegend data={byGender} colors={genderColors} centerLabel="registrations" />
          )}
        </InsightCard>

        <InsightCard
          icon={MapPin}
          title="Registered Users from India by State"
          description="All states by registration count. Scroll to see the full list."
        >
          {demographicsLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading state data…</p>
          ) : demographicsError ? (
            <p className="py-8 text-center text-sm text-destructive">{demographicsError}</p>
          ) : byState.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No state data yet.</p>
          ) : (
            <ScrollableDemographicBarChart
              data={byState}
              yAxisWidth={92}
              maxViewportHeight={240}
            />
          )}
        </InsightCard>

        <InsightCard
          icon={Globe2}
          title="Registered Users by Country"
          description="Registrations by country. Scroll if the list is long."
        >
          {demographicsLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading country data…</p>
          ) : demographicsError ? (
            <p className="py-8 text-center text-sm text-destructive">{demographicsError}</p>
          ) : byCountry.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No country data yet.</p>
          ) : (
            <ScrollableDemographicBarChart
              data={byCountry}
              yAxisWidth={92}
              maxViewportHeight={240}
            />
          )}
        </InsightCard>

        <InsightCard
          icon={Briefcase}
          title="Roles & designations"
          description="All roles by registration count. Scroll to see every designation."
        >
          {demographicsLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading designation data…</p>
          ) : demographicsError ? (
            <p className="py-8 text-center text-sm text-destructive">{demographicsError}</p>
          ) : byDesignation.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No designation data yet.</p>
          ) : (
            <ScrollableDemographicBarChart
              data={byDesignation}
              yAxisWidth={128}
              tickFontSize={11}
              maxViewportHeight={280}
            />
          )}
        </InsightCard>

        <InsightCard
          icon={CalendarDays}
          title="Feedback by day"
          description="Total feedback responses for each event day (with date)."
        >
          {eventFeedbackLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading feedback…</p>
          ) : eventFeedbackError ? (
            <p className="py-8 text-center text-sm text-destructive">{eventFeedbackError}</p>
          ) : feedbackByDay.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No feedback by day yet.</p>
          ) : (
            <ScrollableDemographicBarChart
              data={feedbackByDay}
              yAxisWidth={110}
              maxViewportHeight={200}
              tooltip="feedback"
              defaultBarFill="#3b82f6"
            />
          )}
        </InsightCard>

        <InsightCard
          icon={MessageSquareText}
          title="Feedback by sessions"
          description="Total feedback responses per session. Scroll to see every session."
        >
          {eventFeedbackLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading feedback…</p>
          ) : eventFeedbackError ? (
            <p className="py-8 text-center text-sm text-destructive">{eventFeedbackError}</p>
          ) : feedbackBySession.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No session feedback yet.</p>
          ) : (
            <ScrollableDemographicBarChart
              data={feedbackBySession}
              yAxisWidth={140}
              tickFontSize={11}
              maxViewportHeight={280}
              tooltip="feedback"
              defaultBarFill="#a855f7"
            />
          )}
        </InsightCard>
      </div>
    </div>
  );
}

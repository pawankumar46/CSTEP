"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, MessageSquareText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildFeedbackByDayChart,
  buildFeedbackBySessionChart,
} from "@/lib/analytics-mappers";
import { cn } from "@/lib/utils";
import type { DistributionDataPoint, EventFeedbackAnalytics } from "@/types";

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 10,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
};

const SCROLLABLE_BAR_ROW_HEIGHT = 28;

function SessionFeedbackBarList({
  data,
  maxViewportHeight = 200,
}: {
  data: DistributionDataPoint[];
  maxViewportHeight?: number;
}) {
  const maxValue = Math.max(...data.map((entry) => entry.value), 1);

  return (
    <div
      className="w-full space-y-1.5 overflow-y-auto overflow-x-hidden pr-1 scroll-smooth"
      style={{ maxHeight: maxViewportHeight }}
    >
      {data.map((item, index) => {
        const widthPercent = Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0);
        const barColor = item.color ?? "#a855f7";

        return (
          <div
            key={`${item.name}-${index}`}
            className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <p
                className="min-w-0 flex-1 text-[11px] font-medium leading-tight text-foreground line-clamp-1"
                title={item.name}
              >
                {item.name}
              </p>
              <p className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{item.value}</span>
                {item.secondaryValue != null && item.secondaryValue > 0 ? (
                  <span> · avg {item.secondaryValue}</span>
                ) : null}
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
          </div>
        );
      })}
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

function FeedbackBarChart({
  data,
  yAxisWidth,
  tickFontSize = 12,
  maxViewportHeight = 160,
  defaultBarFill,
}: {
  data: DistributionDataPoint[];
  yAxisWidth: number;
  tickFontSize?: number;
  maxViewportHeight?: number;
  defaultBarFill?: string;
}) {
  const chartHeight = Math.max(data.length * SCROLLABLE_BAR_ROW_HEIGHT + 4, 72);

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
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={yAxisWidth}
              tick={{ fontSize: tickFontSize, fill: "hsl(var(--foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<FeedbackCountTooltip />}
              cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
            />
            <Bar
              dataKey="value"
              fill={defaultBarFill ?? "#3b82f6"}
              radius={[0, 8, 8, 0]}
              maxBarSize={14}
              background={{ fill: "hsl(var(--muted) / 0.35)", radius: 8 }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={entry.color ?? defaultBarFill ?? "#3b82f6"}
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
    <Card className={cn("overflow-hidden shadow-sm", className)}>
      <CardHeader className="space-y-1 pb-2 pt-4">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 space-y-0.5">
            <CardTitle className="text-sm font-semibold tracking-tight">{title}</CardTitle>
            <CardDescription className="text-[11px] leading-snug">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">{children}</CardContent>
    </Card>
  );
}

interface EventFeedbackChartsProps {
  eventFeedback?: EventFeedbackAnalytics | null;
  eventFeedbackLoading?: boolean;
  eventFeedbackError?: string | null;
}

export function EventFeedbackCharts({
  eventFeedback,
  eventFeedbackLoading,
  eventFeedbackError,
}: EventFeedbackChartsProps) {
  const feedbackByDay = useMemo(
    () => (eventFeedback ? buildFeedbackByDayChart(eventFeedback.byDay) : []),
    [eventFeedback],
  );

  const feedbackBySession = useMemo(
    () => (eventFeedback ? buildFeedbackBySessionChart(eventFeedback.bySession) : []),
    [eventFeedback],
  );

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <InsightCard
        icon={CalendarDays}
        title="Feedback by day"
        description="Total feedback responses for each event day (with date)."
      >
        {eventFeedbackLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading feedback…</p>
        ) : eventFeedbackError ? (
          <p className="py-4 text-center text-sm text-destructive">{eventFeedbackError}</p>
        ) : feedbackByDay.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No feedback by day yet.</p>
        ) : (
          <FeedbackBarChart
            data={feedbackByDay}
            yAxisWidth={110}
            maxViewportHeight={160}
            defaultBarFill="#3b82f6"
          />
        )}
      </InsightCard>

      <InsightCard
        icon={MessageSquareText}
        title="Feedback by sessions"
        description="Responses per session — scroll for more. Hover a title to read the full session name."
      >
        {eventFeedbackLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading feedback…</p>
        ) : eventFeedbackError ? (
          <p className="py-4 text-center text-sm text-destructive">{eventFeedbackError}</p>
        ) : feedbackBySession.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No session feedback yet.</p>
        ) : (
          <SessionFeedbackBarList data={feedbackBySession} maxViewportHeight={200} />
        )}
      </InsightCard>
    </div>
  );
}

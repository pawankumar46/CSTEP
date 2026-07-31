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

const SCROLLABLE_BAR_ROW_HEIGHT = 36;

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
  maxViewportHeight = 240,
  defaultBarFill,
}: {
  data: DistributionDataPoint[];
  yAxisWidth: number;
  tickFontSize?: number;
  maxViewportHeight?: number;
  defaultBarFill?: string;
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
              maxBarSize={18}
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
    <div className="grid gap-4 lg:grid-cols-2">
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
          <FeedbackBarChart
            data={feedbackByDay}
            yAxisWidth={110}
            maxViewportHeight={200}
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
          <FeedbackBarChart
            data={feedbackBySession}
            yAxisWidth={140}
            tickFontSize={11}
            maxViewportHeight={280}
            defaultBarFill="#a855f7"
          />
        )}
      </InsightCard>
    </div>
  );
}

import type { ExportColumn } from "@/lib/export-utils";

export interface AnalyticsDistributionRow {
  category: string;
  count: number;
  sharePercent: number;
}

export interface AnalyticsMetricRow {
  metric: string;
  value: string | number;
}

export const ANALYTICS_DISTRIBUTION_EXPORT_COLUMNS: ExportColumn<AnalyticsDistributionRow>[] = [
  { header: "Category", value: (row) => row.category },
  { header: "Count", value: (row) => row.count },
  { header: "Share (%)", value: (row) => row.sharePercent },
];

export const ANALYTICS_METRIC_EXPORT_COLUMNS: ExportColumn<AnalyticsMetricRow>[] = [
  { header: "Metric", value: (row) => row.metric },
  { header: "Value", value: (row) => row.value },
];

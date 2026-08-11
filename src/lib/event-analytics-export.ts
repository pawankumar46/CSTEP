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

export interface AttendanceDayModeRow {
  date: string;
  physical: number;
  virtual: number;
  total: number;
}

export const ATTENDANCE_DAY_MODE_EXPORT_COLUMNS: ExportColumn<AttendanceDayModeRow>[] = [
  { header: "Date", value: (row) => row.date },
  { header: "Physical", value: (row) => row.physical },
  { header: "Virtual", value: (row) => row.virtual },
  { header: "Total", value: (row) => row.total },
];

export interface ParticipationTimeExportRow {
  userName: string;
  email: string;
  loggedIn: string;
  loggedOut: string;
  duration: string;
}

export const PARTICIPATION_TIME_EXPORT_COLUMNS: ExportColumn<ParticipationTimeExportRow>[] = [
  { header: "Name", value: (row) => row.userName },
  { header: "Email", value: (row) => row.email },
  { header: "Joined at", value: (row) => row.loggedIn },
  { header: "Left at", value: (row) => row.loggedOut },
  { header: "Duration", value: (row) => row.duration },
];

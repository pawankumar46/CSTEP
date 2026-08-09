/**
 * Live Analytics WebSocket — connection contract.
 * @example ws(s)://{api-host}/ws/analytics/{eventId}/?token={accessToken}&visuals=statewise_login,...
 * Path: `event_id`. Query: `token`, `visuals` (comma-separated). No post-connect subscribe message.
 *
 * Server push shape:
 * `{ "type": "update", "data": { event_id, generated_at, statewise_login, … } }`
 */

import type { DistributionDataPoint, EventFeedbackAnalytics, StreamingSummary } from "@/types";
import type {
  SessionParticipationRateRow,
  SessionParticipationTimeRow,
} from "@/lib/participation-session-analytics";

export type LiveAnalyticsConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface LiveAnalyticsModeSeries {
  all: DistributionDataPoint[];
  physical: DistributionDataPoint[];
  virtual: DistributionDataPoint[];
}

export interface LiveAnalyticsNoShowDay {
  dayId: string;
  dayNumber: number;
  registered: number;
  attended: number;
  noShow: number;
}

export interface LiveAnalyticsParticipationSnapshot {
  timeRows: SessionParticipationTimeRow[];
  /** Dynamic minute-bucket column labels from WS (e.g. "5", "10", …). */
  timeBucketLabels: string[];
  rateRows: SessionParticipationRateRow[];
  rateSlotLabels: string[];
}

/** Mapped snapshot from WS `type: "update"` payloads. */
export interface LiveAnalyticsSnapshot {
  receivedAt: string;
  eventId?: string;
  generatedAt?: string;
  statewiseLogin: LiveAnalyticsModeSeries;
  countrywiseLoginVirtual: DistributionDataPoint[];
  daywiseLogin: DistributionDataPoint[];
  sessionMaxVirtual: DistributionDataPoint[];
  noShow: LiveAnalyticsNoShowDay[];
  feedback: EventFeedbackAnalytics | null;
  participation: LiveAnalyticsParticipationSnapshot | null;
  streamingSummary: Partial<StreamingSummary> | null;
  /** Full payload retained for debugging. */
  raw: unknown;
}

/**
 * Live Analytics WebSocket — connection contract.
 * @example wss://{api-host}/ws/analytics/{eventId}/?token={access_token}
 */

import type { DistributionDataPoint, StreamingSummary } from "@/types";

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

/** Best-effort mapped snapshot from WS JSON (shape may evolve with BE). */
export interface LiveAnalyticsSnapshot {
  receivedAt: string;
  eventId?: string;
  statewiseLogin: LiveAnalyticsModeSeries;
  countrywiseLoginVirtual: DistributionDataPoint[];
  sessionMaxVirtual: DistributionDataPoint[];
  streamingSummary: Partial<StreamingSummary> | null;
  /** Unrecognized / full payload retained for debugging and future fields. */
  raw: unknown;
}

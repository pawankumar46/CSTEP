import { getWebSocketBaseUrl } from "@/lib/env";

/** Visuals requested via the `visuals` query param (comma-separated). */
export const LIVE_ANALYTICS_VISUALS = [
  "statewise_login",
  "countrywise_login",
  "daywise_login",
  "session_wise_max_virtual",
  "no_show",
  "session_wise_feedback",
  "daywise_feedback",
  "participation_rate",
  "participation_time",
] as const;

export type LiveAnalyticsVisual = (typeof LIVE_ANALYTICS_VISUALS)[number];

/**
 * Build `…/ws/analytics/{eventId}/?token=…&visuals=…`
 * Visuals are query params only — no subscribe message after connect.
 */
export function buildLiveAnalyticsWebSocketUrl(
  eventId: string,
  accessToken: string,
): string {
  const id = encodeURIComponent(String(eventId).trim());
  if (!id) {
    throw new Error("Live analytics requires an event id.");
  }
  const token = accessToken.trim().replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new Error("Live analytics requires an access token.");
  }
  const base = getWebSocketBaseUrl();
  const url = new URL(`${base}/ws/analytics/${id}/`);
  url.searchParams.set("token", token);
  url.searchParams.set("visuals", LIVE_ANALYTICS_VISUALS.join(","));
  return url.toString();
}

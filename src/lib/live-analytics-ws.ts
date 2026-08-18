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
  "participation_duration",
] as const;

export type LiveAnalyticsParticipationAction = "participation_time" | "participation_rate";

export type LiveAnalyticsParticipationRequest = {
  action: LiveAnalyticsParticipationAction;
  day_id?: number;
};

/** `dayId` omitted or `"all"` → `{ action }` only; otherwise includes numeric `day_id`. */
export function buildParticipationDayRequest(
  action: LiveAnalyticsParticipationAction,
  dayId?: string | number | null,
): LiveAnalyticsParticipationRequest {
  if (dayId == null || String(dayId).trim() === "" || String(dayId) === "all") {
    return { action };
  }
  const raw = String(dayId).trim();
  if (!/^\d+$/.test(raw)) return { action };
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) return { action };
  return { action, day_id: id };
}

/**
 * Build `…/ws/analytics/{eventId}/?token=…&visuals=…`
 * Visuals are query params. Participation Time / Rate day filters also send
 * `{ action: "participation_time"|"participation_rate", day_id? }` after connect (`day_id` omitted for All).
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

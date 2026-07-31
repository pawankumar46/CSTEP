import { getWebSocketBaseUrl } from "@/lib/env";

/** Build `…/ws/analytics/{eventId}/?token=…` for live analytics. */
export function buildLiveAnalyticsWebSocketUrl(eventId: string, accessToken: string): string {
  const id = encodeURIComponent(String(eventId).trim());
  const base = getWebSocketBaseUrl();
  const url = new URL(`${base}/ws/analytics/${id}/`);
  url.searchParams.set("token", accessToken);
  return url.toString();
}

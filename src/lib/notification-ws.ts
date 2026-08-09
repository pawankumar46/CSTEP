import { getWebSocketBaseUrl } from "@/lib/env";

/**
 * Build `…/ws/notifications/?token=…`
 * JWT auth via query param (same pattern as analytics / chat sockets).
 */
export function buildNotificationsWebSocketUrl(accessToken: string): string {
  const token = accessToken.trim().replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new Error("Notifications WebSocket requires an access token.");
  }
  const base = getWebSocketBaseUrl();
  const url = new URL(`${base}/ws/notifications/`);
  url.searchParams.set("token", token);
  return url.toString();
}

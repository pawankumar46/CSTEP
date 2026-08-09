import { getWebSocketBaseUrl } from "@/lib/env";

/**
 * Build `…/ws/events/{eventId}/?token=…`
 * Used while the viewer is on `/streaming` for presence heartbeats.
 */
export function buildEventPresenceWebSocketUrl(
  eventId: string,
  accessToken: string,
): string {
  const id = encodeURIComponent(String(eventId).trim());
  if (!id) {
    throw new Error("Event presence requires an event id.");
  }
  const token = accessToken.trim().replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new Error("Event presence requires an access token.");
  }
  const base = getWebSocketBaseUrl();
  const url = new URL(`${base}/ws/events/${id}/`);
  url.searchParams.set("token", token);
  return url.toString();
}

/** How often to send `{"type":"heartbeat"}` while watching. */
export const EVENT_PRESENCE_HEARTBEAT_MS = 15_000;

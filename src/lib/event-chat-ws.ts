import { getWebSocketBaseUrl } from "@/lib/env";

/**
 * Build `…/ws/events/{eventId}/chat/?token=…`
 * Auth is query-param only — no post-connect handshake.
 */
export function buildEventChatWebSocketUrl(
  eventId: string,
  accessToken: string,
): string {
  const id = encodeURIComponent(String(eventId).trim());
  if (!id) {
    throw new Error("Live chat requires an event id.");
  }
  const token = accessToken.trim().replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new Error("Live chat requires an access token.");
  }
  const base = getWebSocketBaseUrl();
  const url = new URL(`${base}/ws/events/${id}/chat/`);
  url.searchParams.set("token", token);
  return url.toString();
}

export const CHAT_MAX_MESSAGE_LENGTH = 500;
export const CHAT_EDIT_WINDOW_MS = 15 * 60 * 1000;
export const CHAT_OWNER_DELETE_WINDOW_MS = 60 * 60 * 1000;

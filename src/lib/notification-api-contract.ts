/**
 * Django notifications API + WebSocket contract
 * (from notifications ViewSet / routing).
 *
 * REST (via apiClient → NEXT_PUBLIC_API_URL):
 * - GET  /notification/notification/              → Notification[]
 * - GET  /notification/notification/?unread=true  → unread only
 * - GET  /notification/notification/unread-count/ → { unread_count }
 * - POST /notification/notification/:id/read/     → Notification
 * - POST /notification/notification/read-all/     → { marked_read }
 *
 * WebSocket:
 * - `{WS}/ws/notifications/?token=` → frames with `{ notification: ApiNotification }`
 */

export type ApiNotificationType =
  | "REGISTRATION_CONFIRMED"
  | "REGISTRATION_STATUS_UPDATE"
  | "ASSISTANCE_STATUS_UPDATE"
  | "EVENT_REMINDER"
  | "BROADCAST_LIVE"
  | "GENERAL";

export interface ApiNotification {
  id: number;
  notification_type: ApiNotificationType | string;
  title: string;
  body: string;
  is_read: boolean;
  event: number | null;
  created_at: string;
}

export interface ApiUnreadCount {
  unread_count: number;
}

export interface ApiMarkAllReadResult {
  marked_read: number;
}

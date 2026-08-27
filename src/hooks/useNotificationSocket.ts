"use client";

import { useEffect, useRef } from "react";
import {
  AUTH_SESSION_REFRESHED_EVENT,
  getAccessToken,
} from "@/lib/auth-session";
import { buildNotificationsWebSocketUrl } from "@/lib/notification-ws";
import { mapIncomingNotification } from "@/services/notification.service";
import type { Notification, UserRole } from "@/types";

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 15_000;

/**
 * Connects to `/ws/notifications/?token=` and calls `onNotification`
 * for each pushed `{ notification: … }` frame.
 */
export function useNotificationSocket(
  onNotification: (notification: Notification) => void,
  enabled: boolean = true,
  role?: UserRole,
) {
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;
  const roleRef = useRef(role);
  roleRef.current = role;

  useEffect(() => {
    if (!enabled) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let backoffMs = RECONNECT_BASE_MS;
    let closedByEffect = false;

    const clearReconnect = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const connect = () => {
      if (closedByEffect) return;

      const token = getAccessToken();
      if (!token) return;

      let url: string;
      try {
        url = buildNotificationsWebSocketUrl(token);
      } catch {
        return;
      }

      try {
        socket?.close();
      } catch {
        // ignore
      }

      socket = new WebSocket(url);

      socket.onopen = () => {
        backoffMs = RECONNECT_BASE_MS;
      };

      socket.onmessage = (event) => {
        try {
          const data: unknown =
            typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          if (!data || typeof data !== "object") return;
          const payload = (data as { notification?: unknown }).notification;
          const mapped = mapIncomingNotification(payload, roleRef.current);
          if (mapped) onNotificationRef.current(mapped);
        } catch {
          // ignore malformed frames
        }
      };

      socket.onclose = () => {
        socket = null;
        if (closedByEffect) return;
        reconnectTimer = setTimeout(connect, backoffMs);
        backoffMs = Math.min(backoffMs * 2, RECONNECT_MAX_MS);
      };
    };

    connect();

    const onSessionRefreshed = () => {
      if (closedByEffect) return;
      backoffMs = RECONNECT_BASE_MS;
      clearReconnect();
      connect();
    };

    window.addEventListener(AUTH_SESSION_REFRESHED_EVENT, onSessionRefreshed);

    return () => {
      closedByEffect = true;
      window.removeEventListener(AUTH_SESSION_REFRESHED_EVENT, onSessionRefreshed);
      clearReconnect();
      try {
        socket?.close();
      } catch {
        // ignore
      }
      socket = null;
    };
  }, [enabled]);
}

"use client";

import { useEffect, useRef } from "react";
import {
  AUTH_SESSION_REFRESHED_EVENT,
  getAccessToken,
} from "@/lib/auth-session";
import {
  buildEventPresenceWebSocketUrl,
  EVENT_PRESENCE_HEARTBEAT_MS,
} from "@/lib/event-presence-ws";

const RECONNECT_BASE_MS = 1500;
const RECONNECT_MAX_MS = 20000;

/**
 * Presence WebSocket while the user is watching the live stream.
 * URL: `{ws|wss}://{host}/ws/events/{eventId}/?token=…`
 * Sends `{"type":"heartbeat"}` on connect and every 15s while the tab is visible.
 */
export function useEventPresenceSocket(eventId: string | null | undefined) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closedByUserRef = useRef(false);

  useEffect(() => {
    closedByUserRef.current = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const clearHeartbeat = () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };

    const sendHeartbeat = () => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        socket.send(JSON.stringify({ type: "heartbeat" }));
      } catch {
        // ignore send races during close
      }
    };

    const startHeartbeat = () => {
      clearHeartbeat();
      sendHeartbeat();
      heartbeatTimerRef.current = setInterval(sendHeartbeat, EVENT_PRESENCE_HEARTBEAT_MS);
    };

    const closeSocket = () => {
      clearHeartbeat();
      const socket = socketRef.current;
      socketRef.current = null;
      if (!socket) return;
      try {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      } catch {
        // ignore close races
      }
    };

    if (!eventId) {
      closedByUserRef.current = true;
      clearReconnectTimer();
      closeSocket();
      return;
    }

    const connect = () => {
      if (closedByUserRef.current) return;

      const token = getAccessToken();
      if (!token) return;

      clearReconnectTimer();
      closeSocket();

      let url: string;
      try {
        url = buildEventPresenceWebSocketUrl(eventId, token);
      } catch {
        return;
      }

      try {
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          reconnectAttemptRef.current = 0;
          startHeartbeat();
        };

        socket.onmessage = () => {
          // Presence socket is outbound heartbeats; ignore server payloads for now.
        };

        socket.onerror = () => {
          // Reconnect handled in onclose
        };

        socket.onclose = (event) => {
          clearHeartbeat();
          socketRef.current = null;
          if (closedByUserRef.current) return;

          if (event.code === 4001 || event.code === 4004) {
            return;
          }

          const attempt = reconnectAttemptRef.current;
          reconnectAttemptRef.current = attempt + 1;
          const delay = Math.min(
            RECONNECT_MAX_MS,
            RECONNECT_BASE_MS * 2 ** Math.min(attempt, 4),
          );
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, delay);
        };
      } catch {
        // ignore connect failures; reconnect path covers retries
      }
    };

    connect();

    const onVisibilityChange = () => {
      if (!document.hidden) sendHeartbeat();
    };

    const onSessionRefreshed = () => {
      if (closedByUserRef.current || !eventId) return;
      reconnectAttemptRef.current = 0;
      connect();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener(AUTH_SESSION_REFRESHED_EVENT, onSessionRefreshed);

    return () => {
      closedByUserRef.current = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener(AUTH_SESSION_REFRESHED_EVENT, onSessionRefreshed);
      clearReconnectTimer();
      closeSocket();
    };
  }, [eventId]);
}

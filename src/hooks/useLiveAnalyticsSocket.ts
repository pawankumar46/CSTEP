"use client";

import { useEffect, useRef } from "react";
import {
  AUTH_SESSION_REFRESHED_EVENT,
  getAccessToken,
} from "@/lib/auth-session";
import { mapLiveAnalyticsPayload } from "@/lib/live-analytics-mappers";
import { buildLiveAnalyticsWebSocketUrl } from "@/lib/live-analytics-ws";
import { useLiveAnalyticsStore } from "@/store/useLiveAnalyticsStore";

const RECONNECT_BASE_MS = 1500;
const RECONNECT_MAX_MS = 20000;

/**
 * Keeps a live analytics WebSocket open for the selected event.
 * URL: `{ws|wss}://{API_HOST}/ws/analytics/{eventId}/?token={access_token}`
 */
export function useLiveAnalyticsSocket(eventId: string | null | undefined) {
  const setConnecting = useLiveAnalyticsStore((s) => s.setConnecting);
  const setConnected = useLiveAnalyticsStore((s) => s.setConnected);
  const setDisconnected = useLiveAnalyticsStore((s) => s.setDisconnected);
  const setError = useLiveAnalyticsStore((s) => s.setError);
  const setSnapshot = useLiveAnalyticsStore((s) => s.setSnapshot);
  const reset = useLiveAnalyticsStore((s) => s.reset);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByUserRef = useRef(false);

  useEffect(() => {
    closedByUserRef.current = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const closeSocket = () => {
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
      reset();
      return;
    }

    const connect = () => {
      if (closedByUserRef.current) return;

      const token = getAccessToken();
      if (!token) {
        setError("Sign in required for live analytics.");
        return;
      }

      clearReconnectTimer();
      closeSocket();

      let url: string;
      try {
        url = buildLiveAnalyticsWebSocketUrl(eventId, token);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid live analytics URL");
        return;
      }

      setConnecting(eventId);

      try {
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          reconnectAttemptRef.current = 0;
          setConnected();
        };

        socket.onmessage = (event) => {
          try {
            const parsed: unknown =
              typeof event.data === "string" ? JSON.parse(event.data) : event.data;
            setSnapshot(mapLiveAnalyticsPayload(parsed));
          } catch (err) {
            setError(
              err instanceof Error
                ? `Invalid live analytics message: ${err.message}`
                : "Invalid live analytics message",
            );
          }
        };

        socket.onerror = () => {
          // Browser fires close after error; avoid double messaging.
          setError("Live analytics connection error");
        };

        socket.onclose = () => {
          socketRef.current = null;
          if (closedByUserRef.current) {
            setDisconnected();
            return;
          }

          setDisconnected();
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to open live analytics socket");
      }
    };

    connect();

    const onSessionRefreshed = () => {
      if (closedByUserRef.current || !eventId) return;
      reconnectAttemptRef.current = 0;
      connect();
    };

    window.addEventListener(AUTH_SESSION_REFRESHED_EVENT, onSessionRefreshed);

    return () => {
      closedByUserRef.current = true;
      window.removeEventListener(AUTH_SESSION_REFRESHED_EVENT, onSessionRefreshed);
      clearReconnectTimer();
      closeSocket();
    };
  }, [
    eventId,
    reset,
    setConnected,
    setConnecting,
    setDisconnected,
    setError,
    setSnapshot,
  ]);
}

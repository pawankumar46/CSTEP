"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  AUTH_SESSION_REFRESHED_EVENT,
  getAccessToken,
} from "@/lib/auth-session";
import {
  extractLiveAnalyticsErrors,
  isLiveAnalyticsControlMessage,
  mapLiveAnalyticsPayload,
  mergeLiveAnalyticsSnapshot,
} from "@/lib/live-analytics-mappers";
import { buildLiveAnalyticsWebSocketUrl } from "@/lib/live-analytics-ws";
import { useLiveAnalyticsStore } from "@/store/useLiveAnalyticsStore";

const RECONNECT_BASE_MS = 1500;
const RECONNECT_MAX_MS = 20000;

/**
 * Live analytics WebSocket for the selected event.
 * URL: `{ws|wss}://{API_HOST}/ws/analytics/{eventId}/?token=…&visuals=…`
 * Day filters send `{ action: "participation_time"|"participation_rate", day_id }`.
 */
export function useLiveAnalyticsSocket(eventId: string | null | undefined) {
  const setConnecting = useLiveAnalyticsStore((s) => s.setConnecting);
  const setConnected = useLiveAnalyticsStore((s) => s.setConnected);
  const setDisconnected = useLiveAnalyticsStore((s) => s.setDisconnected);
  const setError = useLiveAnalyticsStore((s) => s.setError);
  const setSnapshot = useLiveAnalyticsStore((s) => s.setSnapshot);
  const setSendJson = useLiveAnalyticsStore((s) => s.setSendJson);
  const reset = useLiveAnalyticsStore((s) => s.reset);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByUserRef = useRef(false);

  const sendJson = useCallback((payload: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(payload));
    return true;
  }, []);

  useEffect(() => {
    setSendJson(sendJson);
    return () => setSendJson(() => false);
  }, [sendJson, setSendJson]);

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
            if (isLiveAnalyticsControlMessage(parsed)) return;
            const wsErrors = extractLiveAnalyticsErrors(parsed);
            if (wsErrors.length > 0) {
              setError(wsErrors[0]);
            }
            const incoming = mapLiveAnalyticsPayload(parsed);
            const previous = useLiveAnalyticsStore.getState().snapshot;
            setSnapshot(mergeLiveAnalyticsSnapshot(previous, incoming, parsed));
          } catch (err) {
            setError(
              err instanceof Error
                ? `Invalid live analytics message: ${err.message}`
                : "Invalid live analytics message",
            );
          }
        };

        socket.onerror = () => {
          setError("Live analytics connection error");
        };

        socket.onclose = (event) => {
          socketRef.current = null;
          if (closedByUserRef.current) {
            setDisconnected();
            return;
          }

          if (event.code === 4001 || event.code === 4401 || event.code === 1008) {
            setError("Live analytics authentication failed. Sign in again.");
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
    setSendJson,
  ]);
}

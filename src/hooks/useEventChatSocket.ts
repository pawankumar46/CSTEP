"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUTH_SESSION_REFRESHED_EVENT,
  getAccessToken,
} from "@/lib/auth-session";
import { parseEventChatServerMessage } from "@/lib/event-chat-mappers";
import {
  buildEventChatWebSocketUrl,
  CHAT_MAX_MESSAGE_LENGTH,
} from "@/lib/event-chat-ws";
import type { ChatReactionCounts, ChatReactionType, LiveChatMessage } from "@/types";

const RECONNECT_BASE_MS = 1500;
const RECONNECT_MAX_MS = 20000;

const EMPTY_COUNTS: ChatReactionCounts = { like: 0, love: 0, clap: 0 };

export type EventChatStatus = "idle" | "connecting" | "connected" | "disconnected";

function upsertMessage(list: LiveChatMessage[], next: LiveChatMessage): LiveChatMessage[] {
  const index = list.findIndex((item) => item.id === next.id);
  if (index === -1) return [...list, next];
  const copy = [...list];
  copy[index] = next;
  return copy;
}

/**
 * Event live chat WebSocket.
 * URL: `{ws|wss}://{host}/ws/events/{eventId}/chat/?token=…`
 */
export function useEventChatSocket(eventId: string | null | undefined) {
  const [status, setStatus] = useState<EventChatStatus>("idle");
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [reactionCounts, setReactionCounts] = useState<ChatReactionCounts>(EMPTY_COUNTS);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByUserRef = useRef(false);

  const sendJson = useCallback((payload: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError("Chat is not connected yet.");
      return false;
    }
    socket.send(JSON.stringify(payload));
    return true;
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const message = text.trim();
      if (!message) return false;
      if (message.length > CHAT_MAX_MESSAGE_LENGTH) {
        setError(`Message too long (max ${CHAT_MAX_MESSAGE_LENGTH} chars).`);
        return false;
      }
      setError(null);
      return sendJson({ type: "message", message });
    },
    [sendJson],
  );

  const editMessage = useCallback(
    (messageId: string, text: string) => {
      const message = text.trim();
      if (!message) return false;
      if (message.length > CHAT_MAX_MESSAGE_LENGTH) {
        setError(`Message too long (max ${CHAT_MAX_MESSAGE_LENGTH} chars).`);
        return false;
      }
      setError(null);
      return sendJson({
        type: "edit",
        message_id: Number(messageId) || messageId,
        message,
      });
    },
    [sendJson],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      setError(null);
      return sendJson({
        type: "delete",
        message_id: Number(messageId) || messageId,
      });
    },
    [sendJson],
  );

  const sendReaction = useCallback(
    (reaction: ChatReactionType) => {
      setError(null);
      return sendJson({ type: "reaction", reaction });
    },
    [sendJson],
  );

  const clearError = useCallback(() => setError(null), []);

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
      setStatus("idle");
      setMessages([]);
      setReactionCounts(EMPTY_COUNTS);
      setError(null);
      return;
    }

    const connect = () => {
      if (closedByUserRef.current) return;

      const token = getAccessToken();
      if (!token) {
        setError("Sign in required for live chat.");
        setStatus("disconnected");
        return;
      }

      clearReconnectTimer();
      closeSocket();

      let url: string;
      try {
        url = buildEventChatWebSocketUrl(eventId, token);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid live chat URL");
        setStatus("disconnected");
        return;
      }

      setStatus("connecting");

      try {
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          reconnectAttemptRef.current = 0;
          setStatus("connected");
          setError(null);
        };

        socket.onmessage = (event) => {
          try {
            const parsed: unknown =
              typeof event.data === "string" ? JSON.parse(event.data) : event.data;
            const message = parseEventChatServerMessage(parsed);

            switch (message.type) {
              case "history":
                setMessages(message.messages.filter((item) => !item.isDeleted));
                break;
              case "reaction_counts":
                setReactionCounts(message.counts);
                break;
              case "message":
                setMessages((prev) => upsertMessage(prev, message.message));
                break;
              case "message_edited":
                setMessages((prev) => upsertMessage(prev, message.message));
                break;
              case "message_deleted":
                setMessages((prev) => prev.filter((item) => item.id !== message.messageId));
                break;
              case "error":
                setError(message.detail);
                break;
              default:
                break;
            }
          } catch (err) {
            setError(
              err instanceof Error
                ? `Invalid chat message: ${err.message}`
                : "Invalid chat message",
            );
          }
        };

        socket.onerror = () => {
          setError("Live chat connection error");
        };

        socket.onclose = (event) => {
          socketRef.current = null;
          if (closedByUserRef.current) {
            setStatus("disconnected");
            return;
          }

          if (event.code === 4001) {
            setError("Chat authentication failed. Sign in again.");
            setStatus("disconnected");
            return;
          }

          if (event.code === 4004) {
            setError("This event is not available for chat.");
            setStatus("disconnected");
            return;
          }

          setStatus("disconnected");
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
        setError(err instanceof Error ? err.message : "Failed to open live chat socket");
        setStatus("disconnected");
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
  }, [eventId]);

  return {
    status,
    messages,
    reactionCounts,
    error,
    clearError,
    sendMessage,
    editMessage,
    deleteMessage,
    sendReaction,
  };
}

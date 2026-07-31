import { create } from "zustand";
import type {
  LiveAnalyticsConnectionStatus,
  LiveAnalyticsSnapshot,
} from "@/lib/live-analytics-api-contract";
import { emptyLiveAnalyticsSnapshot } from "@/lib/live-analytics-mappers";

interface LiveAnalyticsState {
  eventId: string | null;
  status: LiveAnalyticsConnectionStatus;
  error: string | null;
  snapshot: LiveAnalyticsSnapshot | null;
  lastMessageAt: string | null;
  setConnecting: (eventId: string) => void;
  setConnected: () => void;
  setDisconnected: () => void;
  setError: (message: string) => void;
  setSnapshot: (snapshot: LiveAnalyticsSnapshot) => void;
  reset: () => void;
}

export const useLiveAnalyticsStore = create<LiveAnalyticsState>((set) => ({
  eventId: null,
  status: "idle",
  error: null,
  snapshot: null,
  lastMessageAt: null,

  setConnecting: (eventId) =>
    set({
      eventId,
      status: "connecting",
      error: null,
    }),

  setConnected: () =>
    set({
      status: "connected",
      error: null,
    }),

  setDisconnected: () =>
    set({
      status: "disconnected",
    }),

  setError: (message) =>
    set({
      status: "error",
      error: message,
    }),

  setSnapshot: (snapshot) =>
    set({
      snapshot,
      lastMessageAt: snapshot.receivedAt,
      status: "connected",
      error: null,
    }),

  reset: () =>
    set({
      eventId: null,
      status: "idle",
      error: null,
      snapshot: emptyLiveAnalyticsSnapshot(),
      lastMessageAt: null,
    }),
}));

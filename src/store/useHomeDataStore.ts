import { create } from "zustand";
import { getUserSummary } from "@/services/analytics.service";
import { getUpcomingEvents } from "@/services/event.service";
import type { UpcomingEvent } from "@/types";

let loadPromise: Promise<void> | null = null;

interface HomeDataState {
  upcomingEvents: UpcomingEvent[];
  upcomingLoaded: boolean;
  participantsRegistered: number | null;
  summaryLoaded: boolean;
  authKey: string | null;
  load: (authKey: string, options?: { force?: boolean }) => Promise<void>;
  invalidate: () => void;
}

export const useHomeDataStore = create<HomeDataState>((set, get) => ({
  upcomingEvents: [],
  upcomingLoaded: false,
  participantsRegistered: null,
  summaryLoaded: false,
  authKey: null,

  invalidate: () => {
    loadPromise = null;
    set({
      upcomingLoaded: false,
      summaryLoaded: false,
    });
  },

  load: async (authKey, options) => {
    const state = get();
    if (
      !options?.force &&
      state.authKey === authKey &&
      state.upcomingLoaded &&
      state.summaryLoaded
    ) {
      return;
    }

    if (state.authKey !== authKey) {
      loadPromise = null;
      set({
        authKey,
        upcomingEvents: [],
        upcomingLoaded: false,
        participantsRegistered: null,
        summaryLoaded: false,
      });
    } else if (options?.force) {
      loadPromise = null;
      set({
        upcomingLoaded: false,
        summaryLoaded: false,
      });
    }

    if (loadPromise) {
      return loadPromise;
    }

    loadPromise = (async () => {
      try {
        const [eventsResult, summaryResult] = await Promise.allSettled([
          getUpcomingEvents(),
          getUserSummary(),
        ]);

        set({
          upcomingEvents:
            eventsResult.status === "fulfilled" ? eventsResult.value : [],
          upcomingLoaded: true,
          participantsRegistered:
            summaryResult.status === "fulfilled"
              ? summaryResult.value.eventParticipants
              : null,
          summaryLoaded: true,
          authKey,
        });
      } finally {
        loadPromise = null;
      }
    })();

    return loadPromise;
  },
}));

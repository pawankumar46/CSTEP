import { create } from "zustand";
import { getUpcomingEvents } from "@/services/event.service";
import type { UpcomingEvent } from "@/types";

let loadPromise: Promise<void> | null = null;

interface HomeDataState {
  upcomingEvents: UpcomingEvent[];
  upcomingLoaded: boolean;
  authKey: string | null;
  load: (authKey: string, options?: { force?: boolean }) => Promise<void>;
  invalidate: () => void;
}

export const useHomeDataStore = create<HomeDataState>((set, get) => ({
  upcomingEvents: [],
  upcomingLoaded: false,
  authKey: null,

  invalidate: () => {
    loadPromise = null;
    set({
      upcomingLoaded: false,
    });
  },

  load: async (authKey, options) => {
    const state = get();
    if (!options?.force && state.authKey === authKey && state.upcomingLoaded) {
      return;
    }

    if (state.authKey !== authKey) {
      loadPromise = null;
      set({
        authKey,
        upcomingEvents: [],
        upcomingLoaded: false,
      });
    } else if (options?.force) {
      loadPromise = null;
      set({
        upcomingLoaded: false,
      });
    }

    if (loadPromise) {
      return loadPromise;
    }

    loadPromise = (async () => {
      try {
        const eventsResult = await getUpcomingEvents();

        set({
          upcomingEvents: eventsResult,
          upcomingLoaded: true,
          authKey,
        });
      } catch {
        set({
          upcomingEvents: [],
          upcomingLoaded: true,
          authKey,
        });
      } finally {
        loadPromise = null;
      }
    })();

    return loadPromise;
  },
}));

import { create } from "zustand";
import * as eventService from "@/services/event.service";
import type { CreateEventPayload, Event, UpdateEventPayload } from "@/types";

interface EventState {
  events: Event[];
  selectedEvent: Event | null;
  isLoading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  fetchEventById: (id: string) => Promise<void>;
  createEvent: (event: CreateEventPayload) => Promise<void>;
  updateEvent: (id: string, data: UpdateEventPayload) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  selectedEvent: null,
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const events = await eventService.getEvents();
      set({ events, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch events",
        isLoading: false,
      });
    }
  },

  fetchEventById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const event = await eventService.getEventById(id);
      set({ selectedEvent: event, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch event",
        isLoading: false,
      });
    }
  },

  createEvent: async (event) => {
    set({ error: null });
    try {
      await eventService.createEvent(event);
      await get().fetchEvents();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to create event" });
      throw err;
    }
  },

  updateEvent: async (id, data) => {
    set({ error: null });
    try {
      await eventService.updateEvent(id, data);
      await get().fetchEvents();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update event" });
      throw err;
    }
  },

  deleteEvent: async (id) => {
    set({ error: null });
    try {
      await eventService.deleteEvent(id);
      await get().fetchEvents();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to delete event" });
      throw err;
    }
  },
}));

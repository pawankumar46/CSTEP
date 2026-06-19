import { create } from "zustand";
import * as eventService from "@/services/event.service";
import type { CreateEventPayload, Event, EventListType, UpdateEventPayload } from "@/types";

interface EventState {
  events: Event[];
  selectedEvent: Event | null;
  eventListType: EventListType;
  isLoading: boolean;
  error: string | null;
  fetchEvents: (type?: EventListType) => Promise<void>;
  setEventListType: (type: EventListType) => void;
  fetchEventById: (id: string) => Promise<void>;
  createEvent: (event: CreateEventPayload) => Promise<void>;
  updateEvent: (id: string, data: UpdateEventPayload) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  selectedEvent: null,
  eventListType: "upcoming",
  isLoading: false,
  error: null,

  setEventListType: (type) => {
    set({ eventListType: type });
  },

  fetchEvents: async (type) => {
    const listType = type ?? get().eventListType;
    set({ isLoading: true, error: null, eventListType: listType, events: [] });
    try {
      const events = await eventService.getEvents(listType);
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
      await get().fetchEvents(get().eventListType);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to create event" });
      throw err;
    }
  },

  updateEvent: async (id, data) => {
    set({ error: null });
    try {
      await eventService.updateEvent(id, data);
      await get().fetchEvents(get().eventListType);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update event" });
      throw err;
    }
  },

  deleteEvent: async (id) => {
    set({ error: null });
    try {
      await eventService.deleteEvent(id);
      await get().fetchEvents(get().eventListType);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to delete event" });
      throw err;
    }
  },
}));

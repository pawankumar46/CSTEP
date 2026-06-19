import { create } from "zustand";
import * as lobbyService from "@/services/lobby.service";
import type { Registration, RegistrationStatus } from "@/types";

interface LobbyState {
  selectedEventId: string | null;
  registrations: Registration[];
  registrationsLoading: boolean;
  error: string | null;
  setSelectedEventId: (eventId: string | null) => void;
  fetchRegistrations: (eventId: string) => Promise<void>;
  updateStatus: (id: string, status: RegistrationStatus) => Promise<void>;
  updateTravelStatus: (id: string, status: "accepted" | "rejected") => Promise<void>;
  updateTranslationStatus: (id: string, status: "accepted" | "rejected") => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: RegistrationStatus) => Promise<void>;
  bulkUpdateTravelStatus: (ids: string[], status: "accepted" | "rejected") => Promise<void>;
  bulkUpdateTranslationStatus: (ids: string[], status: "accepted" | "rejected") => Promise<void>;
}

export const useLobbyStore = create<LobbyState>((set, get) => ({
  selectedEventId: null,
  registrations: [],
  registrationsLoading: false,
  error: null,

  setSelectedEventId: (eventId) => {
    set({ selectedEventId: eventId, registrations: [], error: null });
  },

  fetchRegistrations: async (eventId) => {
    set({ registrationsLoading: true, error: null, selectedEventId: eventId });
    try {
      const registrations = await lobbyService.getLobbyRegistrations(eventId);
      set({ registrations, registrationsLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch lobby data",
        registrations: [],
        registrationsLoading: false,
      });
    }
  },

  updateStatus: async (id, status) => {
    const eventId = get().selectedEventId;
    if (!eventId) throw new Error("No event selected");

    try {
      await lobbyService.updateLobbyStatus(id, status, eventId);
      const registrations = await lobbyService.getLobbyRegistrations(eventId);
      set({ registrations, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update status" });
      throw err;
    }
  },

  updateTravelStatus: async (id, status) => {
    const eventId = get().selectedEventId;
    if (!eventId) throw new Error("No event selected");

    try {
      await lobbyService.updateTravelStatus(id, status, eventId);
      const registrations = await lobbyService.getLobbyRegistrations(eventId);
      set({ registrations, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update travel status" });
      throw err;
    }
  },

  updateTranslationStatus: async (id, status) => {
    const eventId = get().selectedEventId;
    if (!eventId) throw new Error("No event selected");

    try {
      await lobbyService.updateTranslationStatus(id, status, eventId);
      const registrations = await lobbyService.getLobbyRegistrations(eventId);
      set({ registrations, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update translation status" });
      throw err;
    }
  },

  bulkUpdateStatus: async (ids, status) => {
    const eventId = get().selectedEventId;
    if (!eventId) throw new Error("No event selected");
    if (ids.length === 0) return;

    try {
      await lobbyService.bulkUpdateLobbyStatus(ids, status);
      const registrations = await lobbyService.getLobbyRegistrations(eventId);
      set({ registrations, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update lobby statuses" });
      throw err;
    }
  },

  bulkUpdateTravelStatus: async (ids, status) => {
    const eventId = get().selectedEventId;
    if (!eventId) throw new Error("No event selected");
    if (ids.length === 0) return;

    try {
      await lobbyService.bulkUpdateTravelStatus(ids, status);
      const registrations = await lobbyService.getLobbyRegistrations(eventId);
      set({ registrations, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update travel statuses" });
      throw err;
    }
  },

  bulkUpdateTranslationStatus: async (ids, status) => {
    const eventId = get().selectedEventId;
    if (!eventId) throw new Error("No event selected");
    if (ids.length === 0) return;

    try {
      await lobbyService.bulkUpdateTranslationStatus(ids, status);
      const registrations = await lobbyService.getLobbyRegistrations(eventId);
      set({ registrations, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update translation statuses" });
      throw err;
    }
  },
}));

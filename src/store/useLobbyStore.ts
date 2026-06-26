import { create } from "zustand";
import * as lobbyService from "@/services/lobby.service";
import type { AssistancePageResult } from "@/services/lobby.service";
import type {
  AccommodationEditFormValues,
  AdminAccommodationAssistFormValues,
} from "@/features/dashboard/admin-accommodation.schema";
import type { AdminMedicalAssistFormValues, MedicalEditFormValues } from "@/features/dashboard/admin-medical.schema";
import type { RegistrationEditFormValues } from "@/features/dashboard/admin-registration.schema";
import type { AdminTranslationAssistFormValues, TranslationEditFormValues } from "@/features/dashboard/admin-translation.schema";
import type { AdminTravelAssistFormValues, TravelEditFormValues } from "@/features/dashboard/admin-travel.schema";
import type {
  LobbyUserRegistrationFormValues,
  LobbyUserSignupFormValues,
} from "@/features/dashboard/admin-lobby-user.schema";
import type { AccommodationAssistanceRow, Event, MedicalAssistanceRow, Registration, RegistrationStatus, TranslationAssistanceRow, TravelAssistanceRow } from "@/types";

interface AssistancePaginationState {
  page: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const EMPTY_ASSISTANCE_PAGINATION: AssistancePaginationState = {
  page: 1,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

function toPaginationState(result: AssistancePageResult<unknown>): AssistancePaginationState {
  return {
    page: result.page,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.pageSize)),
    hasNext: result.hasNext,
    hasPrevious: result.hasPrevious,
  };
}

interface LobbyState {
  selectedEventId: string | null;
  registrations: Registration[];
  registrationsLoading: boolean;
  travelAssistance: TravelAssistanceRow[];
  travelAssistanceLoading: boolean;
  travelPagination: AssistancePaginationState;
  medicalAssistance: MedicalAssistanceRow[];
  medicalAssistanceLoading: boolean;
  medicalPagination: AssistancePaginationState;
  translationAssistance: TranslationAssistanceRow[];
  translationAssistanceLoading: boolean;
  translationPagination: AssistancePaginationState;
  accommodationAssistance: AccommodationAssistanceRow[];
  accommodationAssistanceLoading: boolean;
  accommodationPagination: AssistancePaginationState;
  error: string | null;
  setSelectedEventId: (eventId: string | null) => void;
  fetchRegistrations: (eventId: string) => Promise<void>;
  fetchTravelAssistance: (eventId: string, page?: number) => Promise<void>;
  fetchMedicalAssistance: (eventId: string, page?: number) => Promise<void>;
  fetchTranslationAssistance: (eventId: string, page?: number) => Promise<void>;
  fetchAccommodationAssistance: (eventId: string, page?: number) => Promise<void>;
  updateStatus: (id: string, status: RegistrationStatus) => Promise<void>;
  updateTravelStatus: (id: string, status: "accepted" | "rejected") => Promise<void>;
  updateTranslationStatus: (id: string, status: "accepted" | "rejected") => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: RegistrationStatus) => Promise<void>;
  bulkUpdateTravelStatus: (ids: string[], status: "accepted" | "rejected") => Promise<void>;
  bulkUpdateTranslationStatus: (ids: string[], status: "accepted" | "rejected") => Promise<void>;
  bulkUpdateMedicalStatus: (ids: string[], status: "accepted" | "rejected") => Promise<void>;
  bulkUpdateAccommodationStatus: (ids: string[], status: "accepted" | "rejected") => Promise<void>;
  addTravelAssistance: (values: AdminTravelAssistFormValues) => Promise<void>;
  addMedicalAssistance: (values: AdminMedicalAssistFormValues) => Promise<void>;
  addTranslationAssistance: (values: AdminTranslationAssistFormValues) => Promise<void>;
  addAccommodationAssistance: (values: AdminAccommodationAssistFormValues) => Promise<void>;
  updateAccommodationAssistance: (id: string, values: AccommodationEditFormValues) => Promise<void>;
  updateTravelAssistance: (id: string, values: TravelEditFormValues) => Promise<void>;
  updateMedicalAssistance: (id: string, values: MedicalEditFormValues) => Promise<void>;
  updateTranslationAssistance: (id: string, values: TranslationEditFormValues) => Promise<void>;
  updateRegistration: (id: string, values: RegistrationEditFormValues, event?: Pick<Event, "date" | "endDate"> | null) => Promise<void>;
  signUpLobbyUser: (values: LobbyUserSignupFormValues) => Promise<string>;
  registerLobbyUser: (
    userId: string,
    values: LobbyUserRegistrationFormValues,
    event?: Pick<Event, "date" | "endDate"> | null,
  ) => Promise<void>;
}

export const useLobbyStore = create<LobbyState>((set, get) => ({
  selectedEventId: null,
  registrations: [],
  registrationsLoading: false,
  travelAssistance: [],
  travelAssistanceLoading: false,
  travelPagination: EMPTY_ASSISTANCE_PAGINATION,
  medicalAssistance: [],
  medicalAssistanceLoading: false,
  medicalPagination: EMPTY_ASSISTANCE_PAGINATION,
  translationAssistance: [],
  translationAssistanceLoading: false,
  translationPagination: EMPTY_ASSISTANCE_PAGINATION,
  accommodationAssistance: [],
  accommodationAssistanceLoading: false,
  accommodationPagination: EMPTY_ASSISTANCE_PAGINATION,
  error: null,

  setSelectedEventId: (eventId) => {
    set({
      selectedEventId: eventId,
      registrations: [],
      travelAssistance: [],
      medicalAssistance: [],
      translationAssistance: [],
      accommodationAssistance: [],
      travelPagination: EMPTY_ASSISTANCE_PAGINATION,
      medicalPagination: EMPTY_ASSISTANCE_PAGINATION,
      translationPagination: EMPTY_ASSISTANCE_PAGINATION,
      accommodationPagination: EMPTY_ASSISTANCE_PAGINATION,
      error: null,
    });
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

  fetchTravelAssistance: async (eventId, page = 1) => {
    set({ travelAssistanceLoading: true, error: null, selectedEventId: eventId });
    try {
      const result = await lobbyService.getTravelAssistancePage(eventId, page);
      set({
        travelAssistance: result.items,
        travelPagination: toPaginationState(result),
        travelAssistanceLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch travel assistance",
        travelAssistance: [],
        travelPagination: EMPTY_ASSISTANCE_PAGINATION,
        travelAssistanceLoading: false,
      });
    }
  },

  fetchMedicalAssistance: async (eventId, page = 1) => {
    set({ medicalAssistanceLoading: true, error: null, selectedEventId: eventId });
    try {
      const result = await lobbyService.getMedicalAssistancePage(eventId, page);
      set({
        medicalAssistance: result.items,
        medicalPagination: toPaginationState(result),
        medicalAssistanceLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch medical assistance",
        medicalAssistance: [],
        medicalPagination: EMPTY_ASSISTANCE_PAGINATION,
        medicalAssistanceLoading: false,
      });
    }
  },

  fetchTranslationAssistance: async (eventId, page = 1) => {
    set({ translationAssistanceLoading: true, error: null, selectedEventId: eventId });
    try {
      const result = await lobbyService.getTranslationAssistancePage(eventId, page);
      set({
        translationAssistance: result.items,
        translationPagination: toPaginationState(result),
        translationAssistanceLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch translation assistance",
        translationAssistance: [],
        translationPagination: EMPTY_ASSISTANCE_PAGINATION,
        translationAssistanceLoading: false,
      });
    }
  },

  fetchAccommodationAssistance: async (eventId, page = 1) => {
    set({ accommodationAssistanceLoading: true, error: null, selectedEventId: eventId });
    try {
      const result = await lobbyService.getAccommodationAssistancePage(eventId, page);
      set({
        accommodationAssistance: result.items,
        accommodationPagination: toPaginationState(result),
        accommodationAssistanceLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch accommodation assistance",
        accommodationAssistance: [],
        accommodationPagination: EMPTY_ASSISTANCE_PAGINATION,
        accommodationAssistanceLoading: false,
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
      await get().fetchTravelAssistance(eventId, get().travelPagination.page);
      set({ error: null });
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
      await get().fetchTranslationAssistance(eventId, get().translationPagination.page);
      set({ error: null });
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
      await get().fetchTravelAssistance(eventId, get().travelPagination.page);
      set({ error: null });
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
      await get().fetchTranslationAssistance(eventId, get().translationPagination.page);
      set({ error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update translation statuses" });
      throw err;
    }
  },

  bulkUpdateMedicalStatus: async (ids, status) => {
    const eventId = get().selectedEventId;
    if (!eventId) throw new Error("No event selected");
    if (ids.length === 0) return;

    try {
      await lobbyService.bulkUpdateMedicalStatus(ids, status);
      await get().fetchMedicalAssistance(eventId, get().medicalPagination.page);
      set({ error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update medical statuses" });
      throw err;
    }
  },

  bulkUpdateAccommodationStatus: async (ids, status) => {
    const eventId = get().selectedEventId;
    if (!eventId) throw new Error("No event selected");
    if (ids.length === 0) return;

    try {
      await lobbyService.bulkUpdateAccommodationStatus(ids, status);
      await get().fetchAccommodationAssistance(eventId, get().accommodationPagination.page);
      set({ error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update accommodation statuses" });
      throw err;
    }
  },

  addTravelAssistance: async (values) => {
    const { eventId, userId, ...travel } = values;
    if (!eventId) throw new Error("No event selected");
    if (!userId) return;

    try {
      await lobbyService.addTravelAssistanceForUser(eventId, userId, travel);
      await get().fetchTravelAssistance(eventId, 1);
      set({ selectedEventId: eventId, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to add travel assistance" });
      throw err;
    }
  },

  addMedicalAssistance: async (values) => {
    const { eventId, userId, ...medical } = values;
    if (!eventId) throw new Error("No event selected");
    if (!userId) return;

    try {
      await lobbyService.addMedicalAssistanceForUser(eventId, userId, medical);
      await get().fetchMedicalAssistance(eventId, 1);
      set({ selectedEventId: eventId, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to add medical assistance" });
      throw err;
    }
  },

  addTranslationAssistance: async (values) => {
    const { eventId, userId, ...translation } = values;
    if (!eventId) throw new Error("No event selected");
    if (!userId) return;

    try {
      await lobbyService.addTranslationAssistanceForUser(eventId, userId, translation);
      await get().fetchTranslationAssistance(eventId, 1);
      set({ selectedEventId: eventId, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to add translation assistance" });
      throw err;
    }
  },

  addAccommodationAssistance: async (values) => {
    const { eventId, userId, ...accommodation } = values;
    if (!eventId) throw new Error("No event selected");
    if (!userId) return;

    try {
      await lobbyService.addAccommodationAssistanceForUser(eventId, userId, accommodation);
      await get().fetchAccommodationAssistance(eventId, 1);
      set({ selectedEventId: eventId, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to add accommodation assistance" });
      throw err;
    }
  },

  updateAccommodationAssistance: async (id, values) => {
    const eventId = get().selectedEventId;
    if (!eventId) throw new Error("No event selected");

    try {
      await lobbyService.updateAccommodationAssistance(id, values);
      await get().fetchAccommodationAssistance(eventId, get().accommodationPagination.page);
      set({ error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update accommodation assistance" });
      throw err;
    }
  },

  updateTravelAssistance: async (id, values) => {
    const eventId = get().selectedEventId;
    if (!eventId) throw new Error("No event selected");

    try {
      await lobbyService.updateTravelAssistance(id, values);
      await get().fetchTravelAssistance(eventId, get().travelPagination.page);
      set({ error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update travel assistance" });
      throw err;
    }
  },

  updateMedicalAssistance: async (id, values) => {
    const eventId = get().selectedEventId;
    if (!eventId) throw new Error("No event selected");

    try {
      await lobbyService.updateMedicalAssistance(id, values);
      await get().fetchMedicalAssistance(eventId, get().medicalPagination.page);
      set({ error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update medical assistance" });
      throw err;
    }
  },

  updateTranslationAssistance: async (id, values) => {
    const eventId = get().selectedEventId;
    if (!eventId) throw new Error("No event selected");

    try {
      await lobbyService.updateTranslationAssistance(id, values);
      await get().fetchTranslationAssistance(eventId, get().translationPagination.page);
      set({ error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update translation assistance" });
      throw err;
    }
  },

  updateRegistration: async (id, values, event) => {
    const eventId = get().selectedEventId;
    if (!eventId) throw new Error("No event selected");

    try {
      await lobbyService.updateRegistration(id, values, event);
      await get().fetchRegistrations(eventId);
      set({ error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update registration" });
      throw err;
    }
  },

  signUpLobbyUser: async (values) => {
    try {
      const userId = await lobbyService.createLobbyUser(values);
      set({ error: null });
      return userId;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to create user account" });
      throw err;
    }
  },

  registerLobbyUser: async (userId, values, event) => {
    const eventId = values.eventId || get().selectedEventId;
    if (!eventId) throw new Error("No event selected");

    try {
      await lobbyService.registerLobbyUserForEvent(userId, values, event);
      await get().fetchRegistrations(eventId);
      set({ selectedEventId: eventId, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to register user for event" });
      throw err;
    }
  },
}));

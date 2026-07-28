import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AlreadyRegisteredError } from "@/services/registration.service";
import * as registrationService from "@/services/registration.service";
import type { RegistrationEditFormValues } from "@/features/dashboard/admin-registration.schema";
import type { PaginatedResponse, Registration, RegistrationFormData, RegistrationStatus } from "@/types";
import type { SubmitRegistrationOptions } from "@/services/registration.service";
import type { RegistrationScheduleType } from "@/lib/registration-mappers";

interface RegistrationState {
  registrations: Registration[];
  paginated: PaginatedResponse<Registration> | null;
  isLoading: boolean;
  error: string | null;
  isEventRegistered: boolean;
  registeredEmail: string | null;
  fetchRegistrations: () => Promise<void>;
  fetchPaginated: (page?: number, pageSize?: number, search?: string, status?: RegistrationStatus) => Promise<void>;
  updateStatus: (id: string, status: RegistrationStatus) => Promise<void>;
  updateRegistration: (
    id: string,
    values: RegistrationEditFormValues,
    scheduleType?: RegistrationScheduleType,
  ) => Promise<void>;
  deleteRegistration: (id: string) => Promise<void>;
  submitRegistration: (
    data: RegistrationFormData,
    options?: SubmitRegistrationOptions,
  ) => Promise<Registration>;
  checkUserRegistration: (email: string) => Promise<boolean>;
  clearRegistrationSession: () => void;
}

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
  registrations: [],
  paginated: null,
  isLoading: false,
  error: null,
  isEventRegistered: false,
  registeredEmail: null,

  fetchRegistrations: async () => {
    set({ isLoading: true, error: null });
    try {
      const registrations = await registrationService.getRegistrations();
      set({ registrations, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch registrations",
        isLoading: false,
      });
    }
  },

  fetchPaginated: async (page = 1, pageSize = 10, search = "", status?) => {
    set({ isLoading: true, error: null });
    try {
      const paginated = await registrationService.getRegistrationsPaginated(page, pageSize, search, status);
      set({ paginated, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch registrations",
        isLoading: false,
      });
    }
  },

  updateStatus: async (id, status) => {
    try {
      const updated = await registrationService.updateRegistrationStatus(id, status);
      set({
        registrations: get().registrations.map((r) => (r.id === id ? updated : r)),
        paginated: get().paginated
          ? {
              ...get().paginated!,
              data: get().paginated!.data.map((r) => (r.id === id ? updated : r)),
            }
          : null,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update status" });
      throw err;
    }
  },

  updateRegistration: async (id, values, scheduleType) => {
    try {
      await registrationService.updateRegistration(id, values, scheduleType);
      await get().fetchRegistrations();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update registration" });
      throw err;
    }
  },

  deleteRegistration: async (id) => {
    try {
      await registrationService.deleteRegistration(id);
      set({
        registrations: get().registrations.filter((r) => r.id !== id),
        error: null,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to delete registration" });
      throw err;
    }
  },

  submitRegistration: async (data, options) => {
    set({ isLoading: true, error: null });
    try {
      const registration = await registrationService.submitRegistration(data, options);
      set({
        registrations: [registration, ...get().registrations],
        isEventRegistered: true,
        registeredEmail: data.email,
        isLoading: false,
      });
      return registration;
    } catch (err) {
      if (err instanceof AlreadyRegisteredError) {
        set({
          isEventRegistered: true,
          registeredEmail: data.email,
          isLoading: false,
          error: null,
        });
        throw err;
      }
      set({
        error: err instanceof Error ? err.message : "Failed to submit registration",
        isLoading: false,
      });
      throw err;
    }
  },

  checkUserRegistration: async (email) => {
    const { isEventRegistered, registeredEmail } = get();
    return (
      isEventRegistered &&
      registeredEmail?.toLowerCase() === email.toLowerCase()
    );
  },

  clearRegistrationSession: () => {
    set({ isEventRegistered: false, registeredEmail: null });
  },
}),
    {
      name: "registration-storage",
      partialize: (state) => ({
        isEventRegistered: state.isEventRegistered,
        registeredEmail: state.registeredEmail,
      }),
    }
  )
);

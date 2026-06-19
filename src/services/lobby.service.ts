import { apiClient } from "@/lib/api-client";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import {
  extractRegistrationList,
  mapApiRegistrationToRegistration,
  mapAppRequestStatusToApi,
  mapAppStatusToApiStatus,
} from "@/lib/registration-mappers";
import type { Registration, RegistrationStatus } from "@/types";

export const getLobbyRegistrations = async (eventId: string): Promise<Registration[]> => {
  try {
    const { data } = await apiClient.get<unknown>(
      `/registrations/lobby/${eventId}/registered/`,
      { params: { event_id: eventId } }
    );
    return extractRegistrationList(data).map((raw) =>
      mapApiRegistrationToRegistration(raw, eventId)
    );
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const bulkUpdateLobbyStatus = async (
  ids: string[],
  status: RegistrationStatus
): Promise<void> => {
  try {
    await apiClient.patch("/registrations/bulk-status/", {
      ids: ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id)),
      status: mapAppStatusToApiStatus(status),
    });
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateLobbyStatus = async (
  id: string,
  status: RegistrationStatus,
  eventId?: string
): Promise<Registration> => {
  try {
    await bulkUpdateLobbyStatus([id], status);
    if (eventId) {
      const registrations = await getLobbyRegistrations(eventId);
      const updated = registrations.find((registration) => registration.id === id);
      if (updated) return updated;
    }
    return mapApiRegistrationToRegistration({ id }, eventId);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const bulkUpdateTravelStatus = async (
  ids: string[],
  status: "accepted" | "rejected"
): Promise<void> => {
  try {
    await apiClient.patch("/registrations/bulk-travel-status/", {
      ids: ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id)),
      status: mapAppRequestStatusToApi(status),
    });
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateTravelStatus = async (
  registrationId: string,
  status: "accepted" | "rejected",
  eventId?: string
): Promise<Registration> => {
  try {
    await bulkUpdateTravelStatus([registrationId], status);
    if (eventId) {
      const registrations = await getLobbyRegistrations(eventId);
      const updated = registrations.find((registration) => registration.id === registrationId);
      if (updated) return updated;
    }
    return mapApiRegistrationToRegistration({ id: registrationId }, eventId);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const bulkUpdateTranslationStatus = async (
  ids: string[],
  status: "accepted" | "rejected"
): Promise<void> => {
  try {
    await apiClient.patch("/registrations/bulk-translation-status/", {
      ids: ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id)),
      status: mapAppRequestStatusToApi(status),
    });
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateTranslationStatus = async (
  registrationId: string,
  status: "accepted" | "rejected",
  eventId?: string
): Promise<Registration> => {
  try {
    await bulkUpdateTranslationStatus([registrationId], status);
    if (eventId) {
      const registrations = await getLobbyRegistrations(eventId);
      const updated = registrations.find((registration) => registration.id === registrationId);
      if (updated) return updated;
    }
    return mapApiRegistrationToRegistration({ id: registrationId }, eventId);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

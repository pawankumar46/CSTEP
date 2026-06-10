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

export const updateLobbyStatus = async (
  id: string,
  status: RegistrationStatus,
  eventId?: string
): Promise<Registration> => {
  try {
    const { data } = await apiClient.patch<Record<string, unknown>>(
      `/registrations/${id}/status/`,
      { status: mapAppStatusToApiStatus(status) }
    );
    return mapApiRegistrationToRegistration(data, eventId);
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
    const { data } = await apiClient.patch<Record<string, unknown>>(
      `/registrations/${registrationId}/travel-status/`,
      { travel_status: mapAppRequestStatusToApi(status) }
    );
    return mapApiRegistrationToRegistration(data, eventId);
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
    const { data } = await apiClient.patch<Record<string, unknown>>(
      `/registrations/${registrationId}/translation-status/`,
      { translation_status: mapAppRequestStatusToApi(status) }
    );
    return mapApiRegistrationToRegistration(data, eventId);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

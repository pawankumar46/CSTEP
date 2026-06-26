import { apiClient } from "@/lib/api-client";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import {
  extractRegistrationList,
  isDuplicateRegistrationError,
  mapApiRegistrationToRegistration,
  toAdminRegistrationApiPayload,
  toLobbyRegistrationApiPayload,
  toRegistrationApiPayload,
  toRegistrationPreferencesPayload,
} from "@/lib/registration-mappers";
import { toAccommodationRequestPayload, toMedicalRequestPayload, toTranslationRequestPayload, toTravelRequestPayload } from "@/lib/event-support-mappers";
import type { EventSupportFormValues } from "@/features/profile/event-support.schema";

export class AlreadyRegisteredError extends Error {
  constructor() {
    super("You are already registered for this event.");
    this.name = "AlreadyRegisteredError";
  }
}
import { delay } from "@/lib/utils";
import { mockRegistrations } from "@/mock/registrations";
import type {
  Event,
  AttendanceMode,
  FoodPreference,
  MedicalSupportType,
  PaginatedResponse,
  ParticipationTime,
  Registration,
  RegistrationFormData,
  RegistrationStatus,
  TravelType,
} from "@/types";

export type RegistrationPreferences = {
  travelRequired: boolean;
  travelType?: TravelType;
  medicalSupportRequired: boolean;
  medicalSupportType?: MedicalSupportType;
};

let registrations = [...mockRegistrations];

export const getRegistrations = async (): Promise<Registration[]> => {
  try {
    const { data } = await apiClient.get<unknown>("/registrations/");
    return extractRegistrationList(data).map((raw) => mapApiRegistrationToRegistration(raw));
  } catch {
    return [...registrations];
  }
};

export const getRegistrationsPaginated = async (
  page = 1,
  pageSize = 10,
  search = "",
  status?: RegistrationStatus
): Promise<PaginatedResponse<Registration>> => {
  await delay(400);
  let filtered = [...registrations];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.userName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q)
    );
  }

  if (status) {
    filtered = filtered.filter((r) => r.status === status);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, total, page, pageSize, totalPages };
};

export const updateRegistrationStatus = async (
  id: string,
  status: RegistrationStatus
): Promise<Registration> => {
  await delay(400);
  const index = registrations.findIndex((r) => r.id === id);
  if (index === -1) throw new Error("Registration not found");
  registrations[index] = {
    ...registrations[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  return registrations[index];
};

export const getUserRegistration = async (email: string): Promise<Registration | null> => {
  try {
    const { data } = await apiClient.get<unknown>("/registrations/");
    const list = extractRegistrationList(data).map((raw) => mapApiRegistrationToRegistration(raw));
    return list.find((r) => r.email.toLowerCase() === email.toLowerCase()) ?? null;
  } catch {
    return registrations.find((r) => r.email.toLowerCase() === email.toLowerCase()) ?? null;
  }
};

export const updateRegistrationPreferences = async (
  id: string,
  preferences: RegistrationPreferences,
): Promise<Registration> => {
  try {
    const { data } = await apiClient.patch<Record<string, unknown>>(
      `/registrations/${id}/`,
      toRegistrationPreferencesPayload(preferences),
    );
    const updated = mapApiRegistrationToRegistration(data);
    const index = registrations.findIndex((r) => r.id === id);
    if (index !== -1) {
      registrations[index] = updated;
    }
    return updated;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const submitRegistration = async (
  data: RegistrationFormData,
  event?: Pick<Event, "date" | "endDate"> | null,
): Promise<Registration> => {
  try {
    const { data: response } = await apiClient.post<Record<string, unknown>>(
      "/registrations/registration/",
      toRegistrationApiPayload(data, event)
    );
    return mapApiRegistrationToRegistration(response);
  } catch (error) {
    if (isDuplicateRegistrationError(error)) {
      throw new AlreadyRegisteredError();
    }
    throw new Error(extractApiErrorMessage(error));
  }
};

export const submitLobbyRegistration = async (
  userId: string,
  data: {
    eventId: string;
    participationDates: string[];
    participationTime?: ParticipationTime;
    attendanceMode?: AttendanceMode;
    foodPreference?: FoodPreference;
  },
  event?: Pick<Event, "date" | "endDate"> | null,
): Promise<Registration> => {
  try {
    const { data: response } = await apiClient.post<Record<string, unknown>>(
      "/registrations/registration/",
      toLobbyRegistrationApiPayload(userId, data, event),
    );
    return mapApiRegistrationToRegistration(response, data.eventId);
  } catch (error) {
    if (isDuplicateRegistrationError(error)) {
      throw new AlreadyRegisteredError();
    }
    throw new Error(extractApiErrorMessage(error));
  }
};

export const submitAdminRegistration = async (
  userId: string,
  data: Pick<
    RegistrationFormData,
    "eventId" | "participationDate" | "participationTime" | "attendanceMode" | "foodPreference"
  >,
  event?: Pick<Event, "date" | "endDate"> | null,
): Promise<Registration> => {
  try {
    const { data: response } = await apiClient.post<Record<string, unknown>>(
      "/registrations/registration/",
      toAdminRegistrationApiPayload(userId, data, event),
    );
    return mapApiRegistrationToRegistration(response, data.eventId);
  } catch (error) {
    if (isDuplicateRegistrationError(error)) {
      throw new AlreadyRegisteredError();
    }
    throw new Error(extractApiErrorMessage(error));
  }
};

export const requestTravelSupport = async (data: EventSupportFormValues): Promise<void> => {
  try {
    await apiClient.post("/registrations/request-travel/", toTravelRequestPayload(data));
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const requestMedicalSupport = async (data: EventSupportFormValues): Promise<void> => {
  try {
    await apiClient.post("/registrations/request-medical/", toMedicalRequestPayload(data));
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const requestTranslationSupport = async (data: EventSupportFormValues): Promise<void> => {
  try {
    await apiClient.post("/registrations/request-translation/", toTranslationRequestPayload(data));
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const requestAccommodationSupport = async (data: EventSupportFormValues): Promise<void> => {
  try {
    await apiClient.post(
      "/registrations/accommodation-assistance/",
      toAccommodationRequestPayload(data),
    );
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const checkUserHasRegistration = async (email: string): Promise<boolean> => {
  return registrations.some((r) => r.email.toLowerCase() === email.toLowerCase());
};

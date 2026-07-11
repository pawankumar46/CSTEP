import { apiClient } from "@/lib/api-client";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import {
  extractRegistrationList,
  isDuplicateRegistrationError,
  mapApiRegistrationToRegistration,
  mapAppAttendanceModeToApi,
  toAdminRegistrationApiPayload,
  toLobbyRegistrationApiPayload,
  toRegistrationApiPayload,
  toRegistrationPreferencesPayload,
  type RegistrationScheduleType,
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
  MedicalSupportType,
  PaginatedResponse,
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

const DEFAULT_REGISTRATION_PAGE_SIZE = 10;

export interface EventRegistrationsPageResult {
  registrations: Registration[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const getEventRegistrationsPage = async ({
  eventId,
  attendanceMode,
  page = 1,
  pageSize = DEFAULT_REGISTRATION_PAGE_SIZE,
}: {
  eventId: string;
  attendanceMode?: AttendanceMode;
  page?: number;
  pageSize?: number;
}): Promise<EventRegistrationsPageResult> => {
  try {
    const params: Record<string, string | number> = {
      event: eventId,
      page,
      page_size: pageSize,
    };

    if (attendanceMode) {
      params.attendance_mode = mapAppAttendanceModeToApi(attendanceMode);
    }

    const { data } = await apiClient.get<unknown>("/registrations/registration/", { params });
    const list = extractRegistrationList(data);
    const mapped = list.map((raw) => mapApiRegistrationToRegistration(raw, eventId));

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const record = data as {
        count?: number;
        total_pages?: number;
        current_page?: number;
        next?: string | null;
        previous?: string | null;
      };
      const total = Number(record.count ?? mapped.length);
      const totalPages = Number(record.total_pages ?? Math.max(1, Math.ceil(total / pageSize)));
      const currentPage = Number(record.current_page ?? page);

      return {
        registrations: mapped,
        page: currentPage,
        pageSize,
        total,
        totalPages,
        hasNext: Boolean(record.next),
        hasPrevious: Boolean(record.previous),
      };
    }

    return {
      registrations: mapped,
      page,
      pageSize,
      total: mapped.length,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getEventRegistrationsByAttendanceMode = async (
  eventId: string,
  attendanceMode: AttendanceMode,
): Promise<{ registrations: Registration[]; total: number }> => {
  const allRegistrations: Registration[] = [];
  let page = 1;
  let hasMore = true;
  let total = 0;

  while (hasMore && page <= 100) {
    const result = await getEventRegistrationsPage({
      eventId,
      attendanceMode,
      page,
      pageSize: 50,
    });
    allRegistrations.push(...result.registrations);
    total = result.total;
    hasMore = result.hasNext;
    page += 1;
  }

  return { registrations: allRegistrations, total };
};

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

export interface SubmitRegistrationOptions {
  userId?: string;
  scheduleType?: RegistrationScheduleType;
}

export const submitRegistration = async (
  data: RegistrationFormData,
  options?: SubmitRegistrationOptions,
): Promise<Registration> => {
  try {
    const { data: response } = await apiClient.post<Record<string, unknown>>(
      "/registrations/registration/",
      toRegistrationApiPayload(data, options),
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
    selectedDayIds?: string[];
    selectedSessionIds?: string[];
    sessionsByDay?: Record<string, string[]>;
    attendanceByDay?: Record<string, AttendanceMode>;
    attendanceMode?: AttendanceMode;
  },
  options?: SubmitRegistrationOptions,
): Promise<Registration> => {
  try {
    const { data: response } = await apiClient.post<Record<string, unknown>>(
      "/registrations/registration/",
      toLobbyRegistrationApiPayload(userId, data, options),
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
    | "eventId"
    | "participationDate"
    | "participationTime"
    | "selectedDayIds"
    | "selectedSessionIds"
    | "attendanceMode"
  >,
  options?: SubmitRegistrationOptions,
): Promise<Registration> => {
  try {
    const { data: response } = await apiClient.post<Record<string, unknown>>(
      "/registrations/registration/",
      toAdminRegistrationApiPayload(userId, data, options),
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

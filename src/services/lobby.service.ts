import { apiClient } from "@/lib/api-client";
import { extractApiErrorMessage, normalizeAuthIdentifier } from "@/lib/auth-mappers";
import { getEventDayDates } from "@/lib/participation-dates";
import { signUpLobbyUser } from "@/services/auth.service";
import { submitLobbyRegistration } from "@/services/registration.service";
import { findUserByEmail } from "@/services/user.service";
import type {
  LobbyUserRegistrationFormValues,
  LobbyUserSignupFormValues,
} from "@/features/dashboard/admin-lobby-user.schema";
import {
  extractRegistrationList,
  mapApiRegistrationToRegistration,
  mapApiAccommodationAssistanceList,
  mapApiMedicalAssistanceList,
  mapApiTranslationAssistanceList,
  mapApiTravelAssistanceList,
  mapAppRequestStatusToApi,
  mapAppStatusToApiStatus,
  toRegistrationUpdatePayload,
} from "@/lib/registration-mappers";
import {
  toAdminAccommodationRequestPayload,
  toAccommodationUpdatePayload,
  toAdminMedicalRequestPayload,
  toAdminTranslationRequestPayload,
  toAdminTravelRequestPayload,
  toMedicalUpdatePayload,
  toTranslationUpdatePayload,
  toTravelUpdatePayload,
} from "@/lib/event-support-mappers";
import type { AccommodationEditFormValues } from "@/features/dashboard/admin-accommodation.schema";
import type { AdminAccommodationAssistFormValues } from "@/features/dashboard/admin-accommodation.schema";
import type { AdminMedicalAssistFormValues, MedicalEditFormValues } from "@/features/dashboard/admin-medical.schema";
import type { AdminTranslationAssistFormValues, TranslationEditFormValues } from "@/features/dashboard/admin-translation.schema";
import type { AdminTravelAssistFormValues, TravelEditFormValues } from "@/features/dashboard/admin-travel.schema";
import type { RegistrationEditFormValues } from "@/features/dashboard/admin-registration.schema";
import type { AccommodationAssistanceRow, Event, MedicalAssistanceRow, Registration, RegistrationStatus, TranslationAssistanceRow, TravelAssistanceRow, AssistanceActionStatus } from "@/types";

export const createLobbyUser = async (
  values: LobbyUserSignupFormValues,
): Promise<string> => {
  const { salutation, firstName, middleName, lastName, phone, email, password, address } = values;

  const signupResult = await signUpLobbyUser({
    salutation,
    firstName,
    middleName,
    lastName,
    phone,
    email: normalizeAuthIdentifier(email),
    address,
    password,
  });

  let userId = signupResult.userId;
  if (!userId) {
    const createdUser = await findUserByEmail(email);
    userId = createdUser?.id ?? "";
  }

  if (!userId) {
    throw new Error("User account was created but the user id could not be resolved.");
  }

  return userId;
};

export const registerLobbyUserForEvent = async (
  userId: string,
  values: LobbyUserRegistrationFormValues,
  event?: Pick<Event, "date" | "endDate"> | null,
): Promise<Registration> => {
  const { eventId, participationDates, participationTime, attendanceMode, foodPreference } = values;

  return submitLobbyRegistration(
    userId,
    {
      eventId,
      participationDates: participationDates.length > 0
        ? participationDates
        : getEventDayDates(event),
      participationTime,
      attendanceMode,
      foodPreference,
    },
    event,
  );
};

export const addTravelAssistanceForUser = async (
  eventId: string,
  userId: string,
  travel: Omit<AdminTravelAssistFormValues, "userId" | "eventId">,
): Promise<void> => {
  if (!userId) return;

  try {
    await apiClient.post(
      "/registrations/travel-assistance/",
      toAdminTravelRequestPayload(travel, eventId, userId),
    );
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const addTranslationAssistanceForUser = async (
  eventId: string,
  userId: string,
  translation: Omit<AdminTranslationAssistFormValues, "userId" | "eventId">,
): Promise<void> => {
  if (!userId) return;

  try {
    await apiClient.post(
      "/registrations/translation-assistance/",
      toAdminTranslationRequestPayload(translation, eventId, userId),
    );
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const addMedicalAssistanceForUser = async (
  eventId: string,
  userId: string,
  medical: Omit<AdminMedicalAssistFormValues, "userId" | "eventId">,
): Promise<void> => {
  if (!userId) return;

  try {
    await apiClient.post(
      "/registrations/medical-assistance/",
      toAdminMedicalRequestPayload(medical, eventId, userId),
    );
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const addAccommodationAssistanceForUser = async (
  eventId: string,
  userId: string,
  accommodation: Omit<AdminAccommodationAssistFormValues, "userId" | "eventId">,
): Promise<void> => {
  if (!userId) return;

  try {
    await apiClient.post(
      "/registrations/accommodation-assistance/",
      toAdminAccommodationRequestPayload(accommodation, eventId, userId),
    );
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateAccommodationAssistance = async (
  accommodationId: string,
  accommodation: AccommodationEditFormValues,
): Promise<void> => {
  try {
    await apiClient.put(
      `/registrations/accommodation-assistance/${accommodationId}/`,
      toAccommodationUpdatePayload(accommodation),
    );
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateTravelAssistance = async (
  travelId: string,
  travel: TravelEditFormValues,
): Promise<void> => {
  try {
    await apiClient.put(
      `/registrations/travel-assistance/${travelId}/`,
      toTravelUpdatePayload(travel),
    );
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateMedicalAssistance = async (
  medicalId: string,
  medical: MedicalEditFormValues,
): Promise<void> => {
  try {
    await apiClient.put(
      `/registrations/medical-assistance/${medicalId}/`,
      toMedicalUpdatePayload(medical),
    );
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateTranslationAssistance = async (
  translationId: string,
  translation: TranslationEditFormValues,
): Promise<void> => {
  try {
    await apiClient.put(
      `/registrations/translation-assistance/${translationId}/`,
      toTranslationUpdatePayload(translation),
    );
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateRegistration = async (
  registrationId: string,
  registration: RegistrationEditFormValues,
  event?: Pick<Event, "date" | "endDate"> | null,
): Promise<void> => {
  try {
    await apiClient.put(
      `/registrations/registration/${registrationId}/`,
      toRegistrationUpdatePayload(registration, event),
    );
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

const DEFAULT_ASSISTANCE_PAGE_SIZE = 10;
const DEFAULT_LOBBY_PAGE_SIZE = 50;

export interface AssistancePageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

function parseAssistancePage<T>(
  data: unknown,
  page: number,
  pageSize: number,
  mapList: (payload: unknown) => T[],
): AssistancePageResult<T> {
  const items = mapList(data);

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const record = data as { count?: number; next?: string | null; previous?: string | null };
    const total = Number(record.count ?? items.length);

    return {
      items,
      page,
      pageSize,
      total,
      hasNext: Boolean(record.next),
      hasPrevious: Boolean(record.previous),
    };
  }

  return {
    items,
    page,
    pageSize,
    total: items.length,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

export const getTravelAssistancePage = async (
  eventId: string,
  page = 1,
  pageSize = DEFAULT_ASSISTANCE_PAGE_SIZE,
): Promise<AssistancePageResult<TravelAssistanceRow>> => {
  try {
    const { data } = await apiClient.get<unknown>("/registrations/travel-assistance/", {
      params: {
        registration__event: eventId,
        page,
        page_size: pageSize,
      },
    });
    return parseAssistancePage(data, page, pageSize, mapApiTravelAssistanceList);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getTravelAssistance = async (eventId: string): Promise<TravelAssistanceRow[]> => {
  const result = await getTravelAssistancePage(eventId);
  return result.items;
};

export const getMedicalAssistancePage = async (
  eventId: string,
  page = 1,
  pageSize = DEFAULT_ASSISTANCE_PAGE_SIZE,
): Promise<AssistancePageResult<MedicalAssistanceRow>> => {
  try {
    const { data } = await apiClient.get<unknown>("/registrations/medical-assistance/", {
      params: {
        registration__event: eventId,
        page,
        page_size: pageSize,
      },
    });
    return parseAssistancePage(data, page, pageSize, mapApiMedicalAssistanceList);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getMedicalAssistance = async (eventId: string): Promise<MedicalAssistanceRow[]> => {
  const result = await getMedicalAssistancePage(eventId);
  return result.items;
};

export const getTranslationAssistancePage = async (
  eventId: string,
  page = 1,
  pageSize = DEFAULT_ASSISTANCE_PAGE_SIZE,
): Promise<AssistancePageResult<TranslationAssistanceRow>> => {
  try {
    const { data } = await apiClient.get<unknown>("/registrations/translation-assistance/", {
      params: {
        registration__event: eventId,
        page,
        page_size: pageSize,
      },
    });
    return parseAssistancePage(data, page, pageSize, mapApiTranslationAssistanceList);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getTranslationAssistance = async (eventId: string): Promise<TranslationAssistanceRow[]> => {
  const result = await getTranslationAssistancePage(eventId);
  return result.items;
};

export const getAccommodationAssistancePage = async (
  eventId: string,
  page = 1,
  pageSize = DEFAULT_ASSISTANCE_PAGE_SIZE,
): Promise<AssistancePageResult<AccommodationAssistanceRow>> => {
  try {
    const { data } = await apiClient.get<unknown>("/registrations/accommodation-assistance/", {
      params: {
        registration__event: eventId,
        page,
        page_size: pageSize,
      },
    });
    return parseAssistancePage(data, page, pageSize, mapApiAccommodationAssistanceList);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getAccommodationAssistance = async (eventId: string): Promise<AccommodationAssistanceRow[]> => {
  const result = await getAccommodationAssistancePage(eventId);
  return result.items;
};

export interface LobbyRegistrationsPageResult {
  registrations: Registration[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export const getLobbyRegistrationsPage = async (
  eventId: string,
  page = 1,
  pageSize = DEFAULT_LOBBY_PAGE_SIZE,
): Promise<LobbyRegistrationsPageResult> => {
  const { data } = await apiClient.get<unknown>("/registrations/registration/", {
    params: {
      registration__event: eventId,
      page,
      page_size: pageSize,
    },
  });

  const list = extractRegistrationList(data);
  const registrations = list.map((raw) => mapApiRegistrationToRegistration(raw, eventId));

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const record = data as { count?: number; next?: string | null };
    const total = Number(record.count ?? registrations.length);
    const hasMore = Boolean(record.next);

    return { registrations, page, pageSize, total, hasMore };
  }

  return {
    registrations,
    page,
    pageSize,
    total: registrations.length,
    hasMore: false,
  };
};

export const getLobbyRegistrations = async (eventId: string): Promise<Registration[]> => {
  try {
    const allRegistrations: Registration[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 100) {
      const result = await getLobbyRegistrationsPage(eventId, page);
      allRegistrations.push(...result.registrations);
      hasMore = result.hasMore;
      page += 1;
    }

    return allRegistrations;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const bulkUpdateLobbyStatus = async (
  ids: string[],
  status: RegistrationStatus
): Promise<void> => {
  try {
    await apiClient.patch("/registrations/registration/bulk-status/", {
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
  status: AssistanceActionStatus
): Promise<void> => {
  try {
    await apiClient.patch("/registrations/travel-assistance/bulk-status/", {
      ids: ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id)),
      status: mapAppRequestStatusToApi(status),
    });
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateTravelStatus = async (
  travelAssistanceId: string,
  status: AssistanceActionStatus,
  eventId?: string
): Promise<TravelAssistanceRow[]> => {
  try {
    await bulkUpdateTravelStatus([travelAssistanceId], status);
    if (eventId) {
      return getTravelAssistance(eventId);
    }
    return [];
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const bulkUpdateTranslationStatus = async (
  ids: string[],
  status: AssistanceActionStatus
): Promise<void> => {
  try {
    await apiClient.patch("/registrations/translation-assistance/bulk-status/", {
      ids: ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id)),
      status: mapAppRequestStatusToApi(status),
    });
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const bulkUpdateMedicalStatus = async (
  ids: string[],
  status: AssistanceActionStatus
): Promise<void> => {
  try {
    await apiClient.patch("/registrations/medical-assistance/bulk-status/", {
      ids: ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id)),
      status: mapAppRequestStatusToApi(status),
    });
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const bulkUpdateAccommodationStatus = async (
  ids: string[],
  status: AssistanceActionStatus
): Promise<void> => {
  try {
    await apiClient.patch("/registrations/accommodation-assistance/bulk-status/", {
      ids: ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id)),
      status: mapAppRequestStatusToApi(status),
    });
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateTranslationStatus = async (
  assistanceId: string,
  status: AssistanceActionStatus,
  eventId?: string
): Promise<TranslationAssistanceRow[]> => {
  try {
    await bulkUpdateTranslationStatus([assistanceId], status);
    if (eventId) {
      return getTranslationAssistance(eventId);
    }
    return [];
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateMedicalStatus = async (
  assistanceId: string,
  status: AssistanceActionStatus,
  eventId?: string
): Promise<MedicalAssistanceRow[]> => {
  try {
    await bulkUpdateMedicalStatus([assistanceId], status);
    if (eventId) {
      return getMedicalAssistance(eventId);
    }
    return [];
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

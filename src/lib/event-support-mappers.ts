import type { EventSupportFormValues, TransportMode } from "@/features/profile/event-support.schema";

const TRANSPORT_MODE_TO_API: Record<TransportMode, string> = {
  flight: "FLIGHT_ONLY",
  train: "TRAIN_ONLY",
  taxi: "TAXI_ONLY",
};

const ADMIN_TRAVEL_ASSISTANCE_TRANSPORT_MODE: Record<TransportMode, string> = {
  flight: "FLIGHT",
  train: "TRAIN",
  taxi: "TAXI",
};

export interface TravelRequestPayload {
  event_id: number;
  transport_mode: string;
  source_location: string;
  destination_location: string;
  travel_date: string;
}

export interface AdminTravelRequestPayload extends TravelRequestPayload {
  user_id: number;
}

function buildAdminTravelAssistanceFields(
  data: {
    transportMode: TransportMode;
    departureCity?: string;
    arrivalCity?: string;
    departureDate?: string;
    pickupAddress?: string;
    dropAddress?: string;
    travelDate?: string;
  },
) {
  const isTaxi = data.transportMode === "taxi";

  return {
    transport_mode: ADMIN_TRAVEL_ASSISTANCE_TRANSPORT_MODE[data.transportMode],
    source_location: (isTaxi ? data.pickupAddress : data.departureCity)?.trim() ?? "",
    destination_location: (isTaxi ? data.dropAddress : data.arrivalCity)?.trim() ?? "",
    travel_date: (isTaxi ? data.travelDate : data.departureDate) ?? "",
  };
}

export function toAdminTravelRequestPayload(
  data: {
    transportMode: TransportMode;
    departureCity?: string;
    arrivalCity?: string;
    departureDate?: string;
    pickupAddress?: string;
    dropAddress?: string;
    travelDate?: string;
  },
  eventId: string,
  userId: string,
): AdminTravelRequestPayload {
  if (!eventId.trim() || !data.transportMode) {
    throw new Error("Event and transport mode are required");
  }

  return {
    event_id: Number(eventId),
    user_id: Number(userId),
    ...buildAdminTravelAssistanceFields(data),
  };
}

export function toTravelUpdatePayload(
  data: {
    eventId: string;
    transportMode: TransportMode;
    departureCity?: string;
    arrivalCity?: string;
    departureDate?: string;
    pickupAddress?: string;
    dropAddress?: string;
    travelDate?: string;
  },
): Omit<AdminTravelRequestPayload, "user_id"> {
  if (!data.eventId.trim() || !data.transportMode) {
    throw new Error("Event and transport mode are required");
  }

  return {
    event_id: Number(data.eventId),
    ...buildAdminTravelAssistanceFields(data),
  };
}

export function toTravelRequestPayload(data: EventSupportFormValues): TravelRequestPayload {
  if (!data.eventId?.trim() || !data.transportMode) {
    throw new Error("Event and transport mode are required");
  }

  const isTaxi = data.transportMode === "taxi";

  return {
    event_id: Number(data.eventId),
    transport_mode: TRANSPORT_MODE_TO_API[data.transportMode],
    source_location: (isTaxi ? data.pickupAddress : data.departureCity)?.trim() ?? "",
    destination_location: (isTaxi ? data.dropAddress : data.arrivalCity)?.trim() ?? "",
    travel_date: (isTaxi ? data.travelDate : data.departureDate) ?? "",
  };
}

export interface MedicalRequestPayload {
  event_id: number;
  medical_needs: string;
  date: string;
}

export interface AdminMedicalRequestPayload extends MedicalRequestPayload {
  user_id: number;
}

export function toAdminMedicalRequestPayload(
  data: {
    medicalRequirement: string;
    medicalRequiredDate: string;
  },
  eventId: string,
  userId: string,
): AdminMedicalRequestPayload {
  if (!eventId.trim()) {
    throw new Error("Event is required");
  }

  return {
    event_id: Number(eventId),
    user_id: Number(userId),
    medical_needs: data.medicalRequirement.trim(),
    date: data.medicalRequiredDate,
  };
}

export function toMedicalUpdatePayload(data: {
  eventId: string;
  medicalRequirement: string;
  medicalRequiredDate: string;
}): MedicalRequestPayload {
  if (!data.eventId.trim()) {
    throw new Error("Event is required");
  }

  return {
    event_id: Number(data.eventId),
    medical_needs: data.medicalRequirement.trim(),
    date: data.medicalRequiredDate,
  };
}

export function toMedicalRequestPayload(data: EventSupportFormValues): MedicalRequestPayload {
  if (!data.eventId?.trim()) {
    throw new Error("Event is required");
  }

  return {
    event_id: Number(data.eventId),
    medical_needs: data.medicalRequirement?.trim() ?? "",
    date: data.medicalRequiredDate ?? "",
  };
}

export interface TranslationRequestPayload {
  event_id: number;
  language: string;
  date: string;
}

export interface AdminTranslationRequestPayload extends TranslationRequestPayload {
  user_id: number;
}

export function toAdminTranslationRequestPayload(
  data: {
    translationLanguage: string;
    translationRequiredDate: string;
  },
  eventId: string,
  userId: string,
): AdminTranslationRequestPayload {
  if (!eventId.trim() || !data.translationLanguage) {
    throw new Error("Event and language are required");
  }

  return {
    event_id: Number(eventId),
    user_id: Number(userId),
    language: data.translationLanguage.toUpperCase(),
    date: data.translationRequiredDate,
  };
}

export function toTranslationUpdatePayload(data: {
  eventId: string;
  translationLanguage: string;
  translationRequiredDate: string;
}): TranslationRequestPayload {
  if (!data.eventId.trim() || !data.translationLanguage) {
    throw new Error("Event and language are required");
  }

  return {
    event_id: Number(data.eventId),
    language: data.translationLanguage.toUpperCase(),
    date: data.translationRequiredDate,
  };
}

export function toTranslationRequestPayload(
  data: EventSupportFormValues,
): TranslationRequestPayload {
  if (!data.eventId?.trim() || !data.translationLanguage) {
    throw new Error("Event and language are required");
  }

  return {
    event_id: Number(data.eventId),
    language: data.translationLanguage.toUpperCase(),
    date: data.translationRequiredDate ?? "",
  };
}

export interface AccommodationRequestPayload {
  event_id: number;
  hotel_name: string;
  address: string;
  room_no: string;
  from_date: string;
  to_date: string;
}

export interface AdminAccommodationRequestPayload extends AccommodationRequestPayload {
  user_id: number;
}

export interface AccommodationUpdatePayload {
  event_id: number;
  hotel_name: string;
  address: string;
  room_no: string;
  from_date: string;
  to_date: string;
}

export function toAccommodationUpdatePayload(data: {
  eventId: string;
  hotelName: string;
  hotelAddress: string;
  roomNo: string;
  accommodationFromDate: string;
  accommodationToDate: string;
}): AccommodationUpdatePayload {
  if (!data.eventId.trim()) {
    throw new Error("Event is required");
  }

  return {
    event_id: Number(data.eventId),
    hotel_name: data.hotelName.trim(),
    address: data.hotelAddress.trim(),
    room_no: data.roomNo.trim(),
    from_date: data.accommodationFromDate,
    to_date: data.accommodationToDate,
  };
}

export function toAdminAccommodationRequestPayload(
  data: {
    hotelName: string;
    hotelAddress: string;
    roomNo: string;
    accommodationFromDate: string;
    accommodationToDate: string;
  },
  eventId: string,
  userId: string,
): AdminAccommodationRequestPayload {
  if (!eventId.trim()) {
    throw new Error("Event is required");
  }

  return {
    event_id: Number(eventId),
    user_id: Number(userId),
    hotel_name: data.hotelName.trim(),
    address: data.hotelAddress.trim(),
    room_no: data.roomNo.trim(),
    from_date: data.accommodationFromDate,
    to_date: data.accommodationToDate,
  };
}

export function toAccommodationRequestPayload(
  data: EventSupportFormValues,
): AccommodationRequestPayload {
  if (!data.eventId?.trim()) {
    throw new Error("Event is required");
  }

  return {
    event_id: Number(data.eventId),
    hotel_name: data.hotelName?.trim() ?? "",
    address: data.hotelAddress?.trim() ?? "",
    room_no: data.roomNo?.trim() ?? "",
    from_date: data.accommodationFromDate ?? "",
    to_date: data.accommodationToDate ?? "",
  };
}

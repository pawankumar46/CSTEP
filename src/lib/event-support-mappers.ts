import type { EventSupportFormValues, TransportMode } from "@/features/profile/event-support.schema";

const TRANSPORT_MODE_TO_API: Record<TransportMode, string> = {
  flight: "FLIGHT_ONLY",
  train: "TRAIN_ONLY",
  taxi: "TAXI_ONLY",
};

export interface TravelRequestPayload {
  event_id: number;
  transport_mode: string;
  source_location: string;
  destination_location: string;
  travel_date: string;
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

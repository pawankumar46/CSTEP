import axios from "axios";
import { resolveParticipationDatesForApi } from "@/lib/participation-dates";
import type { Event } from "@/types";
import type {
  FoodPreference,
  MedicalSupportType,
  ParticipationDate,
  ParticipationTime,
  Registration,
  RegistrationFormData,
  RegistrationStatus,
  TranslationLanguage,
  TravelType,
} from "@/types";

function hasDuplicateRegistrationMessage(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;

  const errors = (data as Record<string, unknown>).non_field_errors;
  if (!Array.isArray(errors)) return false;

  return errors.some((message) =>
    String(message).toLowerCase().includes("user, event must make a unique set")
  );
}

export function isDuplicateRegistrationError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return hasDuplicateRegistrationMessage(error.response?.data);
  }

  if (error instanceof Error) {
    return error.message.toLowerCase().includes("user, event must make a unique set");
  }

  return false;
}

const API_DATE_TO_PARTICIPATION: Record<string, ParticipationDate> = {
  "2025-08-21": "21st",
  "2025-08-22": "22nd",
};

const API_TRAVEL_TO_APP: Record<string, TravelType> = {
  FLIGHT_TAXI_HOTEL: "flight_taxi_hotel",
  TAXI_HOTEL: "taxi_hotel",
  HOTEL_ONLY: "hotel_only",
  TAXI_ONLY: "taxi_only",
  FLIGHT_ONLY: "flight_only",
  TRAIN_ONLY: "train_only",
};

const TRAVEL_ARRANGEMENT_LABELS: Record<string, string> = {
  SELF_ARRANGED: "Self Arranged",
  FLIGHT_TAXI_HOTEL: "Flight + Taxi + Hotel",
  TAXI_HOTEL: "Taxi + Hotel",
  HOTEL_ONLY: "Hotel Only",
  TAXI_ONLY: "Taxi Only",
  FLIGHT_ONLY: "Flight Only",
  TRAIN_ONLY: "Train Only",
};

export function formatTravelArrangementLabel(value: unknown): string {
  const key = String(value ?? "").toUpperCase();
  return TRAVEL_ARRANGEMENT_LABELS[key] ?? key.replace(/_/g, " ");
}

function fromApiEnum(value: string): string {
  return value.toLowerCase();
}

function mapApiStatus(value: unknown): RegistrationStatus {
  const normalized = String(value ?? "PENDING").toUpperCase();
  if (normalized === "ACCEPTED") return "accepted";
  if (normalized === "REJECTED") return "rejected";
  if (normalized === "HELD" || normalized === "ON_HELD") return "on_hold";
  return "pending";
}

function mapApiRequestStatus(value: unknown): "pending" | "accepted" | "rejected" | undefined {
  if (value == null || value === "") return undefined;
  const normalized = String(value).toUpperCase();
  if (normalized === "ACCEPTED") return "accepted";
  if (normalized === "REJECTED") return "rejected";
  return "pending";
}

export function mapAppStatusToApiStatus(status: RegistrationStatus): string {
  const map: Record<RegistrationStatus, string> = {
    pending: "PENDING",
    accepted: "ACCEPTED",
    rejected: "REJECTED",
    on_hold: "HELD",
  };
  return map[status];
}

export function mapAppRequestStatusToApi(status: "accepted" | "rejected"): string {
  return status === "accepted" ? "ACCEPTED" : "REJECTED";
}

function mapApiParticipationDate(value: unknown): ParticipationDate {
  const date = String(value ?? "");
  if (API_DATE_TO_PARTICIPATION[date]) {
    return API_DATE_TO_PARTICIPATION[date];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date as ParticipationDate;
  }
  return "21st";
}

export function formatParticipationDateDisplay(value: unknown): string {
  const date = String(value ?? "");
  if (API_DATE_TO_PARTICIPATION[date]) {
    const key = API_DATE_TO_PARTICIPATION[date];
    if (key === "21st") return "21st August";
    if (key === "22nd") return "22nd August";
  }
  if (!date) return "—";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function mapApiFoodPreference(value: unknown): FoodPreference {
  const normalized = fromApiEnum(String(value ?? "VEG"));
  const allowed: FoodPreference[] = [
    "veg", "jain", "vegan", "satvik", "egg_veg", "pescetarian", "gluten_free",
    "lactose_free", "diabetic_friendly", "nut_allergy", "halal", "non_veg_chicken", "non_veg_any",
  ];
  return allowed.includes(normalized as FoodPreference) ? (normalized as FoodPreference) : "veg";
}

function mapApiMedicalSupport(value: unknown): MedicalSupportType | undefined {
  if (value == null || value === "") return undefined;
  const normalized = fromApiEnum(String(value));
  if (normalized === "other") return "other_medical";
  const allowed: MedicalSupportType[] = [
    "wheel_chair", "mobility_assistance", "attender", "blind_companion", "hearing_impaired",
    "sign_language_interpreter", "oxygen_support", "guide_dog", "reserved_seating", "other_medical",
  ];
  return allowed.includes(normalized as MedicalSupportType)
    ? (normalized as MedicalSupportType)
    : "other_medical";
}

function mapApiTranslationLanguage(value: unknown): TranslationLanguage | undefined {
  if (value == null || value === "") return undefined;
  const normalized = fromApiEnum(String(value));
  const allowed: TranslationLanguage[] = [
    "hindi", "english", "kannada", "tamil", "telugu", "malayalam", "punjabi",
    "bengali", "marathi", "gujarati", "odia", "assamese", "urdu",
  ];
  return allowed.includes(normalized as TranslationLanguage)
    ? (normalized as TranslationLanguage)
    : undefined;
}

const TRAVEL_ARRANGEMENT_MAP: Record<TravelType, string> = {
  flight_taxi_hotel: "FLIGHT_TAXI_HOTEL",
  taxi_hotel: "TAXI_HOTEL",
  hotel_only: "HOTEL_ONLY",
  taxi_only: "TAXI_ONLY",
  flight_only: "FLIGHT_ONLY",
  train_only: "TRAIN_ONLY",
};

function toApiEnum(value: string): string {
  return value.toUpperCase();
}

function extractParticipationDatesFromApi(raw: Record<string, unknown>): string[] {
  const dates = raw.participation_dates;
  if (Array.isArray(dates)) {
    return dates
      .map((item) => {
        if (item && typeof item === "object" && "date" in item) {
          return String((item as { date: unknown }).date);
        }
        return typeof item === "string" ? item : "";
      })
      .filter(Boolean);
  }

  if (raw.participation_date) {
    return [String(raw.participation_date)];
  }

  return [];
}

export function toRegistrationApiPayload(
  data: RegistrationFormData,
  event?: Pick<Event, "date" | "endDate"> | null,
) {
  return {
    event: Number(data.eventId),
    participation_dates: resolveParticipationDatesForApi(data.participationDate, event),
    participation_time: data.participationTime === "full_day" ? "FULL_DAY" : "HALF_DAY",
    food_preference: toApiEnum(data.foodPreference),
    travel_arrangement: data.travelRequired && data.travelType
      ? TRAVEL_ARRANGEMENT_MAP[data.travelType]
      : null,
    medical_support: data.medicalSupportRequired && data.medicalSupportType
      ? toApiEnum(data.medicalSupportType)
      : null,
    translation_language: data.translationRequired && data.translationLanguage
      ? toApiEnum(data.translationLanguage)
      : null,
  };
}

export function extractRegistrationList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown[] }).results)) {
    return (data as { results: Record<string, unknown>[] }).results;
  }
  return [];
}

export function mapApiRegistrationToRegistration(
  raw: Record<string, unknown>,
  eventId?: string
): Registration {
  const now = new Date().toISOString();
  const travelArrangement = raw.travel_arrangement;
  const travelKey = travelArrangement ? String(travelArrangement).toUpperCase() : "";
  const participationTime: ParticipationTime = String(raw.participation_time ?? "FULL_DAY")
    .toUpperCase()
    .includes("HALF")
    ? "half_day"
    : "full_day";

  const apiParticipationDates = extractParticipationDatesFromApi(raw);
  const participationDate =
    apiParticipationDates.length > 1
      ? "both_days"
      : mapApiParticipationDate(apiParticipationDates[0]);
  const participationDateLabel =
    apiParticipationDates.length > 0
      ? apiParticipationDates.map((date) => formatParticipationDateDisplay(date)).join(", ")
      : formatParticipationDateDisplay(raw.participation_date);

  return {
    id: String(raw.id ?? raw.pk ?? ""),
    userId: String(raw.user ?? raw.user_id ?? raw.userId ?? ""),
    eventId: String(eventId ?? raw.event ?? raw.event_id ?? raw.eventId ?? ""),
    userName: String(raw.user_name ?? raw.userName ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone_number ?? raw.phone ?? ""),
    participationDate,
    participationDateLabel,
    participationTime,
    foodPreference: mapApiFoodPreference(raw.food_preference),
    travelRequired: travelArrangement != null && travelArrangement !== "",
    travelType: travelKey && travelKey !== "SELF_ARRANGED" ? API_TRAVEL_TO_APP[travelKey] : undefined,
    travelArrangementLabel: travelKey ? formatTravelArrangementLabel(travelKey) : undefined,
    travelStatus: mapApiRequestStatus(raw.travel_status),
    medicalSupportRequired: raw.medical_support != null && raw.medical_support !== "",
    medicalSupportType: mapApiMedicalSupport(raw.medical_support),
    translationRequired: raw.translation_language != null && raw.translation_language !== "",
    translationLanguage: mapApiTranslationLanguage(raw.translation_language),
    translationStatus: mapApiRequestStatus(raw.translation_status),
    status: mapApiStatus(raw.status),
    createdAt: String(raw.created_at ?? now),
    updatedAt: String(raw.updated_at ?? now),
  };
}

import axios from "axios";
import { getEventDayDates, resolveParticipationDatesForApi } from "@/lib/participation-dates";
import type { Event } from "@/types";
import type {
  FoodPreference,
  MedicalSupportType,
  AttendanceMode,
  ParticipationDate,
  ParticipationTime,
  Registration,
  RegistrationFormData,
  RegistrationStatus,
  AssistanceActionStatus,
  AssistanceRequestStatus,
  SessionRegistration,
  RegistrationDay,
  TranslationAssistanceItem,
  TranslationAssistanceRow,
  MedicalAssistanceItem,
  MedicalAssistanceRow,
  AccommodationAssistanceRow,
  TranslationLanguage,
  TravelAssistanceItem,
  TravelAssistanceRow,
  TravelType,
} from "@/types";

const DUPLICATE_REGISTRATION_PATTERNS = [
  "user, event must make a unique set",
  "you have already registered for this event",
];

function isDuplicateRegistrationMessage(message: unknown): boolean {
  const normalized = String(message).toLowerCase();
  return DUPLICATE_REGISTRATION_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function hasDuplicateRegistrationMessage(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;

  const errors = (data as Record<string, unknown>).non_field_errors;
  if (!Array.isArray(errors)) return false;

  return errors.some(isDuplicateRegistrationMessage);
}

export function isDuplicateRegistrationError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return hasDuplicateRegistrationMessage(error.response?.data);
  }

  if (error instanceof Error) {
    return isDuplicateRegistrationMessage(error.message);
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
  if (normalized === "HOLD" || normalized === "ON_HOLD") return "on_hold";
  return "pending";
}

function mapApiRequestStatus(value: unknown): AssistanceRequestStatus {
  if (value == null || value === "") return "pending";
  const normalized = String(value).toUpperCase();
  if (normalized === "ACCEPTED" || normalized === "APPROVED") return "accepted";
  if (normalized === "REJECTED") return "rejected";
  if (normalized === "HOLD" || normalized === "ON_HOLD") return "on_hold";
  return "pending";
}

export function mapAppStatusToApiStatus(status: RegistrationStatus): string {
  const map: Record<RegistrationStatus, string> = {
    pending: "PENDING",
    accepted: "ACCEPTED",
    rejected: "REJECTED",
    on_hold: "HOLD",
  };
  return map[status];
}

export function mapAppRequestStatusToApi(status: AssistanceActionStatus): string {
  return mapAppStatusToApiStatus(status);
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

function mapApiAttendanceMode(value: unknown): AttendanceMode {
  const normalized = String(value ?? "PHYSICAL").toUpperCase();
  if (normalized === "VIRTUAL" || normalized === "ONLINE") return "virtual";
  return "physical";
}

function formatAttendanceModeLabel(mode: AttendanceMode): string {
  return mode === "virtual" ? "Virtual" : "Physical";
}

/** List API `registration_dates: [{ date, mode }]` (also accepts legacy date strings). */
function extractRegistrationDateEntriesFromApi(
  raw: Record<string, unknown>,
): { date: string; attendanceMode?: AttendanceMode }[] {
  const candidates = [raw.registration_dates, raw.participation_dates];

  for (const dates of candidates) {
    if (!Array.isArray(dates)) continue;
    return dates
      .map((item) => {
        if (item && typeof item === "object") {
          const entry = item as Record<string, unknown>;
          const date = String(entry.date ?? "");
          if (!date) return null;
          const modeRaw = entry.mode ?? entry.attendance_mode;
          const hasMode = modeRaw != null && String(modeRaw).trim() !== "";
          return {
            date,
            attendanceMode: hasMode ? mapApiAttendanceMode(modeRaw) : undefined,
          };
        }
        if (typeof item === "string" && item.trim()) {
          return { date: item.trim() };
        }
        return null;
      })
      .filter((entry): entry is { date: string; attendanceMode?: AttendanceMode } => entry != null);
  }

  if (raw.participation_date) {
    return [{ date: String(raw.participation_date) }];
  }

  return [];
}

const DEFAULT_ATTENDANCE_MODES: AttendanceMode[] = ["physical", "virtual"];

export function mapApiAllowedAttendanceModes(values: unknown): AttendanceMode[] {
  if (!Array.isArray(values) || values.length === 0) {
    return DEFAULT_ATTENDANCE_MODES;
  }

  const mapped = values
    .map((value) => mapApiAttendanceMode(value))
    .filter((mode, index, list) => list.indexOf(mode) === index);

  return mapped.length > 0 ? mapped : DEFAULT_ATTENDANCE_MODES;
}

function mapApiFoodPreference(value: unknown): FoodPreference {
  if (value == null || value === "") return "veg";
  const normalized = String(value).toUpperCase();
  if (API_FOOD_TO_APP[normalized]) {
    return API_FOOD_TO_APP[normalized];
  }
  const legacy = fromApiEnum(normalized);
  const allowed: FoodPreference[] = [
    "veg", "jain", "vegan", "satvik", "egg_veg", "pescetarian", "gluten_free",
    "lactose_free", "diabetic_friendly", "nut_allergy", "halal", "non_veg_chicken", "non_veg_any",
  ];
  return allowed.includes(legacy as FoodPreference) ? (legacy as FoodPreference) : "veg";
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

const FOOD_PREFERENCE_TO_API: Record<FoodPreference, string> = {
  veg: "VEG",
  jain: "JAIN",
  vegan: "VEGAN",
  satvik: "SATVIK",
  egg_veg: "EGG_VEG",
  pescetarian: "PESCETARIAN",
  gluten_free: "GLUTEN_FREE",
  lactose_free: "LACTOSE_FREE",
  diabetic_friendly: "DIABETIC_FRIENDLY",
  nut_allergy: "NUT_ALLERGY",
  halal: "HALAL",
  non_veg_chicken: "NON_VEG_CHICKEN",
  non_veg_any: "NON_VEG_ANY",
};

const API_FOOD_TO_APP: Record<string, FoodPreference> = Object.fromEntries(
  Object.entries(FOOD_PREFERENCE_TO_API).map(([app, api]) => [api, app as FoodPreference]),
) as Record<string, FoodPreference>;

// Legacy API values
API_FOOD_TO_APP.VEGETARIAN = "veg";
API_FOOD_TO_APP.EGG_VEGETARIAN = "egg_veg";

const ATTENDANCE_MODE_TO_API: Record<AttendanceMode, string> = {
  physical: "PHYSICAL",
  virtual: "VIRTUAL",
};

function mapAppParticipationTimeToApi(time: ParticipationTime): string {
  return time === "full_day" ? "FULL_DAY" : "HALF_DAY";
}

export function mapAppAttendanceModeToApi(mode: AttendanceMode): string {
  return ATTENDANCE_MODE_TO_API[mode];
}

export function mapAppAllowedAttendanceModesToApi(modes: AttendanceMode[]): string[] {
  return modes.map(mapAppAttendanceModeToApi);
}

/** Registration `sessions[].attendance_mode` values (PHYSICAL / VIRTUAL). */
export function mapAppAttendanceModeToRegistrationSessionApi(mode: AttendanceMode): string {
  return mapAppAttendanceModeToApi(mode);
}

function mapAppFoodPreferenceToApi(preference: FoodPreference): string {
  return FOOD_PREFERENCE_TO_API[preference];
}

function resolveRegistrationDetails(raw: Record<string, unknown>): Record<string, unknown> {
  const nested = raw.details;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return raw;
}

function mapApiParticipationTime(value: unknown): ParticipationTime {
  const normalized = String(value ?? "FULL_DAY").toUpperCase();
  return normalized === "HALF_DAY" || normalized === "HALF" ? "half_day" : "full_day";
}

export function toRegistrationPreferencesPayload(
  preferences: {
    travelRequired: boolean;
    travelType?: TravelType;
    medicalSupportRequired: boolean;
    medicalSupportType?: MedicalSupportType;
  },
) {
  return {
    details: {
      travel_arrangement: preferences.travelRequired && preferences.travelType
        ? TRAVEL_ARRANGEMENT_MAP[preferences.travelType]
        : "SELF_ARRANGED",
      medical_support: preferences.medicalSupportRequired && preferences.medicalSupportType
        ? preferences.medicalSupportType.toUpperCase()
        : null,
    },
  };
}

export type RegistrationScheduleType = "WHOLE_DAY" | "MULTI_SESSION";

export function toRegistrationApiPayload(
  data: RegistrationFormData,
  options?: {
    userId?: string;
    scheduleType?: RegistrationScheduleType;
  },
) {
  const payload: Record<string, unknown> = {
    event: Number(data.eventId),
  };

  if (options?.userId) {
    payload.user = Number(options.userId);
  }

  const scheduleType = options?.scheduleType ?? "WHOLE_DAY";

  if (scheduleType === "MULTI_SESSION") {
    const dayIds = data.selectedDayIds ?? [];
    payload.sessions = dayIds.map((dayId) => ({
      day: Number(dayId),
      attendance_mode: mapAppAttendanceModeToRegistrationSessionApi(
        data.attendanceByDay?.[dayId] ?? data.attendanceMode ?? "physical",
      ),
      session_ids: (data.sessionsByDay?.[dayId] ?? [])
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id)),
    }));
  } else {
    payload.attendance_mode = mapAppAttendanceModeToApi(data.attendanceMode ?? "physical");
    payload.day_ids = (data.selectedDayIds ?? [])
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id));
  }

  return payload;
}

export function toRegistrationUpdatePayload(
  data: Pick<
    RegistrationFormData,
    | "eventId"
    | "participationDate"
    | "selectedDayIds"
    | "selectedSessionIds"
    | "sessionsByDay"
    | "attendanceByDay"
    | "attendanceMode"
  > & {
    participationTime?: ParticipationTime;
  },
  options?: {
    userId?: string;
    scheduleType?: RegistrationScheduleType;
  },
) {
  return toRegistrationApiPayload(
    {
      ...data,
      participationTime: data.participationTime ?? "full_day",
      salutation: "",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
    },
    {
      userId: options?.userId,
      scheduleType: options?.scheduleType ?? "WHOLE_DAY",
    },
  );
}

export function resolveParticipationDateStringsForApi(
  participationDates: string[],
  event?: Pick<Event, "date" | "endDate"> | null,
): string[] {
  if (participationDates.length === 0) {
    return getEventDayDates(event);
  }

  if (participationDates.includes("both_days")) {
    return getEventDayDates(event);
  }

  return participationDates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date));
}

export function toLobbyRegistrationApiPayload(
  userId: string,
  data: {
    eventId: string;
    selectedDayIds?: string[];
    selectedSessionIds?: string[];
    sessionsByDay?: Record<string, string[]>;
    attendanceByDay?: Record<string, AttendanceMode>;
    attendanceMode?: AttendanceMode;
  },
  options?: {
    scheduleType?: RegistrationScheduleType;
  },
) {
  const scheduleType = options?.scheduleType ?? "WHOLE_DAY";
  const payload: Record<string, unknown> = {
    user: Number(userId),
    event: Number(data.eventId),
  };

  if (scheduleType === "MULTI_SESSION") {
    const dayIds = data.selectedDayIds ?? [];
    payload.sessions = dayIds.map((dayId) => ({
      day: Number(dayId),
      attendance_mode: mapAppAttendanceModeToRegistrationSessionApi(
        data.attendanceByDay?.[dayId] ?? data.attendanceMode ?? "physical",
      ),
      session_ids: (data.sessionsByDay?.[dayId] ?? data.selectedSessionIds ?? [])
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id)),
    }));
  } else {
    payload.attendance_mode = data.attendanceMode
      ? mapAppAttendanceModeToApi(data.attendanceMode)
      : "";
    payload.day_ids = (data.selectedDayIds ?? [])
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id));
  }

  return payload;
}

export function toAdminRegistrationApiPayload(
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
  options?: {
    scheduleType?: RegistrationScheduleType;
  },
) {
  return toRegistrationUpdatePayload(data, {
    userId,
    scheduleType: options?.scheduleType,
  });
}

export function extractRegistrationList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown[] }).results)) {
    return (data as { results: Record<string, unknown>[] }).results;
  }
  return [];
}

function mapApiTravelAssistanceItems(raw: Record<string, unknown>): TravelAssistanceItem[] {
  const list = raw.travel_assistance;
  if (!Array.isArray(list)) return [];

  return list.map((item) => {
    const entry = item as Record<string, unknown>;
    const transportMode = String(entry.transport_mode ?? "").toUpperCase();
    return {
      id: String(entry.id ?? ""),
      transportMode,
      transportModeLabel: formatTravelArrangementLabel(transportMode),
      sourceLocation: String(entry.source_location ?? ""),
      destinationLocation: String(entry.destination_location ?? ""),
      travelDate: String(entry.travel_date ?? ""),
      status: mapApiRequestStatus(entry.status) ?? "pending",
    };
  });
}

function mapApiTranslationAssistanceItem(
  raw: Record<string, unknown>,
): TranslationAssistanceItem | undefined {
  const entry = raw.translation_assistance;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return undefined;

  const assistance = entry as Record<string, unknown>;
  const language = mapApiTranslationLanguage(assistance.language);
  if (!language) return undefined;

  return {
    id: String(assistance.id ?? ""),
    language,
    requiredDate: String(assistance.date ?? ""),
    status: mapApiRequestStatus(assistance.status) ?? "pending",
  };
}

function mapApiMedicalAssistanceItem(
  raw: Record<string, unknown>,
): MedicalAssistanceItem | undefined {
  const entry = raw.medical_assistance;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return undefined;

  const assistance = entry as Record<string, unknown>;
  const medicalNeeds = String(assistance.medical_needs ?? "").trim();
  if (!medicalNeeds) return undefined;

  return {
    id: String(assistance.id ?? ""),
    medicalNeeds,
    requiredDate: String(assistance.date ?? ""),
    status: mapApiRequestStatus(assistance.status) ?? "pending",
  };
}

export function flattenTravelAssistanceRows(registrations: Registration[]): TravelAssistanceRow[] {
  return registrations.flatMap((registration) =>
    (registration.travelAssistance ?? []).map((item) => ({
      ...item,
      registrationId: registration.id,
      userName: registration.userName,
      email: registration.email,
      phone: registration.phone,
    })),
  );
}

function mapAssistanceUserFields(raw: Record<string, unknown>) {
  return {
    userName: String(raw.user_name ?? raw.userName ?? ""),
    email: String(raw.user_email ?? raw.email ?? ""),
    phone: String(raw.user_phone ?? raw.phone_number ?? raw.phone ?? ""),
  };
}

function mapApiTravelAssistanceRow(raw: Record<string, unknown>): TravelAssistanceRow {
  const transportMode = String(raw.transport_mode ?? "").toUpperCase();
  return {
    id: String(raw.id ?? ""),
    transportMode,
    transportModeLabel: formatTravelArrangementLabel(transportMode),
    sourceLocation: String(raw.source_location ?? ""),
    destinationLocation: String(raw.destination_location ?? ""),
    travelDate: String(raw.travel_date ?? ""),
    status: mapApiRequestStatus(raw.status) ?? "pending",
    registrationId: String(raw.registration_id ?? raw.registration ?? ""),
    ...mapAssistanceUserFields(raw),
  };
}

function mapApiMedicalAssistanceRow(raw: Record<string, unknown>): MedicalAssistanceRow {
  return {
    id: String(raw.id ?? ""),
    medicalNeeds: String(raw.medical_needs ?? "").trim(),
    requiredDate: String(raw.date ?? ""),
    status: mapApiRequestStatus(raw.status) ?? "pending",
    registrationId: String(raw.registration_id ?? raw.registration ?? ""),
    ...mapAssistanceUserFields(raw),
  };
}

export function mapApiMedicalAssistanceList(data: unknown): MedicalAssistanceRow[] {
  const list = extractRegistrationList(data);
  if (list.length === 0) return [];

  if (list[0].medical_needs != null) {
    return list.map((raw) => mapApiMedicalAssistanceRow(raw));
  }

  return flattenMedicalAssistanceRows(
    list.map((raw) => mapApiRegistrationToRegistration(raw)),
  );
}

function mapApiAccommodationAssistanceRow(raw: Record<string, unknown>): AccommodationAssistanceRow {
  return {
    id: String(raw.id ?? ""),
    eventId: String(raw.event_id ?? raw.event ?? raw.registration__event ?? ""),
    hotelName: String(raw.hotel_name ?? "").trim(),
    address: String(raw.address ?? "").trim(),
    roomNo: String(raw.room_no ?? "").trim(),
    fromDate: String(raw.from_date ?? ""),
    toDate: String(raw.to_date ?? ""),
    status: mapApiRequestStatus(raw.status) ?? "pending",
    registrationId: String(raw.registration_id ?? raw.registration ?? ""),
    ...mapAssistanceUserFields(raw),
  };
}

export function mapApiAccommodationAssistanceList(data: unknown): AccommodationAssistanceRow[] {
  const list = extractRegistrationList(data);
  if (list.length === 0) return [];

  if (list[0].hotel_name != null) {
    return list.map((raw) => mapApiAccommodationAssistanceRow(raw));
  }

  return [];
}

function mapApiTranslationAssistanceRow(raw: Record<string, unknown>): TranslationAssistanceRow | null {
  const language = mapApiTranslationLanguage(raw.language);
  if (!language) return null;

  return {
    id: String(raw.id ?? ""),
    language,
    requiredDate: String(raw.date ?? ""),
    status: mapApiRequestStatus(raw.status) ?? "pending",
    registrationId: String(raw.registration_id ?? raw.registration ?? ""),
    ...mapAssistanceUserFields(raw),
  };
}

export function mapApiTranslationAssistanceList(data: unknown): TranslationAssistanceRow[] {
  const list = extractRegistrationList(data);
  if (list.length === 0) return [];

  if (list[0].language != null && list[0].medical_needs == null && list[0].transport_mode == null) {
    return list
      .map((raw) => mapApiTranslationAssistanceRow(raw))
      .filter((row): row is TranslationAssistanceRow => row != null);
  }

  return flattenTranslationAssistanceRows(
    list.map((raw) => mapApiRegistrationToRegistration(raw)),
  );
}

export function mapApiTravelAssistanceList(data: unknown): TravelAssistanceRow[] {
  const list = extractRegistrationList(data);
  if (list.length === 0) return [];

  if (list[0].transport_mode != null) {
    return list.map((raw) => mapApiTravelAssistanceRow(raw));
  }

  return flattenTravelAssistanceRows(
    list.map((raw) => mapApiRegistrationToRegistration(raw)),
  );
}

export function flattenTranslationAssistanceRows(
  registrations: Registration[],
): TranslationAssistanceRow[] {
  return registrations.flatMap((registration) => {
    const assistance = registration.translationAssistance;
    if (!assistance) return [];

    return [{
      ...assistance,
      registrationId: registration.id,
      userName: registration.userName,
      email: registration.email,
      phone: registration.phone,
    }];
  });
}

export function flattenMedicalAssistanceRows(
  registrations: Registration[],
): MedicalAssistanceRow[] {
  return registrations.flatMap((registration) => {
    const assistance = registration.medicalAssistance;
    if (!assistance) return [];

    return [{
      ...assistance,
      registrationId: registration.id,
      userName: registration.userName,
      email: registration.email,
      phone: registration.phone,
    }];
  });
}

function mapApiSessionRegistration(entry: Record<string, unknown>): SessionRegistration {
  return {
    id: String(entry.id ?? ""),
    registrationId: String(entry.registration ?? ""),
    scheduleItemId: String(entry.session ?? entry.schedule_item ?? ""),
    sessionTitle: String(entry.session_title ?? ""),
    date: String(entry.date ?? ""),
    startTime: String(entry.start_time ?? ""),
    endTime: String(entry.end_time ?? ""),
    track: String(entry.track ?? ""),
    status: mapApiRequestStatus(entry.status) ?? "pending",
    registeredAt: String(entry.registered_at ?? entry.created_at ?? ""),
  };
}

function mapApiRegistrationDays(raw: Record<string, unknown>): RegistrationDay[] {
  const list = raw.days;
  if (!Array.isArray(list)) return [];

  return list.map((item) => {
    const entry = item as Record<string, unknown>;
    const sessions = Array.isArray(entry.sessions)
      ? entry.sessions.map((session) =>
          mapApiSessionRegistration(session as Record<string, unknown>),
        )
      : [];
    const dayNumberRaw = entry.day_number;
    return {
      id: String(entry.id ?? ""),
      dayId: String(entry.day ?? entry.event_day ?? ""),
      dayNumber:
        dayNumberRaw == null || dayNumberRaw === ""
          ? undefined
          : Number(dayNumberRaw),
      date: String(entry.date ?? ""),
      attendanceMode: mapApiAttendanceMode(entry.attendance_mode),
      sessions,
    };
  });
}

function mapApiSessionRegistrations(raw: Record<string, unknown>): SessionRegistration[] {
  const list = raw.session_registrations;
  if (Array.isArray(list)) {
    return list.map((item) =>
      mapApiSessionRegistration(item as Record<string, unknown>),
    );
  }

  const days = raw.days;
  if (Array.isArray(days)) {
    const seen = new Set<string>();
    const flattened: SessionRegistration[] = [];
    for (const day of days) {
      const daySessions = (day as Record<string, unknown>).sessions;
      if (!Array.isArray(daySessions)) continue;
      for (const session of daySessions) {
        const mapped = mapApiSessionRegistration(session as Record<string, unknown>);
        if (seen.has(mapped.id)) continue;
        seen.add(mapped.id);
        flattened.push(mapped);
      }
    }
    return flattened;
  }

  return [];
}

function mapApiSelectedDayIds(raw: Record<string, unknown>): string[] {
  const candidates = [
    raw.day_ids,
    raw.selected_day_ids,
    raw.registered_day_ids,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    return candidate
      .map((item) => {
        if (item && typeof item === "object" && "id" in item) {
          return String((item as { id: unknown }).id);
        }
        return String(item ?? "");
      })
      .filter(Boolean);
  }

  const dayRegistrations = raw.day_registrations ?? raw.days;
  if (Array.isArray(dayRegistrations)) {
    return dayRegistrations
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const entry = item as Record<string, unknown>;
        return String(entry.day ?? entry.event_day ?? entry.day_id ?? "");
      })
      .filter(Boolean);
  }

  return [];
}

export function mapApiRegistrationToRegistration(
  raw: Record<string, unknown>,
  eventId?: string
): Registration {
  const now = new Date().toISOString();
  const details = resolveRegistrationDetails(raw);
  const travelAssistance = mapApiTravelAssistanceItems(raw);
  const translationAssistance = mapApiTranslationAssistanceItem(raw);
  const medicalAssistance = mapApiMedicalAssistanceItem(raw);
  const registrationDays = mapApiRegistrationDays(raw);
  const sessionRegistrations = mapApiSessionRegistrations(raw);
  const selectedDayIds = mapApiSelectedDayIds(raw);
  const firstTravel = travelAssistance[0];
  const travelKey = firstTravel?.transportMode ?? "";
  const legacyTravelArrangement = details.travel_arrangement ?? raw.travel_arrangement;
  const legacyTravelKey = legacyTravelArrangement
    ? String(legacyTravelArrangement).toUpperCase()
    : travelKey;
  const participationTime = mapApiParticipationTime(raw.participation_time);

  const apiRegistrationDateEntries = extractRegistrationDateEntriesFromApi(raw);
  const apiParticipationDates = apiRegistrationDateEntries.map((entry) => entry.date);
  const participationDate =
    apiParticipationDates.length > 1
      ? "both_days"
      : mapApiParticipationDate(apiParticipationDates[0]);
  const participationDateLabel =
    apiRegistrationDateEntries.length > 0
      ? apiRegistrationDateEntries
          .map((entry) => formatParticipationDateDisplay(entry.date))
          .join(", ")
      : formatParticipationDateDisplay(raw.participation_date);
  const modesForLabel = apiRegistrationDateEntries
    .map((entry) => entry.attendanceMode)
    .filter((mode): mode is AttendanceMode => mode != null);
  const participationModeLabel =
    modesForLabel.length > 0
      ? modesForLabel.map(formatAttendanceModeLabel).join(", ")
      : undefined;

  const registrationDates = apiRegistrationDateEntries
    .filter(
      (entry): entry is { date: string; attendanceMode: AttendanceMode } =>
        entry.attendanceMode != null,
    )
    .map((entry) => ({
      date: entry.date,
      attendanceMode: entry.attendanceMode,
    }));

  const modesFromDates = registrationDates.map((entry) => entry.attendanceMode);
  const uniqueModesFromDates = [...new Set(modesFromDates)];
  const attendanceModeFromDates =
    uniqueModesFromDates.length === 1 ? uniqueModesFromDates[0] : undefined;

  const registeredSessionsRaw = raw.registered_sessions_count ?? raw.registeredSessionsCount;
  const registeredSessionsCount =
    registeredSessionsRaw == null || registeredSessionsRaw === ""
      ? sessionRegistrations.length > 0
        ? sessionRegistrations.length
        : undefined
      : Number(registeredSessionsRaw);

  const registeredDaysRaw = raw.registered_days_count ?? raw.registeredDaysCount;
  const registeredDaysCount =
    registeredDaysRaw == null || registeredDaysRaw === ""
      ? apiParticipationDates.length > 0
        ? apiParticipationDates.length
        : registrationDays.length > 0
          ? registrationDays.length
          : selectedDayIds.length > 0
            ? selectedDayIds.length
            : undefined
      : Number(registeredDaysRaw);

  const hasAttendanceMode =
    raw.attendance_mode != null && String(raw.attendance_mode).trim() !== "";

  return {
    id: String(raw.id ?? raw.pk ?? ""),
    userId: String(raw.user ?? raw.user_id ?? raw.userId ?? ""),
    eventId: String(eventId ?? raw.event ?? raw.event_id ?? raw.eventId ?? ""),
    eventName: String(raw.event_name ?? raw.event_title ?? raw.eventName ?? "").trim() || undefined,
    userName: String(raw.user_name ?? raw.userName ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone_number ?? raw.phone ?? ""),
    participationDate,
    participationDateLabel,
    participationModeLabel,
    registrationDates: registrationDates.length > 0 ? registrationDates : undefined,
    participationTime,
    registeredDaysCount: Number.isFinite(registeredDaysCount)
      ? registeredDaysCount
      : undefined,
    registeredSessionsCount: Number.isFinite(registeredSessionsCount)
      ? registeredSessionsCount
      : undefined,
    selectedDayIds,
    days: registrationDays,
    sessionRegistrations,
    attendanceMode: hasAttendanceMode
      ? mapApiAttendanceMode(raw.attendance_mode)
      : attendanceModeFromDates,
    foodPreference: mapApiFoodPreference(raw.food_preference ?? details.food_preference),
    travelAssistance,
    translationAssistance,
    medicalAssistance,
    travelRequired: travelAssistance.length > 0 || (legacyTravelKey !== "" && legacyTravelKey !== "SELF_ARRANGED"),
    travelType:
      legacyTravelKey && legacyTravelKey !== "SELF_ARRANGED"
        ? API_TRAVEL_TO_APP[legacyTravelKey]
        : firstTravel
          ? API_TRAVEL_TO_APP[firstTravel.transportMode]
          : undefined,
    travelArrangementLabel: firstTravel?.transportModeLabel
      ?? (legacyTravelKey ? formatTravelArrangementLabel(legacyTravelKey) : undefined),
    travelStatus: firstTravel?.status ?? mapApiRequestStatus(raw.travel_status),
    medicalSupportRequired:
      medicalAssistance != null ||
      raw.medical_assistance != null ||
      ((details.medical_support ?? raw.medical_support) != null &&
        (details.medical_support ?? raw.medical_support) !== ""),
    medicalSupportType: mapApiMedicalSupport(details.medical_support ?? raw.medical_support),
    translationRequired: translationAssistance != null || (
      (details.translation_language ?? raw.translation_language) != null &&
      (details.translation_language ?? raw.translation_language) !== ""
    ),
    translationLanguage:
      translationAssistance?.language
      ?? mapApiTranslationLanguage(details.translation_language ?? raw.translation_language),
    translationStatus:
      translationAssistance?.status
      ?? mapApiRequestStatus(raw.translation_status),
    status: mapApiStatus(raw.status),
    createdAt: String(raw.created_at ?? now),
    updatedAt: String(raw.updated_at ?? now),
  };
}

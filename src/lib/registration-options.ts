export const PARTICIPATION_DATES = [
  { value: "21st", label: "21st August" },
  { value: "22nd", label: "22nd August" },
  { value: "both_days", label: "Both Days (21st & 22nd)" },
] as const;

export const PARTICIPATION_TIMES = [
  { value: "half_day", label: "Half Day" },
  { value: "full_day", label: "Full Day" },
] as const;

import type { AttendanceMode } from "@/types";

export const ATTENDANCE_MODES = [
  { value: "physical", label: "Physical (On-site)" },
  { value: "virtual", label: "Virtual (Online)" },
] as const;

const DEFAULT_ATTENDANCE_MODES: AttendanceMode[] = ["physical", "virtual"];

export function getAttendanceModeOptions(allowedModes?: AttendanceMode[]) {
  const allowed = allowedModes?.length ? allowedModes : DEFAULT_ATTENDANCE_MODES;
  return ATTENDANCE_MODES.filter((option) => allowed.includes(option.value));
}

export function normalizeAttendanceMode(
  mode: AttendanceMode | undefined,
  allowedModes?: AttendanceMode[],
): AttendanceMode {
  const allowed = allowedModes?.length ? allowedModes : DEFAULT_ATTENDANCE_MODES;
  if (mode && allowed.includes(mode)) return mode;
  return allowed[0] ?? "physical";
}

export function getSharedAttendanceModeOptions(
  days: Array<{ allowedAttendanceModes?: AttendanceMode[] }>,
) {
  if (days.length === 0) return getAttendanceModeOptions();

  const intersection = days.reduce<AttendanceMode[]>((acc, day, index) => {
    const dayModes = day.allowedAttendanceModes?.length
      ? day.allowedAttendanceModes
      : DEFAULT_ATTENDANCE_MODES;
    if (index === 0) return [...dayModes];
    return acc.filter((mode) => dayModes.includes(mode));
  }, []);

  return getAttendanceModeOptions(intersection.length > 0 ? intersection : ["physical"]);
}

export const TRAVEL_TYPES = [
  { value: "flight_taxi_hotel", label: "Flight + Taxi + Hotel" },
  { value: "taxi_hotel", label: "Taxi + Hotel" },
  { value: "hotel_only", label: "Hotel Only" },
  { value: "taxi_only", label: "Taxi Only" },
  { value: "flight_only", label: "Flight Only" },
  { value: "train_only", label: "Train Only" },
] as const;

export const FOOD_PREFERENCES = [
  { value: "veg", label: "Vegetarian" },
  { value: "jain", label: "Jain" },
  { value: "vegan", label: "Vegan" },
  { value: "satvik", label: "Satvik" },
  { value: "egg_veg", label: "Egg Vegetarian" },
  { value: "pescetarian", label: "Pescetarian" },
  { value: "gluten_free", label: "Gluten Free" },
  { value: "lactose_free", label: "Lactose Free" },
  { value: "diabetic_friendly", label: "Diabetic Friendly" },
  { value: "nut_allergy", label: "Nut Allergy" },
  { value: "halal", label: "Halal" },
  { value: "non_veg_chicken", label: "Non Veg (Chicken Only)" },
  { value: "non_veg_any", label: "Non Veg (Any)" },
] as const;

export const MEDICAL_SUPPORT_TYPES = [
  { value: "wheel_chair", label: "Wheelchair Access" },
  { value: "mobility_assistance", label: "Mobility Assistance" },
  { value: "attender", label: "Personal Attender" },
  { value: "blind_companion", label: "Blind Companion / Guide" },
  { value: "hearing_impaired", label: "Hearing Impaired Support" },
  { value: "sign_language_interpreter", label: "Sign Language Interpreter" },
  { value: "oxygen_support", label: "Oxygen Support" },
  { value: "guide_dog", label: "Guide Dog Accommodation" },
  { value: "reserved_seating", label: "Reserved Seating (Medical)" },
  { value: "other_medical", label: "Other Medical Requirement" },
] as const;

export const TRANSLATION_LANGUAGES = [
  { value: "hindi", label: "Hindi" },
  { value: "english", label: "English" },
  { value: "kannada", label: "Kannada" },
  { value: "tamil", label: "Tamil" },
  { value: "telugu", label: "Telugu" },
  { value: "malayalam", label: "Malayalam" },
  { value: "punjabi", label: "Punjabi" },
  { value: "bengali", label: "Bengali" },
  { value: "marathi", label: "Marathi" },
  { value: "gujarati", label: "Gujarati" },
  { value: "odia", label: "Odia" },
  { value: "assamese", label: "Assamese" },
  { value: "urdu", label: "Urdu" },
] as const;

export type TravelTypeValue = (typeof TRAVEL_TYPES)[number]["value"];
export type ParticipationDateValue = (typeof PARTICIPATION_DATES)[number]["value"];
export type ParticipationTimeValue = (typeof PARTICIPATION_TIMES)[number]["value"];
export type AttendanceModeValue = (typeof ATTENDANCE_MODES)[number]["value"];
export type FoodPreferenceValue = (typeof FOOD_PREFERENCES)[number]["value"];
export type MedicalSupportValue = (typeof MEDICAL_SUPPORT_TYPES)[number]["value"];
export type TranslationLanguageValue = (typeof TRANSLATION_LANGUAGES)[number]["value"];

export const TRAVEL_TYPE_VALUES = TRAVEL_TYPES.map((o) => o.value);
export const PARTICIPATION_DATE_VALUES = PARTICIPATION_DATES.map((o) => o.value);
export const ATTENDANCE_MODE_VALUES = ATTENDANCE_MODES.map((o) => o.value);
export const FOOD_PREFERENCE_VALUES = FOOD_PREFERENCES.map((o) => o.value);
export const MEDICAL_SUPPORT_VALUES = MEDICAL_SUPPORT_TYPES.map((o) => o.value);
export const TRANSLATION_LANGUAGE_VALUES = TRANSLATION_LANGUAGES.map((o) => o.value);

export const REGISTRATION_OPTION_LABELS: Record<string, string> = Object.fromEntries([
  ...PARTICIPATION_DATES,
  ...PARTICIPATION_TIMES,
  ...ATTENDANCE_MODES,
  ...TRAVEL_TYPES,
  ...FOOD_PREFERENCES,
  ...MEDICAL_SUPPORT_TYPES,
  ...TRANSLATION_LANGUAGES,
].map((o) => [o.value, o.label]));

export function getRegistrationOptionLabel(value: string): string {
  return REGISTRATION_OPTION_LABELS[value] ?? value.replace(/_/g, " ");
}

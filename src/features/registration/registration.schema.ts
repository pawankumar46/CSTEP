import { z } from "zod";
import {
  FOOD_PREFERENCE_VALUES,
  MEDICAL_SUPPORT_VALUES,
  TRANSLATION_LANGUAGE_VALUES,
  type FoodPreferenceValue,
  type MedicalSupportValue,
  type TranslationLanguageValue,
} from "@/lib/registration-options";
const foodEnum = z.enum(FOOD_PREFERENCE_VALUES as [FoodPreferenceValue, ...FoodPreferenceValue[]]);
const medicalEnum = z.enum(MEDICAL_SUPPORT_VALUES as [MedicalSupportValue, ...MedicalSupportValue[]]);
const languageEnum = z.enum(TRANSLATION_LANGUAGE_VALUES as [TranslationLanguageValue, ...TranslationLanguageValue[]]);

export const registrationSchema = z.object({
  eventId: z.string().min(1, "Please select an event"),
  salutation: z.string().min(1, "Salutation is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
  participationDate: z.string().min(1, "Please select a participation date"),
  participationTime: z.enum(["half_day", "full_day"]),
  foodPreference: foodEnum,
  travelRequired: z.boolean(),
  travelType: z.enum(["flight_taxi_hotel", "taxi_hotel", "hotel_only", "taxi_only", "flight_only", "train_only"]).optional(),
  medicalSupportRequired: z.boolean(),
  medicalSupportType: medicalEnum.optional(),
  translationRequired: z.boolean(),
  translationLanguage: languageEnum.optional(),
}).refine((data) => !data.travelRequired || data.travelType, {
  message: "Travel type is required",
  path: ["travelType"],
}).refine((data) => !data.medicalSupportRequired || data.medicalSupportType, {
  message: "Medical support type is required",
  path: ["medicalSupportType"],
}).refine((data) => !data.translationRequired || data.translationLanguage, {
  message: "Translation language is required",
  path: ["translationLanguage"],
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;

export const REGISTRATION_STEPS = [
  { title: "Select Event", fields: ["eventId"] as const },
  { title: "Personal Info", fields: ["salutation", "firstName", "middleName", "lastName", "phone", "email"] as const },
  { title: "Participation", fields: ["participationDate", "participationTime"] as const },
  { title: "Food", fields: ["foodPreference"] as const },
  { title: "Travel", fields: ["travelRequired", "travelType"] as const },
  { title: "Medical", fields: ["medicalSupportRequired", "medicalSupportType"] as const },
  { title: "Translation", fields: ["translationRequired", "translationLanguage"] as const },
  { title: "Review", fields: [] as const },
];

import { z } from "zod";
import {
  FOOD_PREFERENCE_VALUES,
  type FoodPreferenceValue,
} from "@/lib/registration-options";

const foodEnum = z.enum(FOOD_PREFERENCE_VALUES as [FoodPreferenceValue, ...FoodPreferenceValue[]]);

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
  attendanceMode: z.enum(["physical", "virtual"]),
  foodPreference: foodEnum,
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;

export const REGISTRATION_STEPS = [
  { title: "Select Event", fields: ["eventId"] as const },
  { title: "Personal Info", fields: ["salutation", "firstName", "middleName", "lastName", "phone", "email"] as const },
  { title: "Participation", fields: ["participationDate", "participationTime", "attendanceMode"] as const },
  { title: "Food", fields: ["foodPreference"] as const },
  { title: "Review", fields: [] as const },
];

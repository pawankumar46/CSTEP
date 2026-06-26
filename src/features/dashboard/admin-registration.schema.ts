import { z } from "zod";
import {
  FOOD_PREFERENCE_VALUES,
  type FoodPreferenceValue,
} from "@/lib/registration-options";

const foodEnum = z.enum(FOOD_PREFERENCE_VALUES as [FoodPreferenceValue, ...FoodPreferenceValue[]]);

export const registrationEditSchema = z.object({
  eventId: z.string().min(1, "Please select an event"),
  participationDate: z.string().min(1, "Please select a participation date"),
  participationTime: z.enum(["half_day", "full_day"]),
  attendanceMode: z.enum(["physical", "virtual"]),
  foodPreference: foodEnum,
});

export type RegistrationEditFormValues = z.infer<typeof registrationEditSchema>;

export const EMPTY_REGISTRATION_EDIT: RegistrationEditFormValues = {
  eventId: "",
  participationDate: "",
  participationTime: "full_day",
  attendanceMode: "physical",
  foodPreference: "veg",
};

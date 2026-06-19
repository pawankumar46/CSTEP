import { z } from "zod";
import {
  MEDICAL_SUPPORT_VALUES,
  TRAVEL_TYPE_VALUES,
  type MedicalSupportValue,
} from "@/lib/registration-options";

const medicalEnum = z.enum(MEDICAL_SUPPORT_VALUES as [MedicalSupportValue, ...MedicalSupportValue[]]);
const travelEnum = z.enum(TRAVEL_TYPE_VALUES as [typeof TRAVEL_TYPE_VALUES[number], ...typeof TRAVEL_TYPE_VALUES[number][]]);

export const profilePreferencesSchema = z.object({
  travelRequired: z.boolean(),
  travelType: travelEnum.optional(),
  medicalSupportRequired: z.boolean(),
  medicalSupportType: medicalEnum.optional(),
}).refine((data) => !data.travelRequired || data.travelType, {
  message: "Travel type is required",
  path: ["travelType"],
}).refine((data) => !data.medicalSupportRequired || data.medicalSupportType, {
  message: "Medical support type is required",
  path: ["medicalSupportType"],
});

export type ProfilePreferencesFormValues = z.infer<typeof profilePreferencesSchema>;

import { z } from "zod";

export const adminMedicalAssistSchema = z.object({
  eventId: z.string().min(1, "Please select an event"),
  userId: z.string().min(1, "Select a user"),
  medicalRequirement: z.string().min(1, "Medical requirement is required"),
  medicalRequiredDate: z.string().min(1, "Required date is required"),
});

export type AdminMedicalAssistFormValues = z.infer<typeof adminMedicalAssistSchema>;

export const medicalEditSchema = adminMedicalAssistSchema.omit({ userId: true });

export type MedicalEditFormValues = z.infer<typeof medicalEditSchema>;

export const EMPTY_MEDICAL_EDIT: MedicalEditFormValues = {
  eventId: "",
  medicalRequirement: "",
  medicalRequiredDate: "",
};

export const EMPTY_ADMIN_MEDICAL: AdminMedicalAssistFormValues = {
  eventId: "",
  userId: "",
  medicalRequirement: "",
  medicalRequiredDate: "",
};

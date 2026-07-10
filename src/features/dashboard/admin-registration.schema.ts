import { z } from "zod";

export const registrationEditSchema = z.object({
  eventId: z.string().min(1, "Please select an event"),
  participationDate: z.string().optional(),
  selectedDayIds: z.array(z.string()),
  selectedSessionIds: z.array(z.string()),
  attendanceMode: z.enum(["physical", "virtual"]),
});

export type RegistrationEditFormValues = z.infer<typeof registrationEditSchema>;

export const EMPTY_REGISTRATION_EDIT: RegistrationEditFormValues = {
  eventId: "",
  participationDate: "",
  selectedDayIds: [],
  selectedSessionIds: [],
  attendanceMode: "physical",
};

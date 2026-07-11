import { z } from "zod";

export const registrationEditSchema = z.object({
  eventId: z.string().min(1, "Please select an event"),
  participationDate: z.string().optional(),
  selectedDayIds: z.array(z.string()),
  selectedSessionIds: z.array(z.string()),
  sessionsByDay: z.record(z.string(), z.array(z.string())),
  attendanceByDay: z.record(z.string(), z.enum(["physical", "virtual"])),
  attendanceMode: z.enum(["physical", "virtual"]),
});

export type RegistrationEditFormValues = z.infer<typeof registrationEditSchema>;

export const EMPTY_REGISTRATION_EDIT: RegistrationEditFormValues = {
  eventId: "",
  participationDate: "",
  selectedDayIds: [],
  selectedSessionIds: [],
  sessionsByDay: {},
  attendanceByDay: {},
  attendanceMode: "physical",
};

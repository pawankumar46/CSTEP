import { z } from "zod";

export const registrationSchema = z.object({
  eventId: z.string().min(1, "Please select an event"),
  salutation: z.string().min(1, "Salutation is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
  participationDate: z.string().optional(),
  participationTime: z.enum(["half_day", "full_day"]),
  selectedDayIds: z.array(z.string()),
  selectedSessionIds: z.array(z.string()),
  attendanceMode: z.enum(["physical", "virtual"]),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;

export const REGISTRATION_STEPS = [
  { title: "Select Event", fields: ["eventId"] as const },
  { title: "Personal Info", fields: ["salutation", "firstName", "middleName", "lastName", "phone", "email"] as const },
  { title: "Participation", fields: ["participationDate", "attendanceMode"] as const },
  { title: "Review", fields: [] as const },
];

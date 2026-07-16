import { z } from "zod";
import {
  EMPTY_PUBLIC_SIGNUP,
  refineSignupForm,
  signupBaseFields,
} from "@/features/auth/signup.schema";

const lobbyUserRegistrationFields = {
  eventId: z.string().min(1, "Please select an event"),
  participationDate: z.string().optional(),
  selectedDayIds: z.array(z.string()),
  selectedSessionIds: z.array(z.string()),
  sessionsByDay: z.record(z.string(), z.array(z.string())),
  attendanceByDay: z.record(z.string(), z.enum(["physical", "virtual"])),
  attendanceMode: z.enum(["physical", "virtual"]),
} as const;

export const lobbyUserSignupSchema = z
  .object(signupBaseFields)
  .superRefine(refineSignupForm);

export const lobbyUserRegistrationSchema = z.object(lobbyUserRegistrationFields);

export const addLobbyUserSchema = z
  .object({
    ...signupBaseFields,
    ...lobbyUserRegistrationFields,
  })
  .superRefine(refineSignupForm);

export type LobbyUserSignupFormValues = z.infer<typeof lobbyUserSignupSchema>;
export type LobbyUserRegistrationFormValues = z.infer<typeof lobbyUserRegistrationSchema>;
export type AddLobbyUserFormValues = z.infer<typeof addLobbyUserSchema>;

export const EMPTY_LOBBY_USER_SIGNUP: LobbyUserSignupFormValues = {
  ...EMPTY_PUBLIC_SIGNUP,
};

export const EMPTY_LOBBY_USER_REGISTRATION: LobbyUserRegistrationFormValues = {
  eventId: "",
  participationDate: "",
  selectedDayIds: [],
  selectedSessionIds: [],
  sessionsByDay: {},
  attendanceByDay: {},
  attendanceMode: "physical",
};

export const EMPTY_ADD_LOBBY_USER: AddLobbyUserFormValues = {
  ...EMPTY_LOBBY_USER_SIGNUP,
  ...EMPTY_LOBBY_USER_REGISTRATION,
};

export const LOBBY_USER_SALUTATIONS = ["Mr", "Mrs", "Ms", "Dr", "Prof"] as const;

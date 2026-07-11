import { z } from "zod";
import {
  EMPTY_SIGNUP_ADDRESS,
  signupAddressSchema,
} from "@/features/auth/signup.schema";

const lobbyUserSignupFields = {
  salutation: z.string().min(1, "Salutation is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  email: z.string().email("Valid email is required"),
  address: signupAddressSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
} as const;

const lobbyUserRegistrationFields = {
  eventId: z.string().min(1, "Please select an event"),
  participationDate: z.string().optional(),
  selectedDayIds: z.array(z.string()),
  selectedSessionIds: z.array(z.string()),
  sessionsByDay: z.record(z.string(), z.array(z.string())),
  attendanceByDay: z.record(z.string(), z.enum(["physical", "virtual"])),
  attendanceMode: z.enum(["physical", "virtual"]),
} as const;

function refineLobbyPasswordMatch(
  data: { password: string; confirmPassword: string },
  ctx: z.RefinementCtx,
) {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  }
}

export const lobbyUserSignupSchema = z
  .object(lobbyUserSignupFields)
  .superRefine(refineLobbyPasswordMatch);

export const lobbyUserRegistrationSchema = z.object(lobbyUserRegistrationFields);

export const addLobbyUserSchema = z
  .object({
    ...lobbyUserSignupFields,
    ...lobbyUserRegistrationFields,
  })
  .superRefine(refineLobbyPasswordMatch);

export type LobbyUserSignupFormValues = z.infer<typeof lobbyUserSignupSchema>;
export type LobbyUserRegistrationFormValues = z.infer<typeof lobbyUserRegistrationSchema>;
export type AddLobbyUserFormValues = z.infer<typeof addLobbyUserSchema>;

export const EMPTY_LOBBY_USER_SIGNUP: LobbyUserSignupFormValues = {
  salutation: "Mr",
  firstName: "",
  middleName: "",
  lastName: "",
  phone: "",
  email: "",
  address: { ...EMPTY_SIGNUP_ADDRESS },
  password: "",
  confirmPassword: "",
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

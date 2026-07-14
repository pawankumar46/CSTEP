import { z } from "zod";

export const SIGNUP_ORG_TYPES = [
  { value: "ORGANISATION", label: "Institution or Organisation" },
  { value: "INDEPENDENT", label: "Independent" },
] as const;

export type SignupOrgTypeValue = (typeof SIGNUP_ORG_TYPES)[number]["value"];

const requiredText = (message: string) =>
  z.string().trim().min(1, message);

export const signupAddressSchema = z.object({
  addressLine1: requiredText("Address line 1 is required"),
  addressLine2: z.string().trim().optional(),
  city: requiredText("City is required"),
  district: requiredText("District is required"),
  state: requiredText("State is required"),
  country: requiredText("Country is required"),
  postalCode: requiredText("Postal code is required"),
});

export type SignupAddressFormValues = z.infer<typeof signupAddressSchema>;

export const EMPTY_SIGNUP_ADDRESS: SignupAddressFormValues = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "",
  state: "",
  country: "India",
  postalCode: "",
};

const signupOrgTypeEnum = z.enum(["ORGANISATION", "INDEPENDENT"]);

const signupBaseFields = {
  salutation: z.string().min(1, "Salutation is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  email: z.string().email("Valid email is required"),
  designation: requiredText("Designation is required"),
  orgType: signupOrgTypeEnum,
  orgName: z.string().trim().optional(),
  motivation: requiredText("Please tell us what motivates you to attend"),
  city: requiredText("City is required"),
  state: requiredText("State is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
} as const;

export const publicSignupSchema = z
  .object(signupBaseFields)
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
    if (data.orgType === "ORGANISATION" && !(data.orgName ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Organisation name is required",
        path: ["orgName"],
      });
    }
  });

export type PublicSignupFormValues = z.infer<typeof publicSignupSchema>;

export const EMPTY_PUBLIC_SIGNUP: PublicSignupFormValues = {
  salutation: "",
  firstName: "",
  middleName: "",
  lastName: "",
  phone: "",
  email: "",
  designation: "",
  orgType: "INDEPENDENT",
  orgName: "",
  motivation: "",
  city: "",
  state: "",
  password: "",
  confirmPassword: "",
};

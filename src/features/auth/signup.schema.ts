import { z } from "zod";
import {
  DEFAULT_COUNTRY_CODE,
  isIndiaCountryCode,
  maxPhoneDigitsForCountry,
} from "@/lib/country-codes";
import { DEFAULT_SIGNUP_COUNTRY } from "@/lib/india-states";

export const SIGNUP_ORG_TYPES = [
  { value: "ORGANISATION", label: "Institution or Organisation" },
  { value: "INDEPENDENT", label: "Independent" },
] as const;

export type SignupOrgTypeValue = (typeof SIGNUP_ORG_TYPES)[number]["value"];

export const SIGNUP_GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

export type SignupGenderValue = (typeof SIGNUP_GENDERS)[number]["value"];

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
  country: DEFAULT_SIGNUP_COUNTRY,
  postalCode: "",
};

const signupOrgTypeEnum = z.enum(["ORGANISATION", "INDEPENDENT"]);

export const signupBaseFields = {
  salutation: z.string().min(1, "Salutation is required"),
  firstName: requiredText("First name is required"),
  middleName: z.string().optional(),
  lastName: requiredText("Last name is required"),
  countryCode: z
    .string()
    .min(1, "Country code is required")
    .regex(/^\+\d{1,4}$/, "Select a valid country code"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\d+$/, "Phone number must contain digits only"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Valid email is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    message: "Gender is required",
  }),
  designation: requiredText("Designation is required"),
  orgType: signupOrgTypeEnum,
  orgName: z.string().trim().optional(),
  motivation: requiredText("Please tell us what motivates you to attend"),
  city: requiredText("City is required"),
  /** Required for +91 (dropdown); omitted/empty for other country codes. */
  state: z.string(),
  /** Required for non-+91 (text field); +91 sends India via mapper (field hidden). */
  country: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
} as const;

export type SignupBaseFormValues = z.infer<z.ZodObject<typeof signupBaseFields>>;

export function refineSignupForm(
  data: SignupBaseFormValues,
  ctx: z.RefinementCtx,
) {
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

  const maxDigits = maxPhoneDigitsForCountry(data.countryCode);
  if (data.phone.length !== maxDigits) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        data.countryCode === DEFAULT_COUNTRY_CODE
          ? "Phone number must be exactly 10 digits"
          : `Phone number must be exactly ${maxDigits} digits for ${data.countryCode}`,
      path: ["phone"],
    });
  }

  if (isIndiaCountryCode(data.countryCode) && !data.state.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "State / UT is required",
      path: ["state"],
    });
  }

  if (!isIndiaCountryCode(data.countryCode) && !data.country.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Country is required",
      path: ["country"],
    });
  }
}

export const publicSignupSchema = z
  .object(signupBaseFields)
  .superRefine(refineSignupForm);

export type PublicSignupFormValues = z.infer<typeof publicSignupSchema>;

export const EMPTY_PUBLIC_SIGNUP: PublicSignupFormValues = {
  salutation: "",
  firstName: "",
  middleName: "",
  lastName: "",
  countryCode: DEFAULT_COUNTRY_CODE,
  phone: "",
  email: "",
  gender: "" as PublicSignupFormValues["gender"],
  designation: "",
  orgType: "INDEPENDENT",
  orgName: "",
  motivation: "",
  city: "",
  state: "",
  country: DEFAULT_SIGNUP_COUNTRY,
  password: "",
  confirmPassword: "",
};

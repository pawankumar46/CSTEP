import { z } from "zod";

export const signupAddressSchema = z.object({
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  district: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
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

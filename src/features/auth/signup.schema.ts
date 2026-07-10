import { z } from "zod";

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

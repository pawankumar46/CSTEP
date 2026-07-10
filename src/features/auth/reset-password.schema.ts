import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    otp: z.string().length(6, "Please enter the 6-digit OTP"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

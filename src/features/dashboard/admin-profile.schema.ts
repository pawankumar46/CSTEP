import { z } from "zod";

const requiredText = (message: string) => z.string().trim().min(1, message);

export const profileDetailsSchema = z.object({
  salutation: z.string().trim().optional(),
  firstName: requiredText("First name is required"),
  middleName: z.string().trim().optional(),
  lastName: requiredText("Last name is required"),
});

export type ProfileDetailsFormValues = z.infer<typeof profileDetailsSchema>;

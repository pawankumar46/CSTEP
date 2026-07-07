import { z } from "zod";

export const feedbackSchema = z.object({
  sessionDate: z.string().min(1, "Please select a date"),
  sessionTitle: z.string().min(1, "Please select a session"),
  rating: z.number().min(1, "Please select a rating").max(5),
  comments: z.string().min(10, "Please provide at least 10 characters"),
});

export type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export const EMPTY_FEEDBACK_FORM: FeedbackFormValues = {
  sessionDate: "",
  sessionTitle: "",
  rating: 0,
  comments: "",
};

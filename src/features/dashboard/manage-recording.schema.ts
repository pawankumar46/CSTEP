import { z } from "zod";

export const manageRecordingSchema = z
  .object({
    eventDayId: z.string().min(1, "Select a date"),
    scheduleItemId: z.string().min(1, "Select a session"),
    sourceType: z.enum(["url", "file"]),
    recordingUrl: z.string(),
    recordingFile: z.unknown().optional(),
  })
  .superRefine((values, context) => {
    if (values.sourceType === "url") {
      const parsed = z.string().url().safeParse(values.recordingUrl.trim());
      if (!parsed.success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid recording URL",
          path: ["recordingUrl"],
        });
      }
    }

    if (values.sourceType === "file" && !values.recordingFile) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a recording file",
        path: ["recordingFile"],
      });
    } else if (
      values.sourceType === "file" &&
      values.recordingFile instanceof File &&
      values.recordingFile.type !== "video/mp4" &&
      !values.recordingFile.name.toLowerCase().endsWith(".mp4")
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose an MP4 video file",
        path: ["recordingFile"],
      });
    }
  });

export type ManageRecordingFormValues = z.infer<typeof manageRecordingSchema>;

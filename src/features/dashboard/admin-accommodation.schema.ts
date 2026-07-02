import { z } from "zod";
import { refineDateNotInPast } from "@/lib/date-input";

const accommodationDetailFields = {
  hotelName: z.string().min(1, "Hotel name is required"),
  hotelAddress: z.string().min(1, "Address is required"),
  roomNo: z.string().min(1, "Room number is required"),
  accommodationFromDate: z.string().min(1, "From date is required"),
  accommodationToDate: z.string().min(1, "To date is required"),
} as const;

type AccommodationDetailValues = {
  hotelName: string;
  hotelAddress: string;
  roomNo: string;
  accommodationFromDate: string;
  accommodationToDate: string;
};

function refineAccommodationDates(data: AccommodationDetailValues, ctx: z.RefinementCtx) {
  refineDateNotInPast(
    data.accommodationFromDate,
    ctx,
    "accommodationFromDate",
    "From date",
  );
  refineDateNotInPast(data.accommodationToDate, ctx, "accommodationToDate", "To date");

  if (
    data.accommodationFromDate?.trim() &&
    data.accommodationToDate?.trim() &&
    data.accommodationToDate < data.accommodationFromDate
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "To date must be on or after from date",
      path: ["accommodationToDate"],
    });
  }
}

export const adminAccommodationAssistSchema = z.object({
  eventId: z.string().min(1, "Please select an event"),
  userId: z.string().min(1, "Select a user"),
  ...accommodationDetailFields,
});

export type AdminAccommodationAssistFormValues = z.infer<typeof adminAccommodationAssistSchema>;

export const accommodationEditSchema = z
  .object({
    eventId: z.string().min(1, "Please select an event"),
    ...accommodationDetailFields,
  })
  .superRefine(refineAccommodationDates);

export type AccommodationEditFormValues = z.infer<typeof accommodationEditSchema>;

export const accommodationDetailsSchema = z
  .object(accommodationDetailFields)
  .superRefine(refineAccommodationDates);

export type AccommodationAssistDetailsValues = z.infer<typeof accommodationDetailsSchema>;

export const EMPTY_ACCOMMODATION_DETAILS: AccommodationAssistDetailsValues = {
  hotelName: "",
  hotelAddress: "",
  roomNo: "",
  accommodationFromDate: "",
  accommodationToDate: "",
};

export const EMPTY_ACCOMMODATION_EDIT: AccommodationEditFormValues = {
  eventId: "",
  ...EMPTY_ACCOMMODATION_DETAILS,
};

export const EMPTY_ADMIN_ACCOMMODATION: AdminAccommodationAssistFormValues = {
  eventId: "",
  userId: "",
  ...EMPTY_ACCOMMODATION_DETAILS,
};

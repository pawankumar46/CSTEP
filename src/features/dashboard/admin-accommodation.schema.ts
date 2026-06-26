import { z } from "zod";

export const adminAccommodationAssistSchema = z.object({
  eventId: z.string().min(1, "Please select an event"),
  userId: z.string().min(1, "Select a user"),
  hotelName: z.string().min(1, "Hotel name is required"),
  hotelAddress: z.string().min(1, "Address is required"),
  roomNo: z.string().min(1, "Room number is required"),
  accommodationFromDate: z.string().min(1, "From date is required"),
  accommodationToDate: z.string().min(1, "To date is required"),
});

export type AdminAccommodationAssistFormValues = z.infer<typeof adminAccommodationAssistSchema>;

export const accommodationEditSchema = adminAccommodationAssistSchema.omit({
  userId: true,
});

export type AccommodationEditFormValues = z.infer<typeof accommodationEditSchema>;

export const accommodationDetailsSchema = accommodationEditSchema.omit({
  eventId: true,
});

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

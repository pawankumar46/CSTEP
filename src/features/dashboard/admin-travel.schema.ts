import { z } from "zod";
import { TRANSPORT_MODES } from "@/features/profile/event-support.schema";
import { isDateBeforeToday } from "@/lib/date-input";

const travelTransportFields = {
  transportMode: z.enum(TRANSPORT_MODES),
  departureCity: z.string().optional(),
  arrivalCity: z.string().optional(),
  departureDate: z.string().optional(),
  pickupAddress: z.string().optional(),
  dropAddress: z.string().optional(),
  travelDate: z.string().optional(),
} as const;

type TravelTransportValues = {
  transportMode: (typeof TRANSPORT_MODES)[number];
  departureCity?: string;
  arrivalCity?: string;
  departureDate?: string;
  pickupAddress?: string;
  dropAddress?: string;
  travelDate?: string;
};

function refineTravelTransport(data: TravelTransportValues, ctx: z.RefinementCtx) {
  if (data.transportMode === "flight" || data.transportMode === "train") {
    if (!data.departureCity?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Departure city is required",
        path: ["departureCity"],
      });
    }
    if (!data.arrivalCity?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Arrival city is required",
        path: ["arrivalCity"],
      });
    }
    if (!data.departureDate?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Departure date is required",
        path: ["departureDate"],
      });
    }
  }

  if (data.transportMode === "taxi") {
    if (!data.pickupAddress?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pickup address is required",
        path: ["pickupAddress"],
      });
    }
    if (!data.dropAddress?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Drop address is required",
        path: ["dropAddress"],
      });
    }
    if (!data.travelDate?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Travel date is required",
        path: ["travelDate"],
      });
    }
  }
}

function refineTravelEditDates(data: TravelTransportValues, ctx: z.RefinementCtx) {
  refineTravelTransport(data, ctx);

  if (data.departureDate?.trim() && isDateBeforeToday(data.departureDate.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Travel date cannot be in the past",
      path: ["departureDate"],
    });
  }

  if (data.travelDate?.trim() && isDateBeforeToday(data.travelDate.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Travel date cannot be in the past",
      path: ["travelDate"],
    });
  }
}

export const travelEditSchema = z
  .object({
    eventId: z.string().min(1, "Please select an event"),
    ...travelTransportFields,
  })
  .superRefine(refineTravelEditDates);

export type TravelEditFormValues = z.infer<typeof travelEditSchema>;

export const adminTravelAssistSchema = z
  .object({
    eventId: z.string().min(1, "Please select an event"),
    userId: z.string().min(1, "Select a user"),
    ...travelTransportFields,
  })
  .superRefine(refineTravelTransport);

export type AdminTravelAssistFormValues = z.infer<typeof adminTravelAssistSchema>;

export const EMPTY_TRAVEL_EDIT: TravelEditFormValues = {
  eventId: "",
  departureCity: "",
  arrivalCity: "",
  departureDate: "",
  pickupAddress: "",
  dropAddress: "",
  travelDate: "",
  transportMode: "flight",
};

export const EMPTY_ADMIN_TRAVEL: AdminTravelAssistFormValues = {
  eventId: "",
  userId: "",
  departureCity: "",
  arrivalCity: "",
  departureDate: "",
  pickupAddress: "",
  dropAddress: "",
  travelDate: "",
  transportMode: "flight",
};

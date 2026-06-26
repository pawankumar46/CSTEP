import { z } from "zod";
import {
  TRANSLATION_LANGUAGE_VALUES,
  type TranslationLanguageValue,
} from "@/lib/registration-options";

export const SERVICE_TYPES = ["travel", "medical", "translation", "accommodation"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const TRANSPORT_MODES = ["flight", "train", "taxi"] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

const translationLanguageEnum = z.enum(
  TRANSLATION_LANGUAGE_VALUES as [TranslationLanguageValue, ...TranslationLanguageValue[]],
);

export const eventSupportSchema = z
  .object({
    serviceType: z.enum(SERVICE_TYPES),
    eventId: z.string().optional(),
    transportMode: z.enum(TRANSPORT_MODES).optional(),
    departureCity: z.string().optional(),
    arrivalCity: z.string().optional(),
    departureDate: z.string().optional(),
    pickupAddress: z.string().optional(),
    dropAddress: z.string().optional(),
    travelDate: z.string().optional(),
    medicalRequirement: z.string().optional(),
    medicalRequiredDate: z.string().optional(),
    translationLanguage: translationLanguageEnum.optional(),
    translationRequiredDate: z.string().optional(),
    hotelName: z.string().optional(),
    hotelAddress: z.string().optional(),
    roomNo: z.string().optional(),
    accommodationFromDate: z.string().optional(),
    accommodationToDate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.eventId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select an event",
        path: ["eventId"],
      });
    }

    if (data.serviceType === "travel") {
      if (!data.transportMode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a mode of transport",
          path: ["transportMode"],
        });
      }

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

    if (data.serviceType === "medical") {
      if (!data.medicalRequirement?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Medical requirement is required",
          path: ["medicalRequirement"],
        });
      }
      if (!data.medicalRequiredDate?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required date is required",
          path: ["medicalRequiredDate"],
        });
      }
    }

    if (data.serviceType === "translation") {
      if (!data.translationLanguage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a language",
          path: ["translationLanguage"],
        });
      }
      if (!data.translationRequiredDate?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required date is required",
          path: ["translationRequiredDate"],
        });
      }
    }

    if (data.serviceType === "accommodation") {
      if (!data.hotelName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Hotel name is required",
          path: ["hotelName"],
        });
      }
      if (!data.hotelAddress?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Address is required",
          path: ["hotelAddress"],
        });
      }
      if (!data.roomNo?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Room number is required",
          path: ["roomNo"],
        });
      }
      if (!data.accommodationFromDate?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "From date is required",
          path: ["accommodationFromDate"],
        });
      }
      if (!data.accommodationToDate?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "To date is required",
          path: ["accommodationToDate"],
        });
      }
    }
  });

export type EventSupportFormValues = z.infer<typeof eventSupportSchema>;

export const EMPTY_EVENT_SUPPORT: EventSupportFormValues = {
  serviceType: "travel",
  eventId: "",
  departureCity: "",
  arrivalCity: "",
  departureDate: "",
  pickupAddress: "",
  dropAddress: "",
  travelDate: "",
  medicalRequirement: "",
  medicalRequiredDate: "",
  translationRequiredDate: "",
  hotelName: "",
  hotelAddress: "",
  roomNo: "",
  accommodationFromDate: "",
  accommodationToDate: "",
};

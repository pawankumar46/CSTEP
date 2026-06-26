import { z } from "zod";
import {
  TRANSLATION_LANGUAGE_VALUES,
  type TranslationLanguageValue,
} from "@/lib/registration-options";

const translationLanguageEnum = z.enum(
  TRANSLATION_LANGUAGE_VALUES as [TranslationLanguageValue, ...TranslationLanguageValue[]],
);

export const adminTranslationAssistSchema = z.object({
  eventId: z.string().min(1, "Please select an event"),
  userId: z.string().min(1, "Select a user"),
  translationLanguage: translationLanguageEnum,
  translationRequiredDate: z.string().min(1, "Required date is required"),
});

export type AdminTranslationAssistFormValues = z.infer<typeof adminTranslationAssistSchema>;

export const translationEditSchema = adminTranslationAssistSchema.omit({ userId: true });

export type TranslationEditFormValues = z.infer<typeof translationEditSchema>;

export const EMPTY_TRANSLATION_EDIT: TranslationEditFormValues = {
  eventId: "",
  translationLanguage: "english",
  translationRequiredDate: "",
};

export const EMPTY_ADMIN_TRANSLATION: AdminTranslationAssistFormValues = {
  eventId: "",
  userId: "",
  translationLanguage: "english",
  translationRequiredDate: "",
};

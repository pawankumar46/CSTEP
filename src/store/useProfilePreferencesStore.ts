import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProfilePreferencesFormValues } from "@/features/profile/profile-preferences.schema";

interface ProfilePreferencesState {
  byEmail: Record<string, ProfilePreferencesFormValues>;
  getForEmail: (email: string) => ProfilePreferencesFormValues | null;
  setForEmail: (email: string, preferences: ProfilePreferencesFormValues) => void;
  clearForEmail: (email: string) => void;
}

export const useProfilePreferencesStore = create<ProfilePreferencesState>()(
  persist(
    (set, get) => ({
      byEmail: {},
      getForEmail: (email) => get().byEmail[email.toLowerCase()] ?? null,
      setForEmail: (email, preferences) =>
        set((state) => ({
          byEmail: { ...state.byEmail, [email.toLowerCase()]: preferences },
        })),
      clearForEmail: (email) =>
        set((state) => {
          const next = { ...state.byEmail };
          delete next[email.toLowerCase()];
          return { byEmail: next };
        }),
    }),
    { name: "profile-preferences-storage" },
  ),
);

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EventSupportFormValues } from "@/features/profile/event-support.schema";

interface EventSupportState {
  byEmail: Record<string, EventSupportFormValues>;
  getForEmail: (email: string) => EventSupportFormValues | null;
  setForEmail: (email: string, values: EventSupportFormValues) => void;
  clearForEmail: (email: string) => void;
}

export const useEventSupportStore = create<EventSupportState>()(
  persist(
    (set, get) => ({
      byEmail: {},
      getForEmail: (email) => get().byEmail[email.toLowerCase()] ?? null,
      setForEmail: (email, values) =>
        set((state) => ({
          byEmail: { ...state.byEmail, [email.toLowerCase()]: values },
        })),
      clearForEmail: (email) =>
        set((state) => {
          const key = email.toLowerCase();
          const { [key]: _removed, ...rest } = state.byEmail;
          return { byEmail: rest };
        }),
    }),
    { name: "event-support-storage" },
  ),
);

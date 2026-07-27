import { create } from "zustand";
import type { CreateEventFeedbackPayload } from "@/lib/feedback-mappers";
import { DEFAULT_FEEDBACK_EVENT_ID } from "@/lib/feedback-options";
import * as feedbackService from "@/services/feedback.service";
import type { Feedback } from "@/types";

interface FeedbackStats {
  total: number;
  avgRating: number;
  distribution: { rating: number; count: number }[];
}

interface FeedbackState {
  feedback: Feedback[];
  stats: FeedbackStats | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchFeedback: (eventId?: string) => Promise<void>;
  fetchStats: (eventId?: string) => Promise<void>;
  submitFeedback: (data: Omit<Feedback, "id" | "createdAt">) => Promise<void>;
  submitMultiDayFeedback: (payloads: CreateEventFeedbackPayload[]) => Promise<void>;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  feedback: [],
  stats: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchFeedback: async (eventId = DEFAULT_FEEDBACK_EVENT_ID) => {
    set({ isLoading: true, error: null });
    try {
      const feedback = await feedbackService.getFeedback(eventId);
      set({ feedback, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch feedback",
        isLoading: false,
      });
    }
  },

  fetchStats: async (eventId = DEFAULT_FEEDBACK_EVENT_ID) => {
    try {
      const stats = await feedbackService.getFeedbackStats(eventId);
      set({ stats });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to fetch stats" });
    }
  },

  submitFeedback: async (data) => {
    set({ isSubmitting: true, error: null });
    try {
      const newFeedback = await feedbackService.submitFeedback(data);
      set({
        feedback: [newFeedback, ...get().feedback],
        isSubmitting: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to submit feedback",
        isSubmitting: false,
      });
      throw err;
    }
  },

  submitMultiDayFeedback: async (payloads) => {
    set({ isSubmitting: true, error: null });
    try {
      const created = await feedbackService.submitMultiDayFeedback(payloads);
      set({
        feedback: [...created, ...get().feedback],
        isSubmitting: false,
      });
      void get().fetchFeedback();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to submit feedback",
        isSubmitting: false,
      });
      throw err;
    }
  },
}));

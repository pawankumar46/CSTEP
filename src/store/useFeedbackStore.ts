import { create } from "zustand";
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
  error: string | null;
  fetchFeedback: () => Promise<void>;
  fetchStats: () => Promise<void>;
  submitFeedback: (data: Omit<Feedback, "id" | "createdAt">) => Promise<void>;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  feedback: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchFeedback: async () => {
    set({ isLoading: true, error: null });
    try {
      const feedback = await feedbackService.getFeedback();
      set({ feedback, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch feedback",
        isLoading: false,
      });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await feedbackService.getFeedbackStats();
      set({ stats });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to fetch stats" });
    }
  },

  submitFeedback: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newFeedback = await feedbackService.submitFeedback(data);
      set({
        feedback: [newFeedback, ...get().feedback],
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to submit feedback",
        isLoading: false,
      });
      throw err;
    }
  },
}));

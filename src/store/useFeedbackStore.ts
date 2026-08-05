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

interface FeedbackPaginationState {
  page: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const EMPTY_FEEDBACK_PAGINATION: FeedbackPaginationState = {
  page: 1,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

interface FeedbackState {
  feedback: Feedback[];
  feedbackPagination: FeedbackPaginationState;
  stats: FeedbackStats | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchFeedbackPage: (page?: number, eventId?: string) => Promise<void>;
  fetchFeedback: (eventId?: string) => Promise<void>;
  fetchStats: (eventId?: string) => Promise<void>;
  submitFeedback: (data: Omit<Feedback, "id" | "createdAt">) => Promise<void>;
  submitMultiDayFeedback: (payloads: CreateEventFeedbackPayload[]) => Promise<void>;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  feedback: [],
  feedbackPagination: EMPTY_FEEDBACK_PAGINATION,
  stats: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchFeedbackPage: async (page = 1, eventId = DEFAULT_FEEDBACK_EVENT_ID) => {
    set({ isLoading: true, error: null });
    try {
      const result = await feedbackService.getFeedbackListPage(eventId, page);
      set({
        feedback: result.rows,
        feedbackPagination: {
          page: result.page,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrevious: result.hasPrevious,
        },
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch feedback",
        feedback: [],
        feedbackPagination: EMPTY_FEEDBACK_PAGINATION,
        isLoading: false,
      });
    }
  },

  fetchFeedback: async (eventId = DEFAULT_FEEDBACK_EVENT_ID) => {
    set({ isLoading: true, error: null });
    try {
      const feedback = await feedbackService.getFeedback(eventId);
      set({
        feedback,
        feedbackPagination: {
          page: 1,
          total: feedback.length,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
        isLoading: false,
      });
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
      void get().fetchFeedbackPage(get().feedbackPagination.page || 1);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to submit feedback",
        isSubmitting: false,
      });
      throw err;
    }
  },
}));

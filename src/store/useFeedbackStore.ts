import { create } from "zustand";
import type {
  CreateEventFeedbackPayload,
  UpdateEventFeedbackPayload,
} from "@/lib/feedback-mappers";
import { DEFAULT_FEEDBACK_EVENT_ID } from "@/lib/feedback-options";
import * as feedbackService from "@/services/feedback.service";
import type { GetFeedbackParams } from "@/services/feedback.service";
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
  respondentFeedback: Feedback[];
  feedbackPagination: FeedbackPaginationState;
  stats: FeedbackStats | null;
  isLoading: boolean;
  respondentLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  respondentError: string | null;
  fetchFeedbackPage: (page?: number, eventId?: string) => Promise<void>;
  fetchFeedback: (eventId?: string) => Promise<void>;
  fetchRespondentFeedback: (
    params: Omit<GetFeedbackParams, "page" | "pageSize">,
  ) => Promise<void>;
  fetchStats: (eventId?: string) => Promise<void>;
  submitFeedback: (data: Omit<Feedback, "id" | "createdAt">) => Promise<void>;
  submitMultiDayFeedback: (payloads: CreateEventFeedbackPayload[]) => Promise<void>;
  upsertMultiDayFeedback: (args: {
    creates: CreateEventFeedbackPayload[];
    updates: { id: string; payload: UpdateEventFeedbackPayload }[];
  }) => Promise<void>;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  feedback: [],
  respondentFeedback: [],
  feedbackPagination: EMPTY_FEEDBACK_PAGINATION,
  stats: null,
  isLoading: false,
  respondentLoading: false,
  isSubmitting: false,
  error: null,
  respondentError: null,

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

  fetchRespondentFeedback: async (params) => {
    set({ respondentLoading: true, respondentError: null });
    try {
      const respondentFeedback = await feedbackService.getFilteredFeedback(params);
      set({ respondentFeedback, respondentLoading: false });
    } catch (err) {
      set({
        respondentFeedback: [],
        respondentError:
          err instanceof Error ? err.message : "Failed to fetch respondent feedback",
        respondentLoading: false,
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
      void get().fetchFeedback(DEFAULT_FEEDBACK_EVENT_ID);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to submit feedback",
        isSubmitting: false,
      });
      throw err;
    }
  },

  upsertMultiDayFeedback: async ({ creates, updates }) => {
    set({ isSubmitting: true, error: null });
    try {
      const saved = await feedbackService.upsertMultiDayFeedback({ creates, updates });
      set({
        feedback: [...saved, ...get().feedback],
        isSubmitting: false,
      });
      void get().fetchFeedback(DEFAULT_FEEDBACK_EVENT_ID);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to submit feedback",
        isSubmitting: false,
      });
      throw err;
    }
  },
}));

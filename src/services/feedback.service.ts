import { apiClient } from "@/lib/api-client";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import {
  extractFeedbackTotalPages,
  mapApiFeedbackList,
  mapApiFeedbackToFeedback,
  type CreateEventFeedbackPayload,
} from "@/lib/feedback-mappers";
import { DEFAULT_FEEDBACK_EVENT_ID } from "@/lib/feedback-options";
import { delay } from "@/lib/utils";
import { mockFeedback } from "@/mock/feedback";
import type { Feedback } from "@/types";

const FEEDBACK_PAGE_SIZE = 100;

let feedbackList = [...mockFeedback];

export interface GetFeedbackParams {
  eventId?: string;
  page?: number;
  pageSize?: number;
}

/** `GET /events/feedback/` — one page. */
export const getFeedbackPage = async (
  params: GetFeedbackParams = {},
): Promise<{ rows: Feedback[]; totalPages: number; count: number }> => {
  try {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? FEEDBACK_PAGE_SIZE;
    const query: Record<string, string | number> = {
      page,
      page_size: pageSize,
    };
    if (params.eventId) {
      query.event = params.eventId;
    }

    const { data } = await apiClient.get<unknown>("/events/feedback/", {
      params: query,
    });

    const root =
      data && typeof data === "object" ? (data as Record<string, unknown>) : {};

    return {
      rows: mapApiFeedbackList(data),
      totalPages: extractFeedbackTotalPages(data),
      count: Number(root.count ?? 0),
    };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

/** `GET /events/feedback/` — all pages. Prefers event filter, then falls back to unfiltered. */
export const getFeedback = async (eventId?: string): Promise<Feedback[]> => {
  const preferredEventId = eventId ?? DEFAULT_FEEDBACK_EVENT_ID;

  const loadAll = async (filterEventId?: string) => {
    const first = await getFeedbackPage({
      eventId: filterEventId,
      page: 1,
      pageSize: FEEDBACK_PAGE_SIZE,
    });
    const rows = [...first.rows];
    for (let page = 2; page <= first.totalPages; page += 1) {
      const next = await getFeedbackPage({
        eventId: filterEventId,
        page,
        pageSize: FEEDBACK_PAGE_SIZE,
      });
      rows.push(...next.rows);
    }
    return rows;
  };

  const filtered = await loadAll(preferredEventId);
  if (filtered.length > 0) return filtered;

  // Some backends ignore/reject `event` — fall back so UI still shows results.
  return loadAll(undefined);
};

export const submitFeedback = async (
  data: Omit<Feedback, "id" | "createdAt">,
): Promise<Feedback> => {
  await delay(600);
  const newFeedback: Feedback = {
    ...data,
    id: `fb-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  feedbackList = [newFeedback, ...feedbackList];
  return newFeedback;
};

export const createEventFeedback = async (
  payload: CreateEventFeedbackPayload,
): Promise<Feedback | null> => {
  try {
    const { data } = await apiClient.post<unknown>("/events/feedback/", payload);
    if (data && typeof data === "object") {
      return mapApiFeedbackToFeedback(data);
    }
    return null;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

/** Submit one `POST /events/feedback/` per rated session. */
export const submitMultiDayFeedback = async (
  payloads: CreateEventFeedbackPayload[],
): Promise<Feedback[]> => {
  if (payloads.length === 0) return [];
  const created = await Promise.all(payloads.map((payload) => createEventFeedback(payload)));
  return created.filter((item): item is Feedback => item != null);
};

export const getFeedbackStats = async (eventId?: string) => {
  const list = await getFeedback(eventId);
  const total = list.length;
  if (total === 0) {
    return {
      total: 0,
      avgRating: 0,
      distribution: [1, 2, 3, 4, 5].map((rating) => ({ rating, count: 0 })),
    };
  }
  const avgRating = list.reduce((sum, item) => sum + item.rating, 0) / total;
  const distribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: list.filter((item) => Math.round(item.rating) === rating).length,
  }));
  return { total, avgRating: Math.round(avgRating * 10) / 10, distribution };
};

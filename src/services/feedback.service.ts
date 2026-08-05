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

export const FEEDBACK_LIST_PAGE_SIZE = 10;
const FEEDBACK_BULK_FETCH_PAGE_SIZE = 100;

let feedbackList = [...mockFeedback];

export interface FeedbackPageResult {
  rows: Feedback[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface GetFeedbackParams {
  eventId?: string;
  /** Event day id (`event_date` query param — not ISO date). */
  eventDateId?: string;
  userId?: string;
  isOverallRating?: boolean;
  page?: number;
  pageSize?: number;
}

/** `GET /events/feedback/` — one page. */
export const getFeedbackPage = async (
  params: GetFeedbackParams = {},
): Promise<FeedbackPageResult> => {
  try {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? FEEDBACK_LIST_PAGE_SIZE;
    const query: Record<string, string | number> = {
      page,
      page_size: pageSize,
    };
    if (params.eventId) {
      query.event = params.eventId;
    }
    if (params.eventDateId) {
      query.event_date = params.eventDateId;
    }
    if (params.userId) {
      query.user = params.userId;
    }
    if (params.isOverallRating != null) {
      query.is_overall_rating = params.isOverallRating ? "true" : "false";
    }

    const { data } = await apiClient.get<unknown>("/events/feedback/", {
      params: query,
    });

    const root =
      data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const record = root as {
      count?: number;
      total_pages?: number;
      current_page?: number;
      next?: string | null;
      previous?: string | null;
    };
    const total = Number(record.count ?? 0);
    const totalPages = extractFeedbackTotalPages(data);
    const currentPage = Number(record.current_page ?? page);

    return {
      rows: mapApiFeedbackList(data),
      page: Number.isFinite(currentPage) && currentPage > 0 ? currentPage : page,
      pageSize,
      total: Number.isFinite(total) ? total : 0,
      totalPages,
      hasNext: Boolean(record.next),
      hasPrevious: Boolean(record.previous),
    };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

/** Dashboard list — one page (`page_size=10`). */
export const getFeedbackListPage = async (
  eventId: string,
  page = 1,
): Promise<FeedbackPageResult> => {
  return getFeedbackPage({
    eventId,
    page,
    pageSize: FEEDBACK_LIST_PAGE_SIZE,
  });
};

/** `GET /events/feedback/` — all pages. Prefers event filter, then falls back to unfiltered. */
export const getFeedback = async (eventId?: string): Promise<Feedback[]> => {
  const preferredEventId = eventId ?? DEFAULT_FEEDBACK_EVENT_ID;

  const loadAll = async (filterEventId?: string) => {
    const first = await getFeedbackPage({
      eventId: filterEventId,
      page: 1,
      pageSize: FEEDBACK_BULK_FETCH_PAGE_SIZE,
    });
    const rows = [...first.rows];
    for (let page = 2; page <= first.totalPages; page += 1) {
      const next = await getFeedbackPage({
        eventId: filterEventId,
        page,
        pageSize: FEEDBACK_BULK_FETCH_PAGE_SIZE,
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

/** `GET /events/feedback/` filtered by event day id + user (previous submissions for that day). */
export const getUserFeedbackForEventDay = async (
  eventId: string,
  eventDateId: string,
  userId: string,
): Promise<Feedback[]> => {
  try {
    const first = await getFeedbackPage({
      eventId,
      eventDateId,
      userId,
      page: 1,
      pageSize: FEEDBACK_BULK_FETCH_PAGE_SIZE,
    });
    const rows = [...first.rows];
    for (let page = 2; page <= first.totalPages; page += 1) {
      const next = await getFeedbackPage({
        eventId,
        eventDateId,
        userId,
        page,
        pageSize: FEEDBACK_BULK_FETCH_PAGE_SIZE,
      });
      rows.push(...next.rows);
    }
    return rows;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

/** Load prior feedback for each registered day + optional event overall row. */
export const getUserFeedbackForRegisteredDays = async (
  eventId: string,
  userId: string,
  eventDateIds: string[],
): Promise<Feedback[]> => {
  const dayRequests = eventDateIds.map((eventDateId) =>
    getUserFeedbackForEventDay(eventId, eventDateId, userId).catch(() => [] as Feedback[]),
  );
  const overallRequest = getFeedbackPage({
    eventId,
    userId,
    isOverallRating: true,
    page: 1,
    pageSize: FEEDBACK_BULK_FETCH_PAGE_SIZE,
  })
    .then((page) => page.rows)
    .catch(() => [] as Feedback[]);

  const [overall, ...byDay] = await Promise.all([overallRequest, ...dayRequests]);
  return [...byDay.flat(), ...overall];
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

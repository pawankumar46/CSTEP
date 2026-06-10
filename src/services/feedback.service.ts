import { delay } from "@/lib/utils";
import { mockFeedback } from "@/mock/feedback";
import type { Feedback } from "@/types";

let feedbackList = [...mockFeedback];

export const getFeedback = async (): Promise<Feedback[]> => {
  await delay(500);
  return [...feedbackList];
};

export const submitFeedback = async (
  data: Omit<Feedback, "id" | "createdAt">
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

export const getFeedbackStats = async () => {
  await delay(300);
  const total = feedbackList.length;
  const avgRating =
    feedbackList.reduce((sum, f) => sum + f.rating, 0) / total;
  const distribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: feedbackList.filter((f) => f.rating === rating).length,
  }));
  return { total, avgRating: Math.round(avgRating * 10) / 10, distribution };
};

"use client";

import { useEffect } from "react";
import { FeedbackModeratorPanel } from "@/components/feedback/FeedbackModeratorPanel";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { useFeedbackStore } from "@/store/useFeedbackStore";

export default function FeedbackPage() {
  const { feedback, isLoading, fetchFeedback } = useFeedbackStore();

  useEffect(() => {
    void fetchFeedback();
  }, [fetchFeedback]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="text-muted-foreground">
          Session ratings, daily summaries, and event-wide feedback from attendees.
        </p>
      </div>

      <FeedbackModeratorPanel feedback={feedback} />
    </div>
  );
}

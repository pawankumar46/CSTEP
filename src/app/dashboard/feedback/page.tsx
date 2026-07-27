"use client";

import { useEffect } from "react";
import { FeedbackModeratorPanel } from "@/components/feedback/FeedbackModeratorPanel";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { useFeedbackStore } from "@/store/useFeedbackStore";

export default function FeedbackPage() {
  const { feedback, isLoading, error, fetchFeedback } = useFeedbackStore();

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
          {!isLoading && !error ? ` (${feedback.length} response${feedback.length === 1 ? "" : "s"})` : null}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!error && feedback.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No feedback has been submitted yet.
        </div>
      ) : (
        <FeedbackModeratorPanel feedback={feedback} />
      )}
    </div>
  );
}

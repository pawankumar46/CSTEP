"use client";

import { useCallback, useEffect } from "react";
import {
  FeedbackModeratorPanel,
  type RespondentFeedbackFilters,
} from "@/components/feedback/FeedbackModeratorPanel";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { DEFAULT_FEEDBACK_EVENT_ID } from "@/lib/feedback-options";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import { useFeedbackStore } from "@/store/useFeedbackStore";

export default function FeedbackPage() {
  const {
    feedback,
    respondentFeedback,
    respondentPagination,
    isLoading,
    respondentLoading,
    error,
    respondentError,
    fetchFeedback,
    fetchRespondentFeedback,
  } = useFeedbackStore();
  const {
    eventFeedbackAnalytics,
    eventFeedbackAnalyticsLoading,
    eventFeedbackAnalyticsError,
    fetchEventFeedbackAnalytics,
  } = useAnalyticsStore();

  useEffect(() => {
    void fetchFeedback();
    void fetchRespondentFeedback({ eventId: DEFAULT_FEEDBACK_EVENT_ID });
    void fetchEventFeedbackAnalytics(DEFAULT_FEEDBACK_EVENT_ID);
  }, [fetchEventFeedbackAnalytics, fetchFeedback, fetchRespondentFeedback]);

  const handleRespondentFiltersChange = useCallback(
    (filters: RespondentFeedbackFilters) => {
      void fetchRespondentFeedback(filters);
    },
    [fetchRespondentFeedback],
  );

  if (
    isLoading
    && eventFeedbackAnalyticsLoading
    && feedback.length === 0
    && !eventFeedbackAnalytics
  ) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="text-muted-foreground">
          Highlight cards, per-session averages, and respondent details from attendees.
          {!isLoading && !error
            ? ` (${feedback.length} response${feedback.length === 1 ? "" : "s"})`
            : null}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {eventFeedbackAnalyticsError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <p className="text-sm text-destructive">{eventFeedbackAnalyticsError}</p>
        </div>
      )}

      {respondentError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <p className="text-sm text-destructive">{respondentError}</p>
        </div>
      )}

      <FeedbackModeratorPanel
        feedback={feedback}
        respondentFeedback={respondentFeedback}
        respondentPagination={respondentPagination}
        respondentLoading={respondentLoading}
        onRespondentFiltersChange={handleRespondentFiltersChange}
        analytics={eventFeedbackAnalytics}
        analyticsLoading={eventFeedbackAnalyticsLoading}
      />
    </div>
  );
}

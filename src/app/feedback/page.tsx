"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  MultiDayFeedbackForm,
} from "@/components/feedback/MultiDayFeedbackForm";
import { UserFeedbackList } from "@/components/feedback/UserFeedbackList";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StreamingFeedbackFormValues } from "@/features/feedback/streaming-feedback.schema";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { mapStreamingFeedbackToCreatePayloads } from "@/lib/feedback-mappers";
import { resolveFeedbackEventId } from "@/lib/feedback-options";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedbackStore } from "@/store/useFeedbackStore";

function FeedbackContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { upcomingEvent } = useEventRegistration();
  const { feedback, isSubmitting, error, fetchFeedback, submitMultiDayFeedback } = useFeedbackStore();
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const feedbackEventId = resolveFeedbackEventId(upcomingEvent?.id);

  useEffect(() => {
    void fetchFeedback();
  }, [fetchFeedback]);

  const userFeedback = useMemo(() => {
    if (!user) return [];
    const userId = String(user.id);
    return feedback.filter(
      (item) => item.userId === userId || item.userId === user.id,
    );
  }, [feedback, user]);

  const handleSubmit = async (data: StreamingFeedbackFormValues) => {
    if (!user) return;

    setSubmitSuccess(false);
    const payloads = mapStreamingFeedbackToCreatePayloads(data, feedbackEventId);
    await submitMultiDayFeedback(payloads);
    setSubmitSuccess(true);
    router.push(ROUTES.home);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Session Feedback</h1>
        <p className="text-sm text-muted-foreground">
          Rate sessions for each event day, then share your overall ICAS experience. You can also
          submit feedback when leaving the live stream via the Exit button.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {submitSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          Thank you! Your feedback has been submitted.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Multi-day Feedback
          </CardTitle>
          <CardDescription>
            Event-day sessions (from event days) plus ICAS overall feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MultiDayFeedbackForm
            eventId={feedbackEventId}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Submit Feedback"
          />
        </CardContent>
      </Card>

      <UserFeedbackList feedback={userFeedback} />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href={ROUTES.streaming}>Back to Live Stream</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ROUTES.profile}>Back to Profile</Link>
        </Button>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <RouteGuard loginRedirect={ROUTES.feedback}>
      <div className="flex min-h-screen flex-col">
        <LandingNavbar />
        <main className="container mx-auto flex-1 px-4 py-8">
          <FeedbackContent />
        </main>
        <LandingFooter />
      </div>
    </RouteGuard>
  );
}

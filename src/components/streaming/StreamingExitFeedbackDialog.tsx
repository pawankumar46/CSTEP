"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MultiDayFeedbackForm,
  mapStreamingFeedbackToEntries,
} from "@/components/feedback/MultiDayFeedbackForm";
import type { StreamingFeedbackFormValues } from "@/features/feedback/streaming-feedback.schema";
import {
  resolveFeedbackEventId,
  resolveFeedbackEventName,
} from "@/lib/feedback-options";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedbackStore } from "@/store/useFeedbackStore";

interface StreamingExitFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  eventName?: string;
}

export function StreamingExitFeedbackDialog({
  open,
  onOpenChange,
  eventId,
  eventName,
}: StreamingExitFeedbackDialogProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { isSubmitting, submitMultiDayFeedback } = useFeedbackStore();

  const feedbackEventId = resolveFeedbackEventId(eventId);
  const feedbackEventName = resolveFeedbackEventName(eventName);

  const goHome = () => {
    onOpenChange(false);
    router.push(ROUTES.home);
  };

  const handleSubmit = async (data: StreamingFeedbackFormValues) => {
    if (!user) return;

    const entries = mapStreamingFeedbackToEntries(data, {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      eventId: feedbackEventId,
      eventName: feedbackEventName,
    });

    await submitMultiDayFeedback(entries);
    goHome();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
          <DialogDescription>
            Rate sessions for 19, 20, and 21 Aug, then share your overall ICAS experience.
          </DialogDescription>
        </DialogHeader>

        <MultiDayFeedbackForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          showSkip
          onSkip={goHome}
          submitLabel="Submit & Go Home"
        />
      </DialogContent>
    </Dialog>
  );
}

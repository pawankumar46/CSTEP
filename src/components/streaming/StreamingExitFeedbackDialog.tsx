"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MultiDayFeedbackForm,
} from "@/components/feedback/MultiDayFeedbackForm";
import type { StreamingFeedbackFormValues } from "@/features/feedback/streaming-feedback.schema";
import { mapStreamingFeedbackToUpsertPayloads } from "@/lib/feedback-mappers";
import { resolveFeedbackEventId } from "@/lib/feedback-options";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedbackStore } from "@/store/useFeedbackStore";

interface StreamingExitFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after submit or skip — parent should navigate away. */
  onLeave: () => void;
  eventId?: string;
  eventName?: string;
}

export function StreamingExitFeedbackDialog({
  open,
  onOpenChange,
  onLeave,
  eventId,
}: StreamingExitFeedbackDialogProps) {
  const user = useAuthStore((s) => s.user);
  const { isSubmitting, upsertMultiDayFeedback } = useFeedbackStore();

  const feedbackEventId = resolveFeedbackEventId(eventId);

  const handleLeave = () => {
    onOpenChange(false);
    onLeave();
  };

  const handleSubmit = async (data: StreamingFeedbackFormValues) => {
    if (!user) return;

    const { creates, updates } = mapStreamingFeedbackToUpsertPayloads(data, feedbackEventId);
    await upsertMultiDayFeedback({ creates, updates });
    handleLeave();
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
            Rate sessions for your registered event days, then share your overall ICAS experience.
          </DialogDescription>
        </DialogHeader>

        <MultiDayFeedbackForm
          eventId={feedbackEventId}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          showSkip
          onSkip={handleLeave}
          submitLabel="Submit & Go Home"
        />
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMPTY_FEEDBACK_FORM,
  feedbackSchema,
  type FeedbackFormValues,
} from "@/features/feedback/feedback.schema";
import {
  FEEDBACK_DATE_OPTIONS,
  getFeedbackSessionsForDate,
} from "@/lib/feedback-options";
import { cn } from "@/lib/utils";

interface FeedbackSubmitFormProps {
  onSubmit: (data: FeedbackFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function FeedbackSubmitForm({ onSubmit, isSubmitting = false }: FeedbackSubmitFormProps) {
  const [hoveredStar, setHoveredStar] = useState(0);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: EMPTY_FEEDBACK_FORM,
  });

  const sessionDate = watch("sessionDate");
  const sessionTitle = watch("sessionTitle");
  const rating = watch("rating");
  const comments = watch("comments");

  const sessionOptions = useMemo(
    () => getFeedbackSessionsForDate(sessionDate),
    [sessionDate],
  );

  useEffect(() => {
    if (!sessionDate) return;
    const valid = sessionOptions.some((session) => session.title === sessionTitle);
    if (!valid) {
      setValue("sessionTitle", "");
    }
  }, [sessionDate, sessionOptions, sessionTitle, setValue]);

  const handleFormSubmit = async (data: FeedbackFormValues) => {
    await onSubmit(data);
    reset(EMPTY_FEEDBACK_FORM);
    setHoveredStar(0);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sessionDate">Date</Label>
          <Select
            value={sessionDate || undefined}
            onValueChange={(value) => setValue("sessionDate", value, { shouldValidate: true })}
          >
            <SelectTrigger id="sessionDate">
              <SelectValue placeholder="Select event date" />
            </SelectTrigger>
            <SelectContent>
              {FEEDBACK_DATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sessionDate && (
            <p className="text-xs text-destructive">{errors.sessionDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sessionTitle">Session</Label>
          <Select
            value={sessionTitle || undefined}
            onValueChange={(value) => setValue("sessionTitle", value, { shouldValidate: true })}
            disabled={!sessionDate || sessionOptions.length === 0}
          >
            <SelectTrigger id="sessionTitle">
              <SelectValue placeholder={sessionDate ? "Select session" : "Select a date first"} />
            </SelectTrigger>
            <SelectContent>
              {sessionOptions.map((session) => (
                <SelectItem key={session.id} value={session.title}>
                  {session.time} — {session.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sessionTitle && (
            <p className="text-xs text-destructive">{errors.sessionTitle.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setValue("rating", star, { shouldValidate: true })}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  (hoveredStar || rating) >= star
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>
        {errors.rating && <p className="text-xs text-destructive">{errors.rating.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="comments">Comments</Label>
        <Textarea
          id="comments"
          value={comments}
          onChange={(event) => setValue("comments", event.target.value, { shouldValidate: true })}
          placeholder="Share your feedback about this session..."
          rows={4}
        />
        {errors.comments && (
          <p className="text-xs text-destructive">{errors.comments.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting || rating === 0}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star, MessageSquare } from "lucide-react";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  feedback: z.string().min(10, "Please provide at least 10 characters"),
  suggestions: z.string().optional(),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

export default function FeedbackPage() {
  const { feedback, stats, isLoading, fetchFeedback, fetchStats, submitFeedback } = useFeedbackStore();
  const user = useAuthStore((s) => s.user);
  const [hoveredStar, setHoveredStar] = useState(0);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { rating: 0, feedback: "", suggestions: "" },
  });

  const rating = watch("rating");

  useEffect(() => {
    fetchFeedback();
    fetchStats();
  }, [fetchFeedback, fetchStats]);

  const onSubmit = async (data: FeedbackForm) => {
    await submitFeedback({
      userId: user?.id || "",
      userName: user ? `${user.firstName} ${user.lastName}` : "Anonymous",
      eventId: "evt-001",
      eventName: "CSTEP Annual Conference 2025",
      rating: data.rating,
      feedback: data.feedback,
      suggestions: data.suggestions || "",
    });
    reset();
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="text-muted-foreground">Share your experience and view community feedback</p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{stats.avgRating}</p>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <div className="flex justify-center mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={cn("h-4 w-4", s <= Math.round(stats.avgRating) ? "fill-amber-400 text-amber-400" : "text-muted")} />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Feedback</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium mb-2">Rating Distribution</p>
              {stats.distribution.map((d) => (
                <div key={d.rating} className="flex items-center gap-2 text-xs mb-1">
                  <span className="w-8">{d.rating}★</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(d.count / stats.total) * 100}%` }} />
                  </div>
                  <span className="w-6 text-muted-foreground">{d.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Submit Feedback</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setValue("rating", star)}
                    >
                      <Star className={cn("h-8 w-8 transition-colors", (hoveredStar || rating) >= star ? "fill-amber-400 text-amber-400" : "text-muted")} />
                    </button>
                  ))}
                </div>
                {errors.rating && <p className="text-xs text-destructive">Please select a rating</p>}
              </div>
              <div className="space-y-2">
                <Label>Feedback</Label>
                <Textarea {...register("feedback")} placeholder="Share your experience..." rows={4} />
                {errors.feedback && <p className="text-xs text-destructive">{errors.feedback.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Suggestions</Label>
                <Textarea {...register("suggestions")} placeholder="Any suggestions for improvement?" rows={3} />
              </div>
              <Button type="submit">Submit Feedback</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Community Feedback</CardTitle></CardHeader>
          <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
            {feedback.map((fb) => (
              <div key={fb.id} className="p-4 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{fb.userName}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("h-3 w-3", s <= fb.rating ? "fill-amber-400 text-amber-400" : "text-muted")} />
                    ))}
                  </div>
                </div>
                <p className="text-sm">{fb.feedback}</p>
                {fb.suggestions && <p className="text-xs text-muted-foreground italic">Suggestion: {fb.suggestions}</p>}
                <p className="text-xs text-muted-foreground">{formatDate(fb.createdAt)} · {fb.eventName}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

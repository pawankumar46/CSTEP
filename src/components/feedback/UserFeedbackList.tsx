"use client";

import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeedbackDateLabel, getFeedbackSessionDisplayName } from "@/lib/feedback-options";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Feedback } from "@/types";

interface UserFeedbackListProps {
  feedback: Feedback[];
  title?: string;
  emptyMessage?: string;
}

export function UserFeedbackList({
  feedback,
  title = "Your Submissions",
  emptyMessage = "You have not submitted any feedback yet.",
}: UserFeedbackListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          feedback.map((item) => (
            <div key={item.id} className="space-y-2 rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {getFeedbackSessionDisplayName(item.sessionTitle, item.eventName)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getFeedbackDateLabel(item.sessionDate)} · {item.eventName}
                  </p>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-3.5 w-3.5",
                        star <= item.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground",
                      )}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm">{item.comments}</p>
              <p className="text-xs text-muted-foreground">Submitted {formatDate(item.createdAt)}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect } from "react";
import { Download, Eye, Share2, Video } from "lucide-react";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecordingStore } from "@/store/useRecordingStore";
import { formatDate } from "@/lib/utils";

export default function RecordingsPage() {
  const { recordings, isLoading, fetchRecordings } = useRecordingStore();

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recordings</h1>
        <p className="text-muted-foreground">Watch and share event recordings</p>
      </div>

      {recordings.length === 0 ? (
        <EmptyState icon={Video} title="No recordings" description="Recordings will appear here after events are completed." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recordings.map((recording) => (
            <Card key={recording.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="relative aspect-video">
                <img src={recording.thumbnailUrl} alt={recording.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button size="sm" variant="secondary"><Eye className="h-4 w-4 mr-1" /> View</Button>
                </div>
                <Badge className="absolute bottom-2 right-2 bg-black/70">{recording.duration}</Badge>
              </div>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-medium text-sm line-clamp-2">{recording.name}</h3>
                <p className="text-xs text-muted-foreground">{recording.eventName}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(recording.date)}</span>
                  <span>{recording.views.toLocaleString()} views</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 h-8"><Share2 className="h-3 w-3 mr-1" /> Share</Button>
                  <Button variant="outline" size="sm" className="flex-1 h-8"><Download className="h-3 w-3 mr-1" /> Download</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

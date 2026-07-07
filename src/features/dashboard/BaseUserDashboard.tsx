"use client";

import { useEffect } from "react";
import { Calendar, Video, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEventStore } from "@/store/useEventStore";
import { useRecordingStore } from "@/store/useRecordingStore";
import { formatDate } from "@/lib/utils";

export function BaseUserDashboard() {
  const { events, fetchEvents } = useEventStore();
  const { recordings, fetchRecordings } = useRecordingStore();

  useEffect(() => {
    fetchEvents("upcoming");
    fetchRecordings();
  }, [fetchEvents, fetchRecordings]);

  const upcomingEvents = events.filter((e) => e.status === "published" || e.status === "live");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your events</p>
      </div>

      <div className="grid auto-rows-fr gap-4 md:grid-cols-3">
        <StatCard title="Upcoming Events" value={upcomingEvents.length} icon={Calendar} />
        <StatCard title="Recordings Available" value={recordings.length} icon={Video} />
        <StatCard title="Your Feedback" value="Submit" icon={MessageSquare} description="Share your experience" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Events</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/events">View all <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.slice(0, 4).map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <img src={event.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{event.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                </div>
                <Badge className="capitalize">{event.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild className="justify-start"><Link href="/streaming"><Video className="h-4 w-4 mr-2" /> Join Live Stream</Link></Button>
            <Button variant="outline" asChild className="justify-start"><Link href="/dashboard/recordings"><Video className="h-4 w-4 mr-2" /> Watch Recordings</Link></Button>
            <Button variant="outline" asChild className="justify-start"><Link href="/feedback"><MessageSquare className="h-4 w-4 mr-2" /> Submit Feedback</Link></Button>
            <Button variant="outline" asChild className="justify-start"><Link href="/event-register"><Calendar className="h-4 w-4 mr-2" /> Register for Event</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

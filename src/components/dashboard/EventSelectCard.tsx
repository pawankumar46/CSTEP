"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Event } from "@/types";

interface EventSelectCardProps {
  events: Event[];
  eventsLoading: boolean;
  selectedEventId: string | null;
  onEventChange: (eventId: string) => void;
}

export function EventSelectCard({
  events,
  eventsLoading,
  selectedEventId,
  onEventChange,
}: EventSelectCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Step 1 — Select Event</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-w-md">
          <Label>Event</Label>
          {eventsLoading ? (
            <p className="text-sm text-muted-foreground">Loading events…</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events available.</p>
          ) : (
            <Select value={selectedEventId ?? ""} onValueChange={onEventChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

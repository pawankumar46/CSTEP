"use client";

import { Calendar, Users, Pencil, Trash2, MapPin } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Event, EventListType, EventStatus } from "@/types";

const statusVariant: Record<EventStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  draft: "secondary",
  published: "default",
  live: "success",
  completed: "warning",
  cancelled: "destructive",
};

const listTypeVariant: Record<EventListType, "default" | "success" | "secondary"> = {
  upcoming: "default",
  live: "success",
  past: "secondary",
};

const listTypeLabel: Record<EventListType, string> = {
  upcoming: "Upcoming",
  live: "Live",
  past: "Past",
};

interface EventCardProps {
  event: Event;
  listType?: EventListType;
  onEdit?: (id: string) => void;
  onEditAttendance?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export function EventCard({
  event,
  listType,
  onEdit,
  onEditAttendance,
  onDelete,
  showActions = true,
}: EventCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="relative h-40 overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge variant={statusVariant[event.status]} className="absolute top-3 right-3 capitalize">
          {event.status}
        </Badge>
        {listType && (
          <Badge variant={listTypeVariant[listType]} className="absolute top-3 left-3">
            {listTypeLabel[listType]}
          </Badge>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base line-clamp-1">{event.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(event.date)}
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5" />
          {event.registeredCount} / {event.maxParticipants}
        </div>
      </CardContent>
      {showActions && (
        <CardFooter className="flex flex-col gap-2">
          <div className="flex w-full gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit?.(event.id)}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => onDelete?.(event.id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onEditAttendance?.(event.id)}
          >
            <MapPin className="h-3.5 w-3.5 mr-1" /> Edit Attendance mode
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

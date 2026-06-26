"use client";

import { type Control, type FieldErrors, type Path, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginatedUserSelect } from "@/components/dashboard/PaginatedUserSelect";
import type { Event } from "@/types";

interface AdminAssistanceBaseValues {
  eventId: string;
  userId: string;
}

interface AdminAssistanceEventUserFieldsProps<T extends AdminAssistanceBaseValues> {
  control: Control<T>;
  errors: FieldErrors<T>;
  events: Event[];
  eventsLoading?: boolean;
}

export function AdminAssistanceEventUserFields<T extends AdminAssistanceBaseValues>({
  control,
  errors,
  events,
  eventsLoading = false,
}: AdminAssistanceEventUserFieldsProps<T>) {
  return (
    <>
      <div className="space-y-2">
        <Label>Event</Label>
        <Controller
          name={"eventId" as Path<T>}
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={eventsLoading || events.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={eventsLoading ? "Loading events..." : "Select an event"} />
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
        />
        {errors.eventId && (
          <p className="text-xs text-destructive">{String(errors.eventId.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>User</Label>
        <Controller
          name={"userId" as Path<T>}
          control={control}
          render={({ field }) => (
            <PaginatedUserSelect
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors.userId && (
          <p className="text-xs text-destructive">{String(errors.userId.message)}</p>
        )}
      </div>
    </>
  );
}

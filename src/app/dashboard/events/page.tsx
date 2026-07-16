"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { EventCard } from "@/components/dashboard/EventCard";
import { EditAttendanceModeDialog } from "@/components/dashboard/EditAttendanceModeDialog";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEventStore } from "@/store/useEventStore";
import { useAuthStore } from "@/store/useAuthStore";
import { toLocalDateTimeInput } from "@/lib/event-mappers";
import { Calendar } from "lucide-react";
import type { Event, EventListType, EventScheduleType } from "@/types";

const EVENT_TYPE_LABELS: Record<EventListType, string> = {
  upcoming: "Upcoming",
  live: "Live",
  past: "Past",
};

const EMPTY_STATE_COPY: Record<EventListType, { title: string; description: string }> = {
  upcoming: {
    title: "No upcoming events",
    description: "Create your first event to get started.",
  },
  live: {
    title: "No live events",
    description: "There are no events streaming right now.",
  },
  past: {
    title: "No past events",
    description: "Completed events will appear here.",
  },
};

const defaultForm = {
  title: "",
  description: "",
  scheduledStart: "",
  scheduledEnd: "",
  videoMutedByDefault: true,
  pauseContinueEnabled: true,
  scheduleType: "WHOLE_DAY" as EventScheduleType,
  travelAssistance: false,
  medicalAssistance: false,
  translationAssistance: false,
  accommodationAssistance: false,
};

const ASSISTANCE_OPTIONS = [
  { key: "travelAssistance", label: "Travel assistance" },
  { key: "medicalAssistance", label: "Medical assistance" },
  { key: "translationAssistance", label: "Translation assistance" },
  { key: "accommodationAssistance", label: "Accommodation assistance" },
] as const;

type EventFormState = typeof defaultForm;

function EventFormFields({
  form,
  setForm,
  idPrefix,
}: {
  form: EventFormState;
  setForm: (form: EventFormState) => void;
  idPrefix: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Event Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="CSTEP Demo Event"
        />
      </div>
      <div className="space-y-2">
        <Label>Event Type</Label>
        <Select
          value={form.scheduleType}
          onValueChange={(value) =>
            setForm({
              ...form,
              scheduleType: value as EventScheduleType,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WHOLE_DAY">Whole Day</SelectItem>
            <SelectItem value="MULTI_SESSION">Multi Session</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Event description"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Scheduled Start</Label>
          <Input
            type="datetime-local"
            value={form.scheduledStart}
            onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Scheduled End</Label>
          <Input
            type="datetime-local"
            value={form.scheduledEnd}
            onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${idPrefix}-videoMuted`}
            checked={form.videoMutedByDefault}
            onCheckedChange={(checked) => setForm({ ...form, videoMutedByDefault: !!checked })}
          />
          <Label htmlFor={`${idPrefix}-videoMuted`} className="font-normal cursor-pointer">
            Video muted by default
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${idPrefix}-pauseContinue`}
            checked={form.pauseContinueEnabled}
            onCheckedChange={(checked) => setForm({ ...form, pauseContinueEnabled: !!checked })}
          />
          <Label htmlFor={`${idPrefix}-pauseContinue`} className="font-normal cursor-pointer">
            Pause / continue enabled
          </Label>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Assistance offered for this event</p>
          <p className="text-xs text-muted-foreground">
            Enable the assistance types this event provides. Disabled types are hidden in the lobby.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ASSISTANCE_OPTIONS.map((option) => (
            <div key={option.key} className="flex items-center gap-2">
              <Checkbox
                id={`${idPrefix}-${option.key}`}
                checked={form[option.key]}
                onCheckedChange={(checked) => setForm({ ...form, [option.key]: !!checked })}
              />
              <Label htmlFor={`${idPrefix}-${option.key}`} className="font-normal cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const {
    events,
    eventListType,
    isLoading,
    error,
    fetchEvents,
    setEventListType,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useEventStore();
  const user = useAuthStore((s) => s.user);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [attendanceEvent, setAttendanceEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const canManage =
    user?.role === "moderator" ||
    user?.role === "event_administrator" ||
    user?.role === "super_administrator";

  useEffect(() => {
    fetchEvents(eventListType);
  }, [eventListType, fetchEvents]);

  const handleTypeChange = (type: EventListType) => {
    setEventListType(type);
  };

  const openCreate = () => {
    setForm(defaultForm);
    setCreateOpen(true);
  };

  const isFormValid = form.title.trim() && form.scheduledStart && form.scheduledEnd;

  const buildPayload = () => ({
    title: form.title.trim(),
    description: form.description.trim(),
    scheduledStart: form.scheduledStart,
    scheduledEnd: form.scheduledEnd,
    videoMutedByDefault: form.videoMutedByDefault,
    pauseContinueEnabled: form.pauseContinueEnabled,
    scheduleType: form.scheduleType,
    travelAssistance: form.travelAssistance,
    medicalAssistance: form.medicalAssistance,
    translationAssistance: form.translationAssistance,
    accommodationAssistance: form.accommodationAssistance,
  });

  const handleCreate = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      await createEvent(buildPayload());
      setCreateOpen(false);
      setForm(defaultForm);
    } catch {
      // error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (event: Event) => {
    setEditingId(event.id);
    setForm({
      title: event.name,
      description: event.description,
      scheduledStart: toLocalDateTimeInput(event.date),
      scheduledEnd: toLocalDateTimeInput(event.endDate ?? event.date),
      videoMutedByDefault: true,
      pauseContinueEnabled: true,
      scheduleType: event.scheduleType ?? "WHOLE_DAY",
      travelAssistance: event.travelAssistance ?? false,
      medicalAssistance: event.medicalAssistance ?? false,
      translationAssistance: event.translationAssistance ?? false,
      accommodationAssistance: event.accommodationAssistance ?? false,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingId || !isFormValid) return;

    setIsSubmitting(true);
    try {
      await updateEvent(editingId, buildPayload());
      setEditOpen(false);
      setEditingId(null);
      setForm(defaultForm);
    } catch {
      // error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDelete = (id: string) => {
    const event = events.find((item) => item.id === id);
    if (event) {
      setDeletingEvent(event);
      setDeleteOpen(true);
    }
  };

  const openAttendance = (id: string) => {
    const event = events.find((item) => item.id === id);
    if (event) {
      setAttendanceEvent(event);
      setAttendanceOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;

    setIsSubmitting(true);
    try {
      await deleteEvent(deletingEvent.id);
      setDeleteOpen(false);
      setDeletingEvent(null);
    } catch {
      // error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && events.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Events</h1>
            <p className="text-muted-foreground">Browse and manage events</p>
          </div>
          {canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Create Event
            </Button>
          )}
        </div>
        <Tabs value={eventListType} onValueChange={(value) => handleTypeChange(value as EventListType)}>
          <TabsList>
            {(Object.keys(EVENT_TYPE_LABELS) as EventListType[]).map((type) => (
              <TabsTrigger key={type} value={type}>
                {EVENT_TYPE_LABELS[type]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground">Browse and manage events</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Create Event
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <Tabs value={eventListType} onValueChange={(value) => handleTypeChange(value as EventListType)}>
        <TabsList>
          {(Object.keys(EVENT_TYPE_LABELS) as EventListType[]).map((type) => (
            <TabsTrigger key={type} value={type}>
              {EVENT_TYPE_LABELS[type]}
              {type === eventListType && !isLoading ? ` (${events.length})` : ""}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <p className="text-sm text-muted-foreground">
        {isLoading
          ? `Loading ${EVENT_TYPE_LABELS[eventListType].toLowerCase()} events...`
          : `${events.length} ${EVENT_TYPE_LABELS[eventListType].toLowerCase()} event${events.length === 1 ? "" : "s"}`}
      </p>

      {isLoading ? (
        <DashboardSkeleton />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={EMPTY_STATE_COPY[eventListType].title}
          description={EMPTY_STATE_COPY[eventListType].description}
          action={
            canManage && eventListType === "upcoming"
              ? { label: "Create Event", onClick: openCreate }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              listType={eventListType}
              showActions={canManage}
              onEdit={() => openEdit(event)}
              onEditAttendance={openAttendance}
              onDelete={openDelete}
            />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
          </DialogHeader>
          <EventFormFields form={form} setForm={setForm} idPrefix="create" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !isFormValid}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <EventFormFields form={form} setForm={setForm} idPrefix="edit" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting || !isFormValid}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditAttendanceModeDialog
        open={attendanceOpen}
        onOpenChange={(open) => {
          setAttendanceOpen(open);
          if (!open) setAttendanceEvent(null);
        }}
        event={attendanceEvent}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingEvent?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

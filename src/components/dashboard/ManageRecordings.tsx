"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, CheckCircle2, FileVideo, Link2, Loader2, Trash2, Video } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  manageRecordingSchema,
  type ManageRecordingFormValues,
} from "@/features/dashboard/manage-recording.schema";
import {
  getAllEvents,
  getEventDaysDropdown,
  getScheduleItemsDropdown,
  type EventDayDropdownOption,
  type ScheduleItemRecord,
} from "@/services/event.service";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import type { Event, UserRole } from "@/types";

const RECORDING_DELETE_ROLES: UserRole[] = ["moderator", "event_administrator"];

const DEFAULT_VALUES: ManageRecordingFormValues = {
  eventId: "",
  eventDayId: "",
  scheduleItemId: "",
  sourceType: "url",
  recordingUrl: "",
  recordingFile: undefined,
};

interface RecordingPreview {
  id: string;
  title: string;
  eventName: string;
  dateLabel: string;
  sourceUrl: string;
  sourceType: "url" | "file";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getEmbedUrl(sourceUrl: string): string | null {
  try {
    const url = new URL(sourceUrl);
    if (url.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    }
    if (url.hostname.includes("youtube.com")) {
      const videoId =
        url.searchParams.get("v") ??
        url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.hostname.includes("vimeo.com")) {
      const videoId = url.pathname.match(/\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function RecordingPlayer({ recording }: { recording: RecordingPreview }) {
  const embedUrl =
    recording.sourceType === "url" ? getEmbedUrl(recording.sourceUrl) : null;

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title={recording.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    );
  }

  return (
    <video
      controls
      preload="metadata"
      src={recording.sourceUrl}
      className="h-full w-full"
    >
      Your browser does not support video playback.
    </video>
  );
}

export function ManageRecordings() {
  const user = useAuthStore((s) => s.user);
  const canDelete = user ? RECORDING_DELETE_ROLES.includes(user.role) : false;

  const [events, setEvents] = useState<Event[]>([]);
  const [eventDays, setEventDays] = useState<EventDayDropdownOption[]>([]);
  const [sessions, setSessions] = useState<ScheduleItemRecord[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [daysLoading, setDaysLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recordingPreviews, setRecordingPreviews] = useState<RecordingPreview[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<RecordingPreview | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const objectUrlsRef = useRef<string[]>([]);

  const {
    control,
    handleSubmit,
    register,
    reset,
    resetField,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ManageRecordingFormValues>({
    resolver: zodResolver(manageRecordingSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const eventId = watch("eventId");
  const eventDayId = watch("eventDayId");
  const scheduleItemId = watch("scheduleItemId");
  const sourceType = watch("sourceType");
  const recordingFile = watch("recordingFile");

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === scheduleItemId) ?? null,
    [scheduleItemId, sessions],
  );
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === eventId) ?? null,
    [eventId, events],
  );
  const selectedDay = useMemo(
    () => eventDays.find((day) => day.id === eventDayId) ?? null,
    [eventDayId, eventDays],
  );

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setEventsLoading(true);
      setLoadError(null);
      try {
        const list = await getAllEvents();
        if (!cancelled) setEvents(list);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load events");
        }
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    resetField("eventDayId");
    resetField("scheduleItemId");
    setEventDays([]);
    setSessions([]);
    if (!eventId) return;

    let cancelled = false;
    setDaysLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const days = await getEventDaysDropdown(eventId);
        if (!cancelled) {
          setEventDays([...days].sort((a, b) => a.date.localeCompare(b.date)));
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load event dates");
        }
      } finally {
        if (!cancelled) setDaysLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, resetField]);

  useEffect(() => {
    resetField("scheduleItemId");
    setSessions([]);
    if (!eventDayId) return;

    let cancelled = false;
    setSessionsLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const items = await getScheduleItemsDropdown(eventDayId);
        if (!cancelled) {
          setSessions(
            items.filter((item) => item.itemType.toUpperCase() === "SESSION"),
          );
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load sessions");
        }
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventDayId, resetField]);

  const submitPreview = async (values: ManageRecordingFormValues) => {
    const sessionTitle = selectedSession?.title ?? "Session recording";
    const eventName = selectedEvent?.name ?? "Event";
    const dateLabel = selectedDay?.label ?? "";

    let sourceUrl = values.recordingUrl.trim();
    if (values.sourceType === "file" && values.recordingFile instanceof File) {
      sourceUrl = URL.createObjectURL(values.recordingFile);
      objectUrlsRef.current.push(sourceUrl);
    }

    setRecordingPreviews((current) => [
      {
        id: `${values.scheduleItemId}-${Date.now()}`,
        title: sessionTitle,
        eventName,
        dateLabel,
        sourceUrl,
        sourceType: values.sourceType,
      },
      ...current,
    ]);

    reset(DEFAULT_VALUES);
    setEventDays([]);
    setSessions([]);
    setFileInputKey((current) => current + 1);
    setSuccessMessage(
      `${sessionTitle} was added to the recording previews below.`,
    );
  };

  const confirmDeleteRecording = () => {
    if (!pendingDelete) return;

    if (pendingDelete.sourceType === "file") {
      URL.revokeObjectURL(pendingDelete.sourceUrl);
      objectUrlsRef.current = objectUrlsRef.current.filter(
        (url) => url !== pendingDelete.sourceUrl,
      );
    }

    setRecordingPreviews((current) =>
      current.filter((recording) => recording.id !== pendingDelete.id),
    );
    setSuccessMessage(`“${pendingDelete.title}” was removed.`);
    setPendingDelete(null);
    setDeleteOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Recordings</h1>
        <p className="text-muted-foreground">
          Select an event, date, and session, then attach a recording URL or video file.
        </p>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        UI preview only — recording upload and save APIs are not connected yet.
      </div>

      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(submitPreview)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recording target</CardTitle>
            <CardDescription>
              Sessions are loaded after selecting their event date.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="recording-event">Event</Label>
              <Controller
                name="eventId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSuccessMessage(null);
                    }}
                    disabled={eventsLoading}
                  >
                    <SelectTrigger id="recording-event">
                      <SelectValue
                        placeholder={eventsLoading ? "Loading events…" : "Choose an event"}
                      />
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
                <p className="text-xs text-destructive">{errors.eventId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recording-date">Date</Label>
              <Controller
                name="eventDayId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSuccessMessage(null);
                    }}
                    disabled={!eventId || daysLoading}
                  >
                    <SelectTrigger id="recording-date">
                      <SelectValue
                        placeholder={daysLoading ? "Loading dates…" : "Choose a date"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {eventDays.map((day) => (
                        <SelectItem key={day.id} value={day.id}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.eventDayId && (
                <p className="text-xs text-destructive">{errors.eventDayId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recording-session">Session</Label>
              <Controller
                name="scheduleItemId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSuccessMessage(null);
                    }}
                    disabled={!eventDayId || sessionsLoading || sessions.length === 0}
                  >
                    <SelectTrigger id="recording-session">
                      <SelectValue
                        placeholder={
                          sessionsLoading ? "Loading sessions…" : "Choose a session"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.scheduleItemId && (
                <p className="text-xs text-destructive">
                  {errors.scheduleItemId.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {!eventId ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={CalendarDays}
                title="Select an event"
                description="Choose an event to load its dates and sessions."
              />
            </CardContent>
          </Card>
        ) : eventDayId && !sessionsLoading && sessions.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Video}
                title="No sessions available"
                description="This date has no session schedule items."
              />
            </CardContent>
          </Card>
        ) : (
          <Card className={cn(!scheduleItemId && "opacity-70")}>
            <CardHeader>
              <CardTitle className="text-base">Recording source</CardTitle>
              <CardDescription>
                {selectedSession
                  ? `Add a recording for “${selectedSession.title}”.`
                  : "Select a session before choosing its recording source."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="sourceType"
                control={control}
                render={({ field }) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        value: "url" as const,
                        title: "Recording URL",
                        description: "YouTube, Vimeo, Drive, or another hosted video link.",
                        icon: Link2,
                      },
                      {
                        value: "file" as const,
                        title: "Upload file",
                        description: "Choose a video file from this device.",
                        icon: FileVideo,
                      },
                    ].map((option) => {
                      const Icon = option.icon;
                      const active = field.value === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={!scheduleItemId}
                          onClick={() => {
                            field.onChange(option.value);
                            setSuccessMessage(null);
                          }}
                          className={cn(
                            "rounded-lg border p-4 text-left transition-colors",
                            "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active && "border-primary bg-primary/5",
                            !scheduleItemId && "cursor-not-allowed opacity-60",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="rounded-md bg-primary/10 p-2">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{option.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              />

              {sourceType === "url" ? (
                <div className="space-y-2">
                  <Label htmlFor="recording-url">Recording URL</Label>
                  <Input
                    id="recording-url"
                    type="url"
                    disabled={!scheduleItemId}
                    placeholder="https://example.com/recording"
                    {...register("recordingUrl")}
                  />
                  {errors.recordingUrl && (
                    <p className="text-xs text-destructive">
                      {errors.recordingUrl.message}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="recording-file">Video file</Label>
                  <Input
                    key={fileInputKey}
                    id="recording-file"
                    type="file"
                    accept="video/*"
                    disabled={!scheduleItemId}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setValue("recordingFile", file, { shouldValidate: true });
                      setSuccessMessage(null);
                    }}
                  />
                  {recordingFile instanceof File && (
                    <p className="text-xs text-muted-foreground">
                      {recordingFile.name} · {formatFileSize(recordingFile.size)}
                    </p>
                  )}
                  {errors.recordingFile && (
                    <p className="text-xs text-destructive">
                      {String(errors.recordingFile.message)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={!scheduleItemId || isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Video className="h-4 w-4" />
            )}
            Save Recording
          </Button>
        </div>
      </form>

      <section className="space-y-4" aria-labelledby="recording-preview-heading">
        <div>
          <h2 id="recording-preview-heading" className="text-xl font-semibold">
            Uploaded Recordings
          </h2>
          <p className="text-sm text-muted-foreground">
            Play recordings added during this preview session.
          </p>
        </div>

        {recordingPreviews.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={FileVideo}
                title="No recordings added"
                description="Uploaded files and recording URLs will appear here."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recordingPreviews.map((recording) => (
              <Card key={recording.id} className="overflow-hidden">
                <div className="aspect-video bg-black">
                  <RecordingPlayer recording={recording} />
                </div>
                <CardHeader className="space-y-3 p-4">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-2 text-base">
                      {recording.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">
                      {recording.eventName}
                      {recording.dateLabel ? ` · ${recording.dateLabel}` : ""}
                    </CardDescription>
                  </div>
                  {canDelete && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setPendingDelete(recording);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete recording</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{pendingDelete?.title}&quot;? This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setPendingDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteRecording}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

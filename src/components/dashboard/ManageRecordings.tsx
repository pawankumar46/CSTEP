"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  CheckCircle2,
  FileVideo,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { formatParticipationDateDisplay } from "@/lib/registration-mappers";
import { compressMp4 } from "@/lib/video-compression";
import { cn, formatDateTime } from "@/lib/utils";
import {
  getAllEvents,
  getEventDaysDropdown,
  getScheduleItemsDropdown,
  type EventDayDropdownOption,
  type ScheduleItemRecord,
} from "@/services/event.service";
import {
  createEventRecording,
  deleteEventRecording,
  EVENT_RECORDINGS_PAGE_SIZE,
  getEventRecordings,
  updateEventRecording,
} from "@/services/recording.service";
import { useAuthStore } from "@/store/useAuthStore";
import type { EventRecording, UserRole } from "@/types";

const RECORDING_DELETE_ROLES: UserRole[] = ["moderator", "event_administrator"];
const MAX_HLS_RECOVERY_ATTEMPTS = 3;
const EMPTY_ADD_FORM: ManageRecordingFormValues = {
  eventDayId: "",
  scheduleItemId: "",
  sourceType: "url",
  recordingUrl: "",
  recordingFile: undefined,
};

function getEmbedUrl(sourceUrl: string): string | null {
  try {
    const url = new URL(sourceUrl);
    if (url.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    }
    if (url.hostname.includes("youtube.com")) {
      const videoId =
        url.searchParams.get("v") ??
        url.pathname.match(/^\/(?:live|shorts|embed)\/([^/]+)/)?.[1];
      if (!videoId) return null;
      const list = url.searchParams.get("list");
      return `https://www.youtube.com/embed/${videoId}${list ? `?list=${encodeURIComponent(list)}` : ""}`;
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

function isHlsPlaybackUrl(sourceUrl: string): boolean {
  try {
    const url = new URL(sourceUrl);
    if (/\.m3u8(\?|$)/i.test(url.pathname + url.search)) return true;
    // AWS IVS / live-video playback endpoints are HLS even without an obvious extension.
    if (
      url.hostname.includes("live-video.net")
      || url.hostname.includes("playback.live-video.net")
      || url.hostname.includes("ivs.amazonaws.com")
    ) {
      return true;
    }
  } catch {
    return /\.m3u8(\?|$)/i.test(sourceUrl);
  }
  return false;
}

export function RecordingPlayer({ recording }: { recording: EventRecording }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackError, setPlaybackError] = useState(false);
  const sourceUrl = recording.fileUrl ?? recording.file;

  useEffect(() => {
    setPlaybackError(false);
  }, [sourceUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl || !isHlsPlaybackUrl(sourceUrl) || playbackError) {
      return;
    }

    let hls: Hls | null = null;
    let cancelled = false;
    let recoveryAttempts = 0;

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal || cancelled || !hls) return;

        if (recoveryAttempts < MAX_HLS_RECOVERY_ATTEMPTS) {
          recoveryAttempts += 1;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
            return;
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
            return;
          }
        }

        setPlaybackError(true);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = sourceUrl;
    } else {
      setPlaybackError(true);
    }

    return () => {
      cancelled = true;
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [sourceUrl, playbackError]);

  if (!sourceUrl) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-white/70">
        Recording file unavailable
      </div>
    );
  }

  const embedUrl = getEmbedUrl(sourceUrl);
  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title={recording.sessionTitle}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full border-0"
      />
    );
  }

  if (isHlsPlaybackUrl(sourceUrl)) {
    if (playbackError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-white/80">
          <p>Unable to play this HLS / IVS recording.</p>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-white"
          >
            Open link
          </a>
        </div>
      );
    }

    return (
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full"
      >
        Your browser does not support video playback.
      </video>
    );
  }

  return (
    <video
      controls
      preload="metadata"
      src={sourceUrl}
      className="h-full w-full"
    >
      Your browser does not support video playback.
    </video>
  );
}

export function ManageRecordings() {
  const user = useAuthStore((state) => state.user);
  const canDelete = user ? RECORDING_DELETE_ROLES.includes(user.role) : false;
  const [recordings, setRecordings] = useState<EventRecording[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingRecording, setEditingRecording] =
    useState<EventRecording | null>(null);
  const [eventDays, setEventDays] = useState<EventDayDropdownOption[]>([]);
  const [sessions, setSessions] = useState<ScheduleItemRecord[]>([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState<number | null>(
    null,
  );
  const [fileInputKey, setFileInputKey] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EventRecording | null>(null);

  const {
    control,
    handleSubmit,
    register,
    reset,
    resetField,
    setValue,
    watch,
    formState: { errors: formErrors, isSubmitting },
  } = useForm<ManageRecordingFormValues>({
    resolver: zodResolver(manageRecordingSchema),
    defaultValues: EMPTY_ADD_FORM,
  });

  const selectedDayId = watch("eventDayId");
  const sourceType = watch("sourceType");
  const recordingFile = watch("recordingFile");

  const loadRecordings = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getEventRecordings(
        targetPage,
        EVENT_RECORDINGS_PAGE_SIZE,
      );
      setRecordings(result.rows);
      setPage(result.page);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setHasNext(result.hasNext);
      setHasPrevious(result.hasPrevious);
    } catch (loadError) {
      setRecordings([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load recordings",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecordings(page);
  }, [loadRecordings, page]);

  useEffect(() => {
    if (!addOpen) return;

    let cancelled = false;
    setDaysLoading(true);
    setAddError(null);
    void (async () => {
      try {
        const events = await getAllEvents();
        const event = events.find((item) => item.id === "11") ?? events[0];
        if (!event) throw new Error("No event is available.");
        const days = await getEventDaysDropdown(event.id);
        if (!cancelled) {
          const sortedDays = [...days].sort((a, b) =>
            a.date.localeCompare(b.date),
          );
          setEventDays(sortedDays);
          if (editingRecording) {
            const selectedDay = sortedDays.find(
              (day) => day.date === editingRecording.date,
            );
            if (selectedDay) {
              setValue("eventDayId", selectedDay.id);
            }
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setEventDays([]);
          setAddError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load event days",
          );
        }
      } finally {
        if (!cancelled) setDaysLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [addOpen, editingRecording, setValue]);

  useEffect(() => {
    resetField("scheduleItemId");
    setSessions([]);
    if (!selectedDayId || !addOpen) return;

    let cancelled = false;
    setSessionsLoading(true);
    setAddError(null);
    void (async () => {
      try {
        const items = await getScheduleItemsDropdown(selectedDayId);
        if (!cancelled) {
          const sessionItems = items.filter(
            (item) => item.itemType.toUpperCase() === "SESSION",
          );
          setSessions(sessionItems);
          if (
            editingRecording &&
            sessionItems.some(
              (session) => session.id === editingRecording.sessionId,
            )
          ) {
            setValue("scheduleItemId", editingRecording.sessionId);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setAddError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load sessions",
          );
        }
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    addOpen,
    editingRecording,
    resetField,
    selectedDayId,
    setValue,
  ]);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  const openAddDialog = () => {
    setEditingRecording(null);
    reset(EMPTY_ADD_FORM);
    setSessions([]);
    setAddError(null);
    setAddSuccess(null);
    setCompressionProgress(null);
    setFileInputKey((current) => current + 1);
    setAddOpen(true);
  };

  const openEditDialog = (recording: EventRecording) => {
    setEditingRecording(recording);
    reset({
      ...EMPTY_ADD_FORM,
      sourceType: "url",
      recordingUrl: recording.fileUrl ?? "",
    });
    setSessions([]);
    setAddError(null);
    setAddSuccess(null);
    setCompressionProgress(null);
    setFileInputKey((current) => current + 1);
    setAddOpen(true);
  };

  const submitRecording = async (values: ManageRecordingFormValues) => {
    setAddError(null);
    setAddSuccess(null);
    try {
      if (values.sourceType === "url") {
        const input = {
          sessionId: values.scheduleItemId,
          sourceType: "url" as const,
          fileUrl: values.recordingUrl.trim(),
        };
        if (editingRecording) {
          await updateEventRecording(editingRecording.id, input);
        } else {
          await createEventRecording(input);
        }
      } else if (values.recordingFile instanceof File) {
        setCompressionProgress(0);
        const compressedFile = await compressMp4(
          values.recordingFile,
          setCompressionProgress,
        );
        setCompressionProgress(100);
        const input = {
          sessionId: values.scheduleItemId,
          sourceType: "file" as const,
          file: compressedFile,
        };
        if (editingRecording) {
          await updateEventRecording(editingRecording.id, input);
        } else {
          await createEventRecording(input);
        }
      }

      setAddSuccess(
        editingRecording
          ? "Recording updated successfully."
          : "Recording added successfully.",
      );
      reset(EMPTY_ADD_FORM);
      setSessions([]);
      setFileInputKey((current) => current + 1);
      setCompressionProgress(null);
      setEditingRecording(null);
      setPage(1);
      await loadRecordings(1);
      window.setTimeout(() => setAddOpen(false), 700);
    } catch (submitError) {
      setCompressionProgress(null);
      setAddError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to add recording",
      );
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteEventRecording(pendingDelete.id);
      setPendingDelete(null);
      setDeleteOpen(false);
      const targetPage = recordings.length === 1 && page > 1 ? page - 1 : page;
      setPage(targetPage);
      await loadRecordings(targetPage);
    } catch (deleteError) {
      setDeleteError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete recording",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manage Recordings</h1>
          <p className="text-muted-foreground">
            View and play session recordings.
          </p>
        </div>
        <Button type="button" onClick={openAddDialog}>
          <Plus className="h-4 w-4" />
          Add Recording
        </Button>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void loadRecordings(page)}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      <section className="space-y-4" aria-labelledby="recordings-heading">
        <div>
          <h2 id="recordings-heading" className="text-lg font-semibold">
            Recordings
          </h2>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading recordings…"
              : `${total} recording${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="aspect-video animate-pulse bg-muted" />
                <CardHeader className="space-y-2 p-4">
                  <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : recordings.length === 0 && !error ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={FileVideo}
                title="No recordings available"
                description="Session recordings will appear here when they are ready."
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recordings.map((recording) => (
                <Card key={recording.id} className="overflow-hidden">
                  <div className="aspect-video bg-black">
                    <RecordingPlayer recording={recording} />
                  </div>
                  <CardHeader className="space-y-3 p-4">
                    <div className="space-y-2">
                      <CardTitle className="line-clamp-2 text-base">
                        {recording.sessionTitle}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatParticipationDateDisplay(recording.date)}
                        </span>
                        {recording.startedAt && (
                          <span className="block">
                            Started {formatDateTime(recording.startedAt)}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    {canDelete && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(recording)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            setPendingDelete(recording);
                            setDeleteError(null);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            reset(EMPTY_ADD_FORM);
            setSessions([]);
            setAddError(null);
            setAddSuccess(null);
            setCompressionProgress(null);
            setEditingRecording(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecording ? "Edit recording" : "Add recording"}
            </DialogTitle>
            <DialogDescription>
              {editingRecording
                ? "Update the session and replace its recording URL or MP4 file."
                : "Select a day and session, then provide a recording URL or file."}
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <form
            onSubmit={handleSubmit(submitRecording)}
            className="space-y-5"
          >
            {addError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {addError}
              </div>
            )}
            {addSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {addSuccess}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recording-day">Day</Label>
                <Controller
                  name="eventDayId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={daysLoading || isSubmitting}
                    >
                      <SelectTrigger id="recording-day">
                        <SelectValue
                          placeholder={
                            daysLoading ? "Loading days…" : "Select day"
                          }
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
                {formErrors.eventDayId && (
                  <p className="text-xs text-destructive">
                    {formErrors.eventDayId.message}
                  </p>
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
                      onValueChange={field.onChange}
                      disabled={
                        !selectedDayId ||
                        sessionsLoading ||
                        sessions.length === 0 ||
                        isSubmitting
                      }
                    >
                      <SelectTrigger id="recording-session">
                        <SelectValue
                          placeholder={
                            sessionsLoading
                              ? "Loading sessions…"
                              : "Select session"
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
                {formErrors.scheduleItemId && (
                  <p className="text-xs text-destructive">
                    {formErrors.scheduleItemId.message}
                  </p>
                )}
                {selectedDayId &&
                  !sessionsLoading &&
                  sessions.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No sessions available for this day.
                    </p>
                  )}
              </div>
            </div>

            <Controller
              name="sourceType"
              control={control}
              render={({ field }) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      value: "url" as const,
                      label: "Recording URL",
                      description: "AWS IVS, HLS, YouTube, Vimeo, or direct video.",
                      icon: Link2,
                    },
                    {
                      value: "file" as const,
                      label: "Upload file",
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
                        disabled={isSubmitting}
                        onClick={() => {
                          field.onChange(option.value);
                          setAddError(null);
                        }}
                        className={cn(
                          "rounded-lg border p-4 text-left transition-colors hover:bg-muted/40",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active && "border-primary bg-primary/5",
                        )}
                      >
                        <div className="flex gap-3">
                          <Icon className="mt-0.5 h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{option.label}</p>
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
                  placeholder="https://cdn.example.com/recording.m3u8"
                  disabled={isSubmitting}
                  {...register("recordingUrl")}
                />
                {formErrors.recordingUrl && (
                  <p className="text-xs text-destructive">
                    {formErrors.recordingUrl.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="recording-file">Recording file</Label>
                <Input
                  key={fileInputKey}
                  id="recording-file"
                  type="file"
                  accept="video/mp4,.mp4"
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setValue("recordingFile", event.target.files?.[0], {
                      shouldValidate: true,
                    });
                    setAddError(null);
                  }}
                />
                {recordingFile instanceof File && (
                  <p className="text-xs text-muted-foreground">
                    {recordingFile.name} ·{" "}
                    {(recordingFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                )}
                {formErrors.recordingFile && (
                  <p className="text-xs text-destructive">
                    {String(formErrors.recordingFile.message)}
                  </p>
                )}
                {compressionProgress != null && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {compressionProgress < 100
                          ? "Compressing MP4…"
                          : "Uploading compressed MP4…"}
                      </span>
                      <span>{compressionProgress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width]"
                        style={{ width: `${compressionProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  MP4 files are compressed to a maximum width of 1280px before upload.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {compressionProgress != null && compressionProgress < 100
                  ? "Compressing…"
                  : isSubmitting
                    ? "Uploading…"
                    : editingRecording
                      ? "Update Recording"
                      : "Add Recording"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete recording</DialogTitle>
            <DialogDescription>
              Permanently delete &quot;{pendingDelete?.sessionTitle}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

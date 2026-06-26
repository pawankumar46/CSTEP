"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Copy, Loader2 } from "lucide-react";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { getAllEvents } from "@/services/event.service";
import {
  createBroadcastSession,
  fetchBroadcastUrl,
  getBroadcastSessions,
} from "@/services/broadcast.service";
import { useAuthStore } from "@/store/useAuthStore";
import { formatDate, copyTextToClipboard } from "@/lib/utils";
import type { BroadcastSessionSummary, BroadcastUrlTarget, Event } from "@/types";

const broadcastSchema = z.object({
  eventId: z.string().min(1, "Select an event"),
  name: z.string().min(1, "Session name is required"),
  isPrimary: z.boolean(),
});

type BroadcastForm = z.infer<typeof broadcastSchema>;

const URL_COPY_ACTIONS: { label: string; target: BroadcastUrlTarget }[] = [
  { label: "Copy stream key", target: "stream_key" },
  { label: "Copy RTMP ingest", target: "ingest.rtmp" },
  { label: "Copy RTSP ingest", target: "ingest.rtsp" },
  { label: "Copy WebRTC ingest", target: "ingest.webrtc" },
  { label: "Copy HLS playback", target: "playback.hls" },
  { label: "Copy RTSP playback", target: "playback.rtsp" },
  { label: "Copy WebRTC playback", target: "playback.webrtc" },
];

function CopyUrlButton({
  sessionId,
  label,
  target,
}: {
  sessionId: string;
  label: string;
  target: BroadcastUrlTarget;
}) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await fetchBroadcastUrl(sessionId, target);
      await copyTextToClipboard(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Copy failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-start"
        disabled={loading}
        onClick={() => void copy()}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
        ) : copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600 mr-2" />
        ) : (
          <Copy className="h-3.5 w-3.5 mr-2" />
        )}
        {copied ? "Copied" : label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function BroadcastSessionCard({ session }: { session: BroadcastSessionSummary }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{session.name}</CardTitle>
            <CardDescription>{session.eventTitle}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {session.isPrimary && <Badge variant="secondary">Primary</Badge>}
            <Badge variant={session.isActive ? "success" : "outline"}>
              {session.isActive ? "Live" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Broadcaster:</span>{" "}
            {session.broadcasterName}
          </p>
          {session.createdAt && (
            <p>
              <span className="font-medium text-foreground">Created:</span>{" "}
              {formatDate(session.createdAt)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="font-medium text-foreground">Stream links</p>
          <p className="text-xs text-muted-foreground">
            URLs are not shown on screen. Use copy to fetch a link only when needed.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {URL_COPY_ACTIONS.map((action) => (
              <CopyUrlButton
                key={action.target}
                sessionId={session.id}
                label={action.label}
                target={action.target}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VideoManagementPage() {
  return (
    <RouteGuard allowedRoles={["event_administrator"]}>
      <VideoManagementContent />
    </RouteGuard>
  );
}

function VideoManagementContent() {
  const user = useAuthStore((s) => s.user);
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<BroadcastSessionSummary[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BroadcastForm>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      eventId: "",
      name: "",
      isPrimary: true,
    },
  });

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const list = await getBroadcastSessions();
      setSessions(list);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : "Failed to load broadcast sessions");
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const list = await getAllEvents();
        if (!cancelled) setEvents(list);
      } catch (err) {
        if (!cancelled) {
          setEventsError(err instanceof Error ? err.message : "Failed to load events");
        }
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    };

    void loadEvents();
    void loadSessions();
    return () => {
      cancelled = true;
    };
  }, [loadSessions]);

  const onSubmit = async (data: BroadcastForm) => {
    if (!user?.id) {
      setSubmitError("You must be signed in to create a broadcast session.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const list = await createBroadcastSession({
        eventId: data.eventId,
        broadcasterId: user.id,
        name: data.name,
        isPrimary: data.isPrimary,
      });
      setSessions(list);
      reset({ eventId: data.eventId, name: "", isPrimary: data.isPrimary });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create broadcast session");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (eventsLoading && sessionsLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Video Management</h1>
          <p className="text-sm text-muted-foreground">
            Create sessions and copy stream links on demand
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {(eventsError || submitError) && (
              <div className="space-y-1">
                {eventsError && <p className="text-sm text-destructive">{eventsError}</p>}
                {submitError && <p className="text-sm text-destructive">{submitError}</p>}
              </div>
            )}

            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
              <div className="space-y-1.5 lg:min-w-[220px] lg:flex-1">
                <Label className="text-xs">Event</Label>
                <Controller
                  name="eventId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={events.length === 0}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select an event" />
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

              <div className="space-y-1.5 lg:w-44">
                <Label htmlFor="sessionName" className="text-xs">Session name</Label>
                <Input
                  id="sessionName"
                  placeholder="camera 1"
                  className="h-9"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="flex h-9 items-center gap-2 lg:pb-0.5">
                <Controller
                  name="isPrimary"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isPrimary"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  )}
                />
                <Label htmlFor="isPrimary" className="text-sm font-normal cursor-pointer whitespace-nowrap">
                  Primary
                </Label>
              </div>

              <Button
                type="submit"
                size="sm"
                className="h-9 lg:shrink-0"
                disabled={isSubmitting || events.length === 0}
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                {isSubmitting ? "Creating..." : "Create session"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Broadcast sessions</h2>
          <Button variant="outline" size="sm" onClick={() => void loadSessions()} disabled={sessionsLoading}>
            {sessionsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
            Refresh
          </Button>
        </div>

        {sessionsError && <p className="text-sm text-destructive">{sessionsError}</p>}

        {sessionsLoading && sessions.length === 0 ? (
          <DashboardSkeleton />
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No broadcast sessions yet. Create one above to generate stream URLs.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {sessions.map((session) => (
              <BroadcastSessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

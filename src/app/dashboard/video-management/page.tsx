"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Calendar,
  Check,
  Copy,
  Loader2,
  Radio,
  RefreshCw,
  User,
  Video,
} from "lucide-react";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { EmptyState } from "@/components/shared/EmptyState";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
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
import { Separator } from "@/components/ui/separator";
import { getAllEvents } from "@/services/event.service";
import {
  createBroadcastSession,
  fetchBroadcastUrl,
  getBroadcastSessions,
} from "@/services/broadcast.service";
import { useAuthStore } from "@/store/useAuthStore";
import { cn, copyTextToClipboard, formatDate } from "@/lib/utils";
import type { BroadcastSessionSummary, BroadcastUrlTarget, Event } from "@/types";

const broadcastSchema = z.object({
  eventId: z.string().min(1, "Select an event"),
  name: z.string().min(1, "Session name is required"),
  isPrimary: z.boolean(),
});

type BroadcastForm = z.infer<typeof broadcastSchema>;

const INGEST_URL_ACTIONS: { label: string; target: BroadcastUrlTarget }[] = [
  { label: "Stream key", target: "stream_key" },
  { label: "RTMP ingest", target: "ingest.rtmp" },
  { label: "RTSP ingest", target: "ingest.rtsp" },
  { label: "WebRTC ingest", target: "ingest.webrtc" },
];

const PLAYBACK_URL_ACTIONS: { label: string; target: BroadcastUrlTarget }[] = [
  { label: "HLS playback", target: "playback.hls" },
  { label: "RTSP playback", target: "playback.rtsp" },
  { label: "WebRTC playback", target: "playback.webrtc" },
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
        className={cn(
          "h-9 w-full justify-between gap-2 px-3 transition-colors",
          copied && "border-emerald-500/50 bg-emerald-500/5",
        )}
        disabled={loading}
        onClick={() => void copy()}
      >
        <span className="truncate text-left">{copied ? "Copied" : label}</span>
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        ) : copied ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        ) : (
          <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function StreamLinkGroup({
  title,
  description,
  actions,
  sessionId,
}: {
  title: string;
  description: string;
  actions: { label: string; target: BroadcastUrlTarget }[];
  sessionId: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map((action) => (
          <CopyUrlButton
            key={action.target}
            sessionId={sessionId}
            label={action.label}
            target={action.target}
          />
        ))}
      </div>
    </div>
  );
}

function BroadcastSessionCard({ session }: { session: BroadcastSessionSummary }) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="truncate text-base">{session.name}</CardTitle>
              <CardDescription className="truncate">{session.eventTitle}</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {session.isPrimary && <Badge variant="secondary">Primary</Badge>}
            <Badge variant={session.isActive ? "success" : "outline"}>
              {session.isActive ? "Live" : "Inactive"}
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">
              <span className="font-medium text-foreground">Broadcaster:</span>{" "}
              {session.broadcasterName}
            </span>
          </div>
          {session.createdAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="truncate">
                <span className="font-medium text-foreground">Created:</span>{" "}
                {formatDate(session.createdAt)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-5 pt-5">
        <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
          <p className="text-xs text-muted-foreground">
            Stream URLs are fetched on demand and never displayed on screen. Use copy when you need
            a link for your encoder or player.
          </p>
        </div>

        <StreamLinkGroup
          title="Ingest"
          description="Send your stream from OBS or another encoder."
          actions={INGEST_URL_ACTIONS}
          sessionId={session.id}
        />

        <StreamLinkGroup
          title="Playback"
          description="Distribute or test the outgoing stream."
          actions={PLAYBACK_URL_ACTIONS}
          sessionId={session.id}
        />
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Video Management</h1>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Create broadcast sessions for your events and copy ingest or playback links when you need
            them.
          </p>
        </div>
        {!sessionsLoading && sessions.length > 0 && (
          <Badge variant="secondary" className="shrink-0">
            {sessions.length} session{sessions.length === 1 ? "" : "s"}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create broadcast session</CardTitle>
          <CardDescription>
            Link a session to an event. Mark it primary when it should be the default live feed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {(eventsError || submitError) && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 space-y-1">
                {eventsError && <p className="text-sm text-destructive">{eventsError}</p>}
                {submitError && <p className="text-sm text-destructive">{submitError}</p>}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="broadcast-event">Event</Label>
                <Controller
                  name="eventId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={events.length === 0}
                    >
                      <SelectTrigger id="broadcast-event">
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
                {events.length === 0 && !eventsLoading && (
                  <p className="text-xs text-muted-foreground">No events available yet.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionName">Session name</Label>
                <Input id="sessionName" placeholder="e.g. Main hall camera" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-3 py-3">
                <Controller
                  name="isPrimary"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isPrimary"
                      className="mt-0.5"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  )}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="isPrimary" className="cursor-pointer font-medium">
                    Primary session
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Use as the default stream when viewers open the live page.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={isSubmitting || events.length === 0}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isSubmitting ? "Creating session..." : "Create session"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Broadcast sessions</h2>
            <p className="text-sm text-muted-foreground">
              Manage active and inactive sessions for your events.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadSessions()}
            disabled={sessionsLoading}
          >
            {sessionsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {sessionsError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
            <p className="text-sm text-destructive">{sessionsError}</p>
          </div>
        )}

        {sessionsLoading && sessions.length === 0 ? (
          <DashboardSkeleton />
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Radio}
                title="No broadcast sessions yet"
                description="Create a session above to generate ingest and playback links for your event stream."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {sessions.map((session) => (
              <BroadcastSessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

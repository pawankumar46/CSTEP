"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pause, Play, VolumeX, Share2, Users, Home,
} from "lucide-react";
import { StreamPlayerFrame } from "@/components/streaming/StreamPlayerFrame";
import { StreamCameraPicker } from "@/components/streaming/StreamCameraPicker";
import { LiveChatPanel } from "@/components/streaming/LiveChatPanel";
import { StreamingEventAgenda } from "@/components/streaming/StreamingEventAgenda";
import { StreamingExitFeedbackDialog } from "@/components/streaming/StreamingExitFeedbackDialog";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import { useMinRole } from "@/hooks/useRoleGuard";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { useEventPresenceSocket } from "@/hooks/useEventPresenceSocket";
import { mockEvents } from "@/mock/events";
import {
  getLiveEventStream,
  pickDefaultLiveCamera,
  type LiveBroadcastCamera,
} from "@/services/broadcast.service";
import { leaveEvent, leaveEventOnUnload } from "@/services/event.service";
import { isEmbeddedPlaybackStreamUrl } from "@/lib/stream-utils";
import {
  APP_NAME,
  LIVE_STREAM_URL,
  STREAM_LEFT_BANNER_URL,
  STREAM_RIGHT_BANNER_URL,
} from "@/lib/constants";
import { getAppUrl } from "@/lib/env";
import { ROUTES } from "@/lib/routes";
import type { StreamViewMode } from "@/lib/stream-view";
import { cn } from "@/lib/utils";

export default function StreamingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isModerator = useMinRole("moderator");
  const { upcomingEvent } = useEventRegistration();
  const event = upcomingEvent ?? mockEvents.find((e) => e.status === "live") ?? mockEvents[2];
  const liveEventId = upcomingEvent?.id;
  useEventPresenceSocket(liveEventId);

  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [viewerCount, setViewerCount] = useState(2);
  const [linkCopied, setLinkCopied] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [viewMode, setViewMode] = useState<StreamViewMode>("default");
  const [cameras, setCameras] = useState<LiveBroadcastCamera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | undefined>();
  const [streamLoading, setStreamLoading] = useState(true);
  const isEmbeddedStream = Boolean(streamUrl && isEmbeddedPlaybackStreamUrl(streamUrl));
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allowLeaveRef = useRef(false);
  const leaveSentRef = useRef(false);

  const notifyLeave = useCallback((mode: "async" | "unload" = "async") => {
    const eventId = liveEventId?.trim();
    if (!eventId || leaveSentRef.current) return;
    leaveSentRef.current = true;

    if (mode === "unload") {
      leaveEventOnUnload(eventId);
      return;
    }

    void leaveEvent(eventId).catch(() => {
      // Leave is best-effort; still allow navigation away.
    });
  }, [liveEventId]);

  useEffect(() => {
    leaveSentRef.current = false;
  }, [liveEventId]);

  useEffect(() => {
    let cancelled = false;

    const loadCameras = async () => {
      setStreamLoading(true);

      if (!liveEventId) {
        if (cancelled) return;
        setCameras([]);
        setSelectedCameraId(null);
        setStreamUrl(LIVE_STREAM_URL || undefined);
        setStreamLoading(false);
        return;
      }

      try {
        const liveStream = await getLiveEventStream(liveEventId);
        if (cancelled) return;

        const defaultCamera = pickDefaultLiveCamera(liveStream.cameras);
        setCameras(liveStream.cameras);
        setSelectedCameraId(defaultCamera?.id ?? null);
        setStreamUrl(defaultCamera?.playbackUrl ?? LIVE_STREAM_URL ?? undefined);
        setIsMuted(liveStream.videoMutedByDefault);
        if (liveStream.concurrentViewers != null) {
          setViewerCount(liveStream.concurrentViewers);
        }
      } catch {
        if (cancelled) return;
        setCameras([]);
        setSelectedCameraId(null);
        setStreamUrl(LIVE_STREAM_URL || undefined);
      } finally {
        if (!cancelled) setStreamLoading(false);
      }
    };

    void loadCameras();

    return () => {
      cancelled = true;
    };
  }, [liveEventId]);

  const selectCamera = (camera: LiveBroadcastCamera) => {
    setSelectedCameraId(camera.id);
    setStreamUrl(camera.playbackUrl);
    setIsPaused(false);
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    window.history.pushState({ streamExitGuard: true }, "", window.location.href);

    const onPopState = () => {
      if (allowLeaveRef.current) return;
      window.history.pushState({ streamExitGuard: true }, "", window.location.href);
      setFeedbackOpen(true);
    };

    const onPageHide = () => {
      notifyLeave("unload");
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [notifyLeave]);

  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(getAppUrl(`${window.location.pathname}${window.location.search}`));
      setLinkCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setLinkCopied(false);
    }
  };

  const handleExit = () => {
    setFeedbackOpen(true);
  };

  const leaveStreaming = () => {
    notifyLeave("async");
    allowLeaveRef.current = true;
    setFeedbackOpen(false);
    router.push(ROUTES.home);
  };

  const isTheaterView = viewMode === "theater";

  const selectedCamera = cameras.find((camera) => camera.id === selectedCameraId);
  const playerTitle = selectedCamera
    ? `${event.name} · ${selectedCamera.name}`
    : event.name;

  const player = (
    <div className="space-y-3">
      <div className="relative">
        <StreamPlayerFrame
          streamUrl={streamUrl}
          isLive
          isPaused={isPaused}
          isMuted={isMuted}
          thumbnailUrl={event.imageUrl}
          title={playerTitle}
          leftBannerUrl={STREAM_LEFT_BANNER_URL}
          rightBannerUrl={STREAM_RIGHT_BANNER_URL}
          leftBannerAlt="India Clean Air Summit 2026"
          rightBannerAlt="India Clean Air Summit 2026"
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onPause={() => setIsPaused(true)}
          onResume={() => setIsPaused(false)}
          onMute={() => setIsMuted(!isMuted)}
        />
        {streamLoading ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-black/60 pointer-events-none">
            <p className="text-sm font-medium text-white">Connecting to live stream…</p>
          </div>
        ) : !streamUrl ? (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-xl bg-black/70 p-6 text-center pointer-events-none">
            <p className="text-sm font-medium text-white">No live stream is available right now.</p>
            <p className="text-xs text-white/80 max-w-sm">
              When an event goes live, playback will start from the active broadcast session.
            </p>
          </div>
        ) : null}
      </div>

      <StreamCameraPicker
        cameras={cameras}
        selectedId={selectedCameraId}
        onSelect={selectCamera}
      />
    </div>
  );

  const chatPanel = (
    <LiveChatPanel
      eventId={liveEventId}
      userId={user?.id}
      userRole={user?.role}
      className={cn(
        isTheaterView
          ? "h-full min-h-[min(360px,52vh)] max-h-[min(520px,calc(100vh-22rem))] xl:max-h-none"
          : "h-[min(70vh,32rem)] lg:sticky lg:top-20 lg:h-[min(calc(100vh-6rem),36rem)]",
      )}
    />
  );

  const moderatorControls = isModerator ? (
    <Card className={cn(isTheaterView && "shadow-sm")}>
      <CardHeader className={cn("pb-2", isTheaterView ? "pt-3 px-4" : "pb-3")}>
        <CardTitle className="text-sm">Moderator Controls</CardTitle>
      </CardHeader>
      <CardContent className={cn("flex flex-wrap items-center gap-2", isTheaterView && "px-4 pb-3 pt-0")}>
        <Button size="sm" variant={isPaused ? "default" : "outline"} onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
          {isPaused ? "Resume Stream" : "Pause Stream"}
        </Button>
        {!isEmbeddedStream && (
          <Button size="sm" variant="outline" onClick={() => setIsMuted(!isMuted)}>
            <VolumeX className="h-4 w-4 mr-1" />
            {isMuted ? "Unmute" : "Mute Stream"}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={shareLink}>
          <Share2 className="h-4 w-4 mr-1" /> Share Link
        </Button>
        {linkCopied && (
          <span className="text-sm text-emerald-600 font-medium">Link copied!</span>
        )}
      </CardContent>
    </Card>
  ) : null;

  const eventInfoCard = (
    <Card className={cn(isTheaterView && "h-full shadow-sm")}>
      <CardHeader className={cn(isTheaterView ? "py-3 px-4" : undefined)}>
        <CardTitle className={cn(isTheaterView ? "text-sm" : "text-base")}>Event Information</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-2 text-sm", isTheaterView && "px-4 pb-4 pt-0")}>
        <h3 className="font-semibold leading-snug">{event.name}</h3>
        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
          {event.description.slice(0, 150)}...
        </p>
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground pt-1">
          <Badge variant="success">Live</Badge>
          <span className="text-xs">{event.location}</span>
        </div>
      </CardContent>
    </Card>
  );

  const infoCardsGrid = (
    <div className="grid gap-4 sm:grid-cols-2">
      {eventInfoCard}
      <StreamingEventAgenda className="min-h-0" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <span className="font-semibold truncate">{APP_NAME} Live</span>
          {isTheaterView && (
            <span className="hidden sm:inline text-xs text-muted-foreground truncate">{event.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExit}
            title="Submit feedback and leave the stream"
            className="gap-1.5"
          >
            <Home className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Submit Feedback & Exit</span>
            <span className="sm:hidden">Feedback & Exit</span>
          </Button>
          <Badge variant="success" className="gap-1">
            <Users className="h-3 w-3" />
            <span className="hidden sm:inline">{viewerCount.toLocaleString()} watching</span>
            <span className="sm:hidden">{viewerCount.toLocaleString()}</span>
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      <div className={cn("mx-auto px-4 py-4 sm:py-6", isTheaterView ? "w-full max-w-[min(96vw,100rem)]" : "container")}>
        {isTheaterView ? (
          <div className="space-y-4">
            {player}

            <p className="text-sm text-muted-foreground truncate sm:hidden">{event.name}</p>

            <div className="grid gap-4 xl:grid-cols-12 xl:items-stretch xl:min-h-[min(520px,calc(100vh-22rem))]">
              <div className="xl:col-span-7 flex flex-col gap-4 min-h-0">
                {moderatorControls}
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] min-h-0 flex-1">
                  {eventInfoCard}
                  <StreamingEventAgenda compact />
                </div>
              </div>

              <div className="xl:col-span-5 min-h-0 flex flex-col h-full max-h-[min(520px,calc(100vh-22rem))] xl:max-h-[min(520px,calc(100vh-22rem))]">
                {chatPanel}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-4">
              {player}
              {moderatorControls}
              {infoCardsGrid}
            </div>
            {chatPanel}
          </div>
        )}
      </div>

      <StreamingExitFeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        onLeave={leaveStreaming}
        eventId={event.id}
        eventName={event.name}
      />
    </div>
  );
}

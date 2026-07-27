"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Pause, Play, VolumeX, Share2, Heart, ThumbsUp, HandMetal,
  Send, Users, Home,
} from "lucide-react";
import { StreamPlayerFrame } from "@/components/streaming/StreamPlayerFrame";
import { StreamingExitFeedbackDialog } from "@/components/streaming/StreamingExitFeedbackDialog";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import { useMinRole } from "@/hooks/useRoleGuard";
import { mockEvents, mockSpeakers, mockSchedule } from "@/mock/events";
import { mockChatMessages } from "@/mock/feedback";
import { resolveLivePlaybackUrl } from "@/services/broadcast.service";
import { isGoogleDriveStreamUrl } from "@/lib/stream-utils";
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
import { UserInitials } from "@/components/shared/UserInitials";

const REACTIONS = [
  { icon: ThumbsUp, label: "Like", emoji: "👍" },
  { icon: Heart, label: "Love", emoji: "❤️" },
  { icon: HandMetal, label: "Clap", emoji: "👏" },
];

export default function StreamingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isModerator = useMinRole("moderator");
  const event = mockEvents.find((e) => e.status === "live") || mockEvents[2];

  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [viewerCount, setViewerCount] = useState(2890);
  const [chatMessages, setChatMessages] = useState(mockChatMessages);
  const [newMessage, setNewMessage] = useState("");
  const [reactions, setReactions] = useState<Record<string, number>>({ "👍": 42, "❤️": 28, "👏": 15 });
  const [linkCopied, setLinkCopied] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [viewMode, setViewMode] = useState<StreamViewMode>("default");
  const [streamUrl, setStreamUrl] = useState<string | undefined>(LIVE_STREAM_URL || undefined);
  const isDriveEmbed = Boolean(streamUrl && isGoogleDriveStreamUrl(streamUrl));
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allowLeaveRef = useRef(false);

  useEffect(() => {
    if (LIVE_STREAM_URL && isGoogleDriveStreamUrl(LIVE_STREAM_URL)) {
      return;
    }

    let cancelled = false;

    const loadStreamUrl = async () => {
      const hlsUrl = await resolveLivePlaybackUrl();
      if (!cancelled && hlsUrl) {
        setStreamUrl(hlsUrl);
      }
    };

    void loadStreamUrl();

    return () => {
      cancelled = true;
    };
  }, []);

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

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages([
      ...chatMessages,
      {
        id: `chat-${Date.now()}`,
        userId: user?.id || "guest",
        userName: user ? `${user.firstName} ${user.lastName}` : "Guest",
        message: newMessage,
        timestamp: new Date().toISOString(),
      },
    ]);
    setNewMessage("");
  };

  const addReaction = (emoji: string) => {
    setReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
  };

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
    allowLeaveRef.current = true;
    setFeedbackOpen(false);
    router.push(ROUTES.home);
  };

  const isTheaterView = viewMode === "theater";

  const player = (
    <StreamPlayerFrame
      streamUrl={streamUrl}
      isLive
      isPaused={isPaused}
      isMuted={isMuted}
      thumbnailUrl={event.imageUrl}
      title={event.name}
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
  );

  const chatPanel = (
    <Card
      className={cn(
        "flex flex-col min-h-0",
        isTheaterView
          ? "h-full min-h-[min(360px,52vh)] xl:min-h-[min(520px,calc(100vh-22rem))]"
          : "min-h-[320px] lg:sticky lg:top-20 lg:min-h-[480px]",
      )}
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          Live Chat
          <div className="flex gap-0.5 shrink-0">
            {REACTIONS.map((r) => (
              <Button key={r.label} size="sm" variant="ghost" className="h-7 px-1.5 text-xs" onClick={() => addReaction(r.emoji)}>
                {r.emoji} {reactions[r.emoji] || 0}
              </Button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 min-h-0 px-4 pb-4">
        <div className="flex-1 min-h-[160px] overflow-y-auto space-y-2 pr-1">
          {chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm leading-snug"
            >
              <span className="font-medium text-primary">{msg.userName}: </span>
              <span>{msg.message}</span>
            </motion.div>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button size="icon" onClick={sendMessage} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
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
        {!isDriveEmbed && (
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

  const speakerCard = (
    <Card className={cn(isTheaterView && "h-full shadow-sm")}>
      <CardHeader className={cn(isTheaterView ? "py-3 px-4" : undefined)}>
        <CardTitle className={cn(isTheaterView ? "text-sm" : "text-base")}>Current Speaker</CardTitle>
      </CardHeader>
      <CardContent className={cn(isTheaterView && "px-4 pb-4 pt-0")}>
        <div className="flex items-center gap-3">
          <UserInitials name={mockSpeakers[0].name} size={isTheaterView ? "md" : "lg"} />
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug">{mockSpeakers[0].name}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{mockSpeakers[0].title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const agendaCard = (
    <Card className={cn(isTheaterView && "flex flex-col min-h-0 flex-1 shadow-sm")}>
      <CardHeader className={cn(isTheaterView ? "py-3 px-4 shrink-0" : undefined)}>
        <CardTitle className={cn(isTheaterView ? "text-sm" : "text-base")}>Event Agenda</CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          "space-y-2.5",
          isTheaterView && "px-4 pb-4 pt-0 flex-1 min-h-0 overflow-y-auto max-h-[220px] xl:max-h-none",
        )}
      >
        {mockSchedule.slice(0, 4).map((item) => (
          <div key={item.id} className="flex gap-2.5 text-sm border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
            <span className="text-[11px] text-primary font-mono w-14 shrink-0 pt-0.5">{item.time}</span>
            <div className="min-w-0">
              <p className="font-medium text-sm leading-snug">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.speaker}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const exitButton = (
    <Button variant="outline" size="sm" onClick={handleExit} title="Exit and share feedback">
      <Home className="h-4 w-4 mr-2" />
      Exit
    </Button>
  );

  const infoCardsGrid = (
    <div className={cn(
      "grid gap-4",
      isTheaterView ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
    )}>
      {eventInfoCard}
      {speakerCard}
      {!isTheaterView && (
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Event Agenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockSchedule.slice(0, 4).map((item) => (
              <div key={item.id} className="flex gap-3 text-sm">
                <span className="text-xs text-primary font-mono w-16 shrink-0">{item.time}</span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.speaker}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <span className="font-semibold truncate">{APP_NAME} Live</span>
          {isTheaterView && (
            <span className="hidden sm:inline text-xs text-muted-foreground truncate">{event.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="success" className="gap-1">
            <Users className="h-3 w-3" />
            {viewerCount.toLocaleString()} watching
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      <div className={cn("mx-auto px-4 py-4 sm:py-6", isTheaterView ? "w-full max-w-[min(96vw,100rem)]" : "container")}>
        {isTheaterView ? (
          <div className="space-y-4">
            {player}

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground truncate sm:hidden">{event.name}</p>
              {exitButton}
            </div>

            <div className="grid gap-4 xl:grid-cols-12 xl:items-stretch xl:min-h-[min(520px,calc(100vh-22rem))]">
              <div className="xl:col-span-7 flex flex-col gap-4 min-h-0">
                {moderatorControls}
                <div className="grid sm:grid-cols-2 gap-4">
                  {eventInfoCard}
                  {speakerCard}
                </div>
                {agendaCard}
              </div>

              <div className="xl:col-span-5 min-h-0 flex flex-col">
                {chatPanel}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-4">
              {player}
              <div className="flex justify-end">{exitButton}</div>
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

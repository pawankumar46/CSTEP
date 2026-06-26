"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Pause, Play, VolumeX, Share2, Heart, ThumbsUp, HandMetal,
  Send, Users, Home,
} from "lucide-react";
import { StreamPlayerFrame } from "@/components/streaming/StreamPlayerFrame";
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
import {
  APP_NAME,
  LIVE_STREAM_URL,
  STREAM_LEFT_BANNER_URL,
  STREAM_RIGHT_BANNER_URL,
} from "@/lib/constants";
import { getAppUrl } from "@/lib/env";
import { ROUTES } from "@/lib/routes";
import { UserInitials } from "@/components/shared/UserInitials";

const REACTIONS = [
  { icon: ThumbsUp, label: "Like", emoji: "👍" },
  { icon: Heart, label: "Love", emoji: "❤️" },
  { icon: HandMetal, label: "Clap", emoji: "👏" },
];

export default function StreamingPage() {
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
  const [streamUrl, setStreamUrl] = useState<string | undefined>(LIVE_STREAM_URL || undefined);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold">{APP_NAME} Live</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1">
            <Users className="h-3 w-3" />
            {viewerCount.toLocaleString()} watching
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-4">
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
              onPause={() => setIsPaused(true)}
              onResume={() => setIsPaused(false)}
              onMute={() => setIsMuted(!isMuted)}
            />

            <div className="flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.home} title="Exit to home">
                  <Home className="h-4 w-4 mr-2" />
                  Exit
                </Link>
              </Button>
            </div>

            {isModerator && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Moderator Controls</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant={isPaused ? "default" : "outline"} onClick={() => setIsPaused(!isPaused)}>
                    {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                    {isPaused ? "Resume Stream" : "Pause Stream"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsMuted(!isMuted)}>
                    <VolumeX className="h-4 w-4 mr-1" />
                    {isMuted ? "Unmute" : "Mute Stream"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={shareLink}>
                    <Share2 className="h-4 w-4 mr-1" /> Share Link
                  </Button>
                  {linkCopied && (
                    <span className="text-sm text-emerald-600 font-medium">Link copied!</span>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Event Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <h3 className="font-semibold">{event.name}</h3>
                  <p className="text-muted-foreground">{event.description.slice(0, 150)}...</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="success">Live</Badge>
                    <span>{event.location}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Speaker</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <UserInitials name={mockSpeakers[0].name} size="lg" />
                    <div>
                      <p className="font-medium">{mockSpeakers[0].name}</p>
                      <p className="text-xs text-muted-foreground">{mockSpeakers[0].title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
            </div>
          </div>

          <Card className="lg:sticky lg:top-20 flex flex-col min-h-[320px] lg:min-h-[480px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between gap-2">
                Live Chat
                <div className="flex gap-1 shrink-0">
                  {REACTIONS.map((r) => (
                    <Button key={r.label} size="sm" variant="ghost" className="h-7 px-2" onClick={() => addReaction(r.emoji)}>
                      {r.emoji} {reactions[r.emoji] || 0}
                    </Button>
                  ))}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 min-h-0">
              <div className="flex-1 min-h-[200px] lg:min-h-[360px] overflow-y-auto space-y-2 pr-2">
                {chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm"
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
                <Button size="icon" onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

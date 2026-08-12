"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, RefreshCw, LayoutPanelLeft, RectangleHorizontal, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getMeetingPlatformLabel,
  isGoogleDriveStreamUrl,
  parseStreamUrl,
  type StreamSource,
} from "@/lib/stream-utils";
import { LIVE_STREAM_FILE_ID } from "@/lib/constants";
import { THEATER_PLAYER_CLASS, type StreamViewMode } from "@/lib/stream-view";

const BUFFERING_TIMEOUT_MS = 20000;
const IFRAME_LOAD_TIMEOUT_MS = 20000;
/** Masks Google Drive embed control bar when iframe fallback is used. */
const DRIVE_EMBED_CHROME = "3rem";

export interface VideoPlayerProps {
  streamUrl?: string;
  isLive?: boolean;
  isPaused?: boolean;
  isMuted?: boolean;
  thumbnailUrl?: string;
  title?: string;
  onPause?: () => void;
  onResume?: () => void;
  onMute?: () => void;
  viewMode?: StreamViewMode;
  onViewModeChange?: (mode: StreamViewMode) => void;
  fill?: boolean;
  /** Side-banner player: muted, no controls/overlays, object-cover. */
  compact?: boolean;
  className?: string;
}

export function VideoPlayer({
  streamUrl,
  isLive = true,
  isPaused = false,
  isMuted = true,
  thumbnailUrl = "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80",
  title = "Live Event Stream",
  onPause,
  onResume,
  onMute,
  viewMode = "default",
  onViewModeChange,
  fill = false,
  compact = false,
  className,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState<StreamSource | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [needsUserPlay, setNeedsUserPlay] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);
  const [meetingIframeFailed, setMeetingIframeFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!streamUrl) {
      setSource(null);
      setIframeReady(false);
      setUseIframeFallback(false);
      setPlaybackError(false);
      setNeedsUserPlay(false);
      setMeetingIframeFailed(false);
      return;
    }

    setIframeReady(false);
    setUseIframeFallback(false);
    setIsBuffering(true);
    setPlaybackError(false);
    setNeedsUserPlay(false);
    setMeetingIframeFailed(false);
    const driveFallback =
      streamUrl && isGoogleDriveStreamUrl(streamUrl) ? LIVE_STREAM_FILE_ID : undefined;
    setSource(parseStreamUrl(streamUrl, driveFallback));
  }, [streamUrl, reloadKey]);

  const isHlsStream = source?.type === "hls-stream";
  const isIframeEmbed = source?.type === "iframe-embed" && Boolean(source.embedUrl);
  const usesExternalMeeting =
    (source?.type === "external-meeting" || meetingIframeFailed)
    && Boolean(source?.embedUrl ?? source?.originalUrl);
  const usesIframe =
    !usesExternalMeeting
    && (
      isIframeEmbed
      || (source?.type === "google-drive-file" && Boolean(source.embedUrl) && useIframeFallback)
    );
  const usesVideo =
    (source?.type === "direct-video" && Boolean(source.directUrl)) ||
    (isHlsStream && Boolean(source.directUrl)) ||
    (source?.type === "google-drive-file" && Boolean(source.directUrl) && !useIframeFallback);

  const playbackUrl = usesVideo ? source?.directUrl : undefined;
  const iframePlaybackUrl =
    usesIframe && source?.embedUrl && !isPaused ? source.embedUrl : undefined;
  const meetingOpenUrl = source?.originalUrl ?? source?.embedUrl;
  const meetingPlatformLabel = getMeetingPlatformLabel(source?.meetingPlatform);

  const tryPlayVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return false;

    video.muted = compact ? true : isMuted;
    try {
      await video.play();
      setNeedsUserPlay(false);
      setPlaybackError(false);
      setIsBuffering(false);
      return true;
    } catch {
      if (!compact) setNeedsUserPlay(true);
      return false;
    }
  }, [compact, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl || isHlsStream) return;

    video.muted = compact ? true : isMuted;

    if (isPaused) {
      video.pause();
      return;
    }

    void tryPlayVideo();
  }, [compact, isPaused, isMuted, playbackUrl, tryPlayVideo, isHlsStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isHlsStream || !playbackUrl || playbackError) return;

    let hls: Hls | null = null;
    let cancelled = false;

    const startPlayback = async () => {
      video.muted = compact ? true : isMuted;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = playbackUrl;
      } else if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(playbackUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!isPaused && !cancelled) void tryPlayVideo();
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setPlaybackError(true);
            setIsBuffering(false);
          }
        });
      } else {
        setPlaybackError(true);
        setIsBuffering(false);
        return;
      }

      if (!isPaused && !cancelled) {
        await tryPlayVideo();
      }
    };

    void startPlayback();

    return () => {
      cancelled = true;
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [compact, isHlsStream, playbackUrl, reloadKey, playbackError, isMuted, isPaused, tryPlayVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isHlsStream) return;

    video.muted = compact ? true : isMuted;
    if (isPaused) {
      video.pause();
      return;
    }

    if (!playbackError) void tryPlayVideo();
  }, [compact, isPaused, isMuted, isHlsStream, playbackError, tryPlayVideo]);

  useEffect(() => {
    if (!compact || isPaused || !usesVideo || !playbackUrl) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    void tryPlayVideo();
    const retry = window.setInterval(() => {
      if (video.paused && !isPaused) {
        video.muted = true;
        void video.play().catch(() => undefined);
      }
    }, 1500);
    return () => window.clearInterval(retry);
  }, [compact, isPaused, usesVideo, playbackUrl, tryPlayVideo]);

  useEffect(() => {
    if (!usesVideo || isPaused || !isBuffering || needsUserPlay || playbackError) return;

    const timeout = window.setTimeout(() => {
      if (source?.type === "google-drive-file" && source.embedUrl && !useIframeFallback) {
        setUseIframeFallback(true);
        setIsBuffering(true);
        return;
      }
      setPlaybackError(true);
      setIsBuffering(false);
    }, BUFFERING_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [
    usesVideo,
    isPaused,
    isBuffering,
    needsUserPlay,
    playbackError,
    source,
    useIframeFallback,
  ]);

  useEffect(() => {
    if (!usesIframe || !iframePlaybackUrl) {
      if (usesIframe && !iframePlaybackUrl) {
        setIframeReady(false);
        setIsBuffering(false);
      }
      return;
    }

    setIframeReady(false);
    setIsBuffering(true);
  }, [iframePlaybackUrl, usesIframe]);

  useEffect(() => {
    if (!usesIframe || iframeReady || !iframePlaybackUrl) return;

    const timeout = window.setTimeout(() => {
      if (source?.meetingPlatform === "microsoft-teams") {
        setMeetingIframeFailed(true);
        setPlaybackError(false);
        setIsBuffering(false);
        return;
      }
      setPlaybackError(true);
      setIsBuffering(false);
    }, IFRAME_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [usesIframe, iframeReady, iframePlaybackUrl]);

  const showThumbnail = !streamUrl || playbackError || (!usesIframe && !usesVideo && !usesExternalMeeting);

  const openMeetingStream = () => {
    if (!meetingOpenUrl) return;
    window.open(meetingOpenUrl, "_blank", "noopener,noreferrer");
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen();
    }
  };

  const handleViewModeChange = (mode: StreamViewMode) => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
    onViewModeChange?.(mode);
  };

  const showViewControls = Boolean(onViewModeChange);

  const handleUserPlay = async () => {
    onResume?.();
    const played = await tryPlayVideo();
    if (!played && source?.type === "google-drive-file" && source.embedUrl) {
      setUseIframeFallback(true);
    }
  };

  const handleRetry = () => {
    setMeetingIframeFailed(false);
    setReloadKey((key) => key + 1);
  };

  const handleVideoCanPlay = () => {
    const video = videoRef.current;
    if (!video || isPaused) {
      setIsBuffering(false);
      return;
    }

    if (compact) video.muted = true;
    void tryPlayVideo();
  };

  const handleVideoError = () => {
    if (source?.type === "google-drive-file" && source.embedUrl && !useIframeFallback) {
      setUseIframeFallback(true);
      setIsBuffering(true);
      setPlaybackError(false);
      return;
    }

    setPlaybackError(true);
    setIsBuffering(false);
  };

  const showPlayOverlay =
    !compact && usesVideo && (needsUserPlay || isPaused) && !playbackError;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full bg-black overflow-hidden group transition-all duration-300 ease-in-out",
        fill
          ? "absolute inset-0 h-full w-full min-h-0"
          : viewMode === "theater"
            ? THEATER_PLAYER_CLASS
            : "aspect-video min-h-[12.5rem] rounded-xl",
        className,
      )}
    >
      {usesVideo && playbackUrl && !playbackError && (
        <>
          {isBuffering && !isPaused && !needsUserPlay && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          )}
          <video
            ref={videoRef}
            key={`${source?.type}-${playbackUrl}-${reloadKey}`}
            src={isHlsStream ? undefined : playbackUrl}
            className={cn(
              "absolute inset-0 h-full w-full bg-black",
              compact ? "object-cover" : "object-contain",
            )}
            autoPlay
            playsInline
            controls={false}
            muted={isMuted}
            preload="auto"
            onCanPlay={handleVideoCanPlay}
            onPlaying={() => {
              setIsBuffering(false);
              setNeedsUserPlay(false);
            }}
            onWaiting={() => !isPaused && setIsBuffering(true)}
            onError={handleVideoError}
          />
          {showPlayOverlay && (
            <button
              type="button"
              className="absolute inset-0 z-[25] flex flex-col items-center justify-center gap-3 bg-black/40"
              onClick={handleUserPlay}
              aria-label={isPaused ? "Resume stream" : "Play stream"}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <Play className="h-8 w-8 text-white fill-white" />
              </span>
              {needsUserPlay && !isPaused && (
                <span className="text-sm text-white/90">Click to play live stream</span>
              )}
            </button>
          )}
        </>
      )}

      {usesIframe && source?.embedUrl && !playbackError && (
        <>
          {!iframeReady && iframePlaybackUrl && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          )}
          <div
            className={cn(
              "absolute inset-0 overflow-hidden bg-black",
              compact ? "" : "flex items-center justify-center",
            )}
          >
            {compact ? (
              iframePlaybackUrl ? (
                <iframe
                  key={`${iframePlaybackUrl}-${reloadKey}`}
                  src={iframePlaybackUrl}
                  title={title}
                  className={cn(
                    "absolute inset-0 h-full w-full border-0",
                    isIframeEmbed ? "pointer-events-auto" : "pointer-events-none",
                  )}
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture; microphone; camera; display-capture"
                  referrerPolicy="no-referrer-when-downgrade"
                  onLoad={() => {
                    setIframeReady(true);
                    setIsBuffering(false);
                  }}
                  onError={() => {
                    if (source?.meetingPlatform === "microsoft-teams") {
                      setMeetingIframeFailed(true);
                      setPlaybackError(false);
                      setIsBuffering(false);
                    }
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-black" aria-hidden />
              )
            ) : (
              <div className="relative h-full max-w-full aspect-video overflow-hidden">
                {iframePlaybackUrl ? (
                  <iframe
                    key={`${iframePlaybackUrl}-${reloadKey}`}
                    src={iframePlaybackUrl}
                    title={title}
                    className={cn(
                      "absolute inset-0 h-full w-full border-0",
                      isIframeEmbed ? "pointer-events-auto" : "pointer-events-none",
                    )}
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture; microphone; camera; display-capture"
                    referrerPolicy="no-referrer-when-downgrade"
                    onLoad={() => {
                      setIframeReady(true);
                      setIsBuffering(false);
                    }}
                    onError={() => {
                      if (source?.meetingPlatform === "microsoft-teams") {
                        setMeetingIframeFailed(true);
                        setPlaybackError(false);
                        setIsBuffering(false);
                      }
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-black" aria-hidden />
                )}
                <div
                  className="absolute inset-x-0 bottom-0 z-[15] bg-black pointer-events-none"
                  style={{ height: isIframeEmbed ? 0 : DRIVE_EMBED_CHROME }}
                  aria-hidden
                />
              </div>
            )}
          </div>
          {isPaused && !compact && (
            <button
              type="button"
              className="absolute inset-0 z-[25] flex flex-col items-center justify-center gap-3 bg-black/60"
              onClick={onResume}
              aria-label="Resume stream"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <Play className="h-8 w-8 text-white fill-white" />
              </span>
              <span className="text-sm text-white/90">Stream paused</span>
            </button>
          )}
        </>
      )}

      {usesExternalMeeting && meetingOpenUrl && !playbackError && (
        <>
          <img
            src={thumbnailUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/55 p-6 text-center">
            <div className="space-y-1">
              <p className="text-lg font-semibold text-white">{meetingPlatformLabel}</p>
              <p className="max-w-sm text-sm text-white/80">
                {source?.meetingPlatform === "google-meet"
                  ? "Google Meet live streams open in a new tab for the best viewing experience."
                  : "This Teams link opens in a new tab. Sign in with your Microsoft account if prompted."}
              </p>
            </div>
            <Button size="lg" onClick={openMeetingStream}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {source?.meetingPlatform === "microsoft-teams" ? "Join live meeting" : "Watch live"}
            </Button>
          </div>
          {isPaused && !compact && (
            <button
              type="button"
              className="absolute inset-0 z-[25] flex flex-col items-center justify-center gap-3 bg-black/60"
              onClick={onResume}
              aria-label="Resume stream"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <Play className="h-8 w-8 text-white fill-white" />
              </span>
              <span className="text-sm text-white/90">Stream paused</span>
            </button>
          )}
        </>
      )}

      {showThumbnail && (
        <>
          <img
            src={thumbnailUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {playbackError && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/70 p-6 text-center">
              <p className="text-sm text-white max-w-md">
                Unable to start the live stream in this browser. This can happen due to network
                restrictions, autoplay settings, or blocked video sources.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                {source?.embedUrl && (
                  <Button size="sm" variant="outline" className="text-white border-white/40" asChild>
                    <a href={source.embedUrl} target="_blank" rel="noopener noreferrer">
                      Open in new tab
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!compact && isLive && !isPaused && !playbackError && (usesVideo || usesExternalMeeting || (usesIframe && iframeReady)) && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
          <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        </div>
      )}

      {!compact && (showViewControls || (!usesIframe && !usesExternalMeeting)) && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent p-4",
            playbackError
              ? "opacity-100"
              : "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity",
          )}
        >          <div className="flex items-center justify-between gap-4">
            <p className="text-white text-sm font-medium truncate">{title}</p>
            <div className="flex items-center gap-1 shrink-0">
              {usesVideo && !playbackError && (
                <>
                  {isPaused || needsUserPlay ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={needsUserPlay ? handleUserPlay : onResume}
                      title={isPaused ? "Resume" : "Play"}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={onPause}
                      title="Pause"
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={onMute}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </>
              )}
              {showViewControls && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "h-8 w-8 text-white hover:bg-white/20",
                      viewMode === "default" && "bg-white/20",
                    )}
                    onClick={() => handleViewModeChange("default")}
                    title="Default view"
                    aria-pressed={viewMode === "default"}
                  >
                    <LayoutPanelLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "h-8 w-8 text-white hover:bg-white/20",
                      viewMode === "theater" && "bg-white/20",
                    )}
                    onClick={() => handleViewModeChange("theater")}
                    title="Theater view"
                    aria-pressed={viewMode === "theater"}
                  >
                    <RectangleHorizontal className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "h-8 w-8 text-white hover:bg-white/20",
                  isFullscreen && "bg-white/20",
                )}
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit full screen" : "Full screen"}
                aria-pressed={isFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

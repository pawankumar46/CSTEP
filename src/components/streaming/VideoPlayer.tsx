"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseStreamUrl, shouldPreferDriveEmbed, type StreamSource } from "@/lib/stream-utils";
import { LIVE_STREAM_FILE_ID } from "@/lib/constants";

const BUFFERING_TIMEOUT_MS = 20000;
const IFRAME_LOAD_TIMEOUT_MS = 20000;
/** Google Drive preview player chrome clipped from the embed (control bar, progress, title). */
const DRIVE_EMBED_CHROME = "4.5rem";

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
  fill?: boolean;
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
  fill = false,
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
  const [reloadKey, setReloadKey] = useState(0);
  const [iframeCoverScale, setIframeCoverScale] = useState(1);

  useEffect(() => {
    if (!streamUrl) {
      setSource(null);
      setIframeReady(false);
      setUseIframeFallback(false);
      setPlaybackError(false);
      setNeedsUserPlay(false);
      return;
    }

    setIframeReady(false);
    setIsBuffering(true);
    setPlaybackError(false);
    setNeedsUserPlay(false);
    const parsed = parseStreamUrl(streamUrl, LIVE_STREAM_FILE_ID);
    setSource(parsed);
    setUseIframeFallback(shouldPreferDriveEmbed(parsed));
  }, [streamUrl, reloadKey]);

  const isHlsStream = source?.type === "hls-stream";
  const usesIframe =
    source?.type === "google-drive-file" && Boolean(source.embedUrl) && useIframeFallback;
  const usesVideo =
    (source?.type === "direct-video" && Boolean(source.directUrl)) ||
    (isHlsStream && Boolean(source.directUrl)) ||
    (source?.type === "google-drive-file" && Boolean(source.directUrl) && !useIframeFallback);

  const playbackUrl = usesVideo ? source?.directUrl : undefined;
  const iframePlaybackUrl =
    usesIframe && source?.embedUrl && !isPaused ? source.embedUrl : undefined;

  const updateIframeCoverScale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { width, height } = el.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;

    const videoHeightAtFullWidth = width * (9 / 16);
    const scale = Math.max(1, height / videoHeightAtFullWidth) * 1.05;
    setIframeCoverScale(scale);
  }, []);

  useEffect(() => {
    if (!usesIframe || !iframePlaybackUrl) return;

    const el = containerRef.current;
    if (!el) return;

    updateIframeCoverScale();
    const observer = new ResizeObserver(updateIframeCoverScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, [usesIframe, iframePlaybackUrl, reloadKey, updateIframeCoverScale]);

  const tryPlayVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return false;

    video.muted = isMuted;
    try {
      await video.play();
      setNeedsUserPlay(false);
      setPlaybackError(false);
      setIsBuffering(false);
      return true;
    } catch {
      setNeedsUserPlay(true);
      return false;
    }
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl || isHlsStream) return;

    video.muted = isMuted;

    if (isPaused) {
      video.pause();
      return;
    }

    void tryPlayVideo();
  }, [isPaused, isMuted, playbackUrl, tryPlayVideo, isHlsStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isHlsStream || !playbackUrl || playbackError) return;

    let hls: Hls | null = null;
    let cancelled = false;

    const startPlayback = async () => {
      video.muted = isMuted;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = playbackUrl;
      } else if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(playbackUrl);
        hls.attachMedia(video);
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
  }, [isHlsStream, playbackUrl, reloadKey, playbackError, isMuted, isPaused, tryPlayVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isHlsStream) return;

    video.muted = isMuted;
    if (isPaused) {
      video.pause();
      return;
    }

    if (!playbackError) {
      void tryPlayVideo();
    }
  }, [isPaused, isMuted, isHlsStream, playbackError, tryPlayVideo]);

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
      setPlaybackError(true);
      setIsBuffering(false);
    }, IFRAME_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [usesIframe, iframeReady, iframePlaybackUrl]);

  const showThumbnail = !streamUrl || playbackError || (!usesIframe && !usesVideo);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen();
    }
  };

  const handleUserPlay = async () => {
    onResume?.();
    const played = await tryPlayVideo();
    if (!played && source?.type === "google-drive-file" && source.embedUrl) {
      setUseIframeFallback(true);
    }
  };

  const handleRetry = () => {
    setReloadKey((key) => key + 1);
  };

  const handleVideoCanPlay = () => {
    const video = videoRef.current;
    if (!video || isPaused) {
      setIsBuffering(false);
      return;
    }

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

  const showPlayOverlay = usesVideo && (needsUserPlay || isPaused) && !playbackError;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full bg-black overflow-hidden group",
        fill ? "h-full" : "aspect-video rounded-xl",
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
            className="absolute inset-0 h-full w-full object-cover bg-black"
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
          <div className="absolute inset-0 overflow-hidden">
            {iframePlaybackUrl ? (
              <iframe
                key={`${iframePlaybackUrl}-${reloadKey}`}
                src={iframePlaybackUrl}
                title={title}
                className="pointer-events-none absolute left-1/2 top-1/2 aspect-video w-full h-auto border-0"
                style={{
                  transform: `translate(-50%, calc(-50% - 0.75rem)) scale(${iframeCoverScale})`,
                  transformOrigin: "center center",
                }}
                allow="autoplay; encrypted-media; fullscreen"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => {
                  setIframeReady(true);
                  setIsBuffering(false);
                  updateIframeCoverScale();
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-black" aria-hidden />
            )}
            <div
              className="absolute inset-x-0 bottom-0 z-[15] bg-black pointer-events-none"
              style={{ height: DRIVE_EMBED_CHROME }}
              aria-hidden
            />
          </div>
          {isPaused && (
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

      {isLive && !isPaused && !playbackError && (usesVideo || (usesIframe && iframeReady)) && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
          <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        </div>
      )}

      {!usesIframe && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent p-4",
            playbackError ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity",
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-white text-sm font-medium truncate">{title}</p>
            <div className="flex items-center gap-2 shrink-0">
              {usesVideo && !playbackError && (
                <>
                  {isPaused || needsUserPlay ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={needsUserPlay ? handleUserPlay : onResume}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={onPause}>
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={onMute}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

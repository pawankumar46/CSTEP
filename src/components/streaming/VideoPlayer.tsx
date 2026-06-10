"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseStreamUrl, type StreamSource } from "@/lib/stream-utils";

interface VideoPlayerProps {
  streamUrl?: string;
  isLive?: boolean;
  isPaused?: boolean;
  isMuted?: boolean;
  thumbnailUrl?: string;
  title?: string;
  onPause?: () => void;
  onResume?: () => void;
  onMute?: () => void;
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
  className,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState<StreamSource | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  useEffect(() => {
    if (!streamUrl) {
      setSource(null);
      setIframeReady(false);
      setUseIframeFallback(false);
      return;
    }

    setIframeReady(false);
    setUseIframeFallback(false);
    setIsBuffering(true);
    setSource(parseStreamUrl(streamUrl));
  }, [streamUrl]);

  const usesIframe =
    source?.type === "google-drive-file" && Boolean(source.embedUrl) && useIframeFallback;
  const usesVideo =
    (source?.type === "direct-video" && Boolean(source.directUrl)) ||
    (source?.type === "google-drive-file" && Boolean(source.directUrl) && !useIframeFallback);

  const playbackUrl = usesVideo ? source?.directUrl : undefined;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl) return;

    video.muted = isMuted;

    if (isPaused) {
      video.pause();
      return;
    }

    void video.play().catch(() => undefined);
  }, [isPaused, isMuted, playbackUrl]);

  const showThumbnail = !streamUrl || (!usesIframe && !usesVideo);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen();
    }
  };

  const handleVideoCanPlay = () => {
    setIsBuffering(false);
    const video = videoRef.current;
    if (!video || isPaused) return;
    video.muted = isMuted;
    void video.play().catch(() => setUseIframeFallback(true));
  };

  const handleVideoError = () => {
    if (source?.type === "google-drive-file" && source.embedUrl) {
      setUseIframeFallback(true);
      setIsBuffering(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full aspect-video bg-black rounded-xl overflow-hidden group", className)}
    >
      {usesVideo && playbackUrl && (
        <>
          {isBuffering && !isPaused && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          )}
          <video
            ref={videoRef}
            key={playbackUrl}
            src={playbackUrl}
            className="absolute inset-0 h-full w-full object-contain bg-black"
            autoPlay
            playsInline
            controls={false}
            muted={isMuted}
            preload="auto"
            onCanPlay={handleVideoCanPlay}
            onPlaying={() => setIsBuffering(false)}
            onWaiting={() => !isPaused && setIsBuffering(true)}
            onError={handleVideoError}
          />
          {isPaused && (
            <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/25 pointer-events-none">
              <Pause className="h-16 w-16 text-white/80" />
            </div>
          )}
        </>
      )}

      {usesIframe && source?.embedUrl && (
        <>
          {!iframeReady && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          )}
          <div className={cn("absolute inset-0 overflow-hidden", isPaused && "pointer-events-none")}>
            <iframe
              src={source.embedUrl}
              title={title}
              className="absolute left-0 top-0 w-full border-0"
              style={{ height: "calc(100% + 6rem)" }}
              allow="autoplay; encrypted-media"
              onLoad={() => setIframeReady(true)}
            />
          </div>
          {!isPaused && (
            <div
              className="absolute bottom-0 left-0 right-0 z-[15] h-24 bg-black pointer-events-auto"
              aria-hidden
            />
          )}
          {isPaused && (
            <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/25 pointer-events-none">
              <Pause className="h-16 w-16 text-white/80" />
            </div>
          )}
        </>
      )}

      {showThumbnail && (
        <img
          src={thumbnailUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {isLive && !isPaused && (usesVideo || (usesIframe && iframeReady)) && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
          <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        </div>
      )}

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent p-4",
          usesIframe ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-white text-sm font-medium truncate">{title}</p>
          <div className="flex items-center gap-2 shrink-0">
            {(usesVideo || usesIframe) && (
              <>
                {isPaused ? (
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={onResume}>
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
    </div>
  );
}

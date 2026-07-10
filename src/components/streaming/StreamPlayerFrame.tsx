"use client";

import { cn } from "@/lib/utils";
import { THEATER_PLAYER_CLASS, type StreamViewMode } from "@/lib/stream-view";
import { VideoPlayer, type VideoPlayerProps } from "@/components/streaming/VideoPlayer";

interface StreamPlayerFrameProps extends VideoPlayerProps {
  leftBannerUrl?: string;
  rightBannerUrl?: string;
  leftBannerAlt?: string;
  rightBannerAlt?: string;
  className?: string;
}

const BANNER_COLUMN_CLASS =
  "hidden md:block w-full h-auto object-contain bg-sky-50 dark:bg-slate-900";

export function StreamPlayerFrame({
  leftBannerUrl,
  rightBannerUrl,
  leftBannerAlt = "Event sponsor banner",
  rightBannerAlt = "Event sponsor banner",
  viewMode = "default",
  className,
  ...playerProps
}: StreamPlayerFrameProps) {
  const isTheater = viewMode === "theater";
  const showBanners = Boolean(leftBannerUrl || rightBannerUrl) && !isTheater;

  if (!showBanners) {
    return (
      <VideoPlayer
        {...playerProps}
        viewMode={viewMode}
        className={cn(
          "w-full rounded-xl transition-all duration-300 ease-in-out",
          isTheater ? THEATER_PLAYER_CLASS : "aspect-video",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid w-full items-stretch overflow-hidden rounded-xl transition-all duration-300 ease-in-out",
        "md:grid-cols-[6rem_1fr_6rem] lg:grid-cols-[8rem_1fr_8rem] xl:grid-cols-[9rem_1fr_9rem]",
        className,
      )}
    >
      {leftBannerUrl ? (
        <img
          src={leftBannerUrl}
          alt={leftBannerAlt}
          className={BANNER_COLUMN_CLASS}
          aria-hidden
        />
      ) : (
        <div className="hidden md:block" />
      )}

      <div className="relative min-w-0 aspect-video min-h-0 bg-black">
        <VideoPlayer {...playerProps} viewMode={viewMode} fill className="absolute inset-0 rounded-none" />
      </div>

      {rightBannerUrl ? (
        <img
          src={rightBannerUrl}
          alt={rightBannerAlt}
          className={BANNER_COLUMN_CLASS}
          aria-hidden
        />
      ) : (
        <div className="hidden md:block" />
      )}
    </div>
  );
}

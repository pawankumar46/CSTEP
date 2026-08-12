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

/** Keeps a visible 16:9 box on mobile even when the video is position:absolute. */
const PLAYER_SHELL_CLASS =
  "relative w-full min-w-0 overflow-hidden bg-black aspect-video min-h-[12.5rem] sm:min-h-[15rem]";

const BANNER_CLASS =
  "hidden md:block h-full w-24 shrink-0 object-contain bg-sky-50 dark:bg-slate-900 lg:w-32 xl:w-36";

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
      <div
        className={cn(
          "w-full overflow-hidden rounded-xl",
          isTheater ? THEATER_PLAYER_CLASS : PLAYER_SHELL_CLASS,
          className,
        )}
      >
        <VideoPlayer
          {...playerProps}
          viewMode={viewMode}
          fill
          className="absolute inset-0 rounded-none"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-stretch overflow-hidden rounded-xl",
        className,
      )}
    >
      {leftBannerUrl ? (
        <img
          src={leftBannerUrl}
          alt={leftBannerAlt}
          className={BANNER_CLASS}
          aria-hidden
        />
      ) : null}

      <div className={cn(PLAYER_SHELL_CLASS, "min-h-0")}>
        <VideoPlayer
          {...playerProps}
          viewMode={viewMode}
          fill
          className="absolute inset-0 rounded-none"
        />
      </div>

      {rightBannerUrl ? (
        <img
          src={rightBannerUrl}
          alt={rightBannerAlt}
          className={BANNER_CLASS}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

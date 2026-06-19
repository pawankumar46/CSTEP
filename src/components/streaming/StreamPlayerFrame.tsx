"use client";

import { cn } from "@/lib/utils";
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
  className,
  ...playerProps
}: StreamPlayerFrameProps) {
  const showBanners = Boolean(leftBannerUrl || rightBannerUrl);

  if (!showBanners) {
    return <VideoPlayer {...playerProps} className={className} />;
  }

  return (
    <div
      className={cn(
        "grid w-full items-stretch overflow-hidden rounded-xl",
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

      {/* Row height on desktop comes from banner images; video stretches to the same height */}
      <div className="relative min-w-0 aspect-video bg-black md:aspect-auto md:h-full">
        <VideoPlayer {...playerProps} fill className="rounded-none" />
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

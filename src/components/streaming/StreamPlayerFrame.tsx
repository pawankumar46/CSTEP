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

function StreamBanner({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <aside className="relative hidden md:block h-full min-h-0 overflow-hidden bg-muted" aria-hidden>
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover object-center" />
    </aside>
  );
}

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
        "grid w-full overflow-hidden rounded-xl md:grid-cols-[4rem_1fr_4rem] lg:grid-cols-[6rem_1fr_6rem]",
        className,
      )}
    >
      {leftBannerUrl ? <StreamBanner src={leftBannerUrl} alt={leftBannerAlt} /> : <div className="hidden md:block" />}
      <div className="relative aspect-video min-w-0 bg-black">
        <VideoPlayer {...playerProps} fill className="rounded-none" />
      </div>
      {rightBannerUrl ? <StreamBanner src={rightBannerUrl} alt={rightBannerAlt} /> : <div className="hidden md:block" />}
    </div>
  );
}

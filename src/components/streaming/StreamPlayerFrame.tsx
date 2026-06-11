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
  fit = "cover",
  blurred = true,
  className,
}: {
  src: string;
  alt: string;
  fit?: "cover" | "contain";
  blurred?: boolean;
  className?: string;
}) {
  if (fit === "contain") {
    return (
      <aside
        className={cn(
          "relative hidden h-full min-h-0 md:block",
          className,
        )}
        aria-hidden
      >
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-contain object-center p-1.5"
        />
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "relative hidden h-full min-h-0 overflow-hidden bg-muted md:block",
        className,
      )}
      aria-hidden
    >
      <img
        src={src}
        alt={alt}
        className={cn(
          "absolute inset-0 h-full w-full scale-110 object-cover object-center",
          blurred && "blur-md",
        )}
      />
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
        "grid w-full items-stretch overflow-hidden rounded-xl",
        "md:grid-cols-[6rem_1fr_6rem] lg:grid-cols-[8rem_1fr_8rem] xl:grid-cols-[9rem_1fr_9rem]",
        className,
      )}
    >
      {leftBannerUrl ? (
        <StreamBanner
          src={leftBannerUrl}
          alt={leftBannerAlt}
          fit="contain"
          blurred={false}
          className="bg-sky-50 dark:bg-slate-900"
        />
      ) : (
        <div className="hidden md:block" />
      )}
      <div className="relative aspect-video min-w-0 bg-black">
        <VideoPlayer {...playerProps} fill className="rounded-none" />
      </div>
      {rightBannerUrl ? (
        <StreamBanner
          src={rightBannerUrl}
          alt={rightBannerAlt}
          fit="contain"
          blurred={false}
          className="bg-sky-50 dark:bg-slate-900"
        />
      ) : (
        <div className="hidden md:block" />
      )}
    </div>
  );
}

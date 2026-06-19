"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWatchLiveAccess } from "@/hooks/useWatchLiveAccess";
import { buildAuthUrl, ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Event } from "@/types";
import type { ComponentProps } from "react";

interface WatchLiveButtonProps {
  event?: Pick<Event, "date" | "endDate" | "status"> | null;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
  showIcon?: boolean;
}

export function WatchLiveButton({
  event,
  size = "lg",
  variant = "outline",
  className,
  showIcon = true,
}: WatchLiveButtonProps) {
  const { canWatchLive, disabledTitle, showSignInToWatch } = useWatchLiveAccess(event);

  const label = (
    <>
      {showIcon && <Play className="h-4 w-4 mr-2 fill-current" />}
      Watch Live
    </>
  );

  if (canWatchLive) {
    return (
      <Button size={size} variant={variant} className={className} asChild>
        <Link href={ROUTES.streaming}>{label}</Link>
      </Button>
    );
  }

  if (showSignInToWatch) {
    return (
      <Button size={size} variant={variant} className={cn(className)} asChild>
        <Link href={buildAuthUrl(ROUTES.login, { redirect: ROUTES.streaming })}>
          {label}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      disabled
      title={disabledTitle}
    >
      {label}
    </Button>
  );
}

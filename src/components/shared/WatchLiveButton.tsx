"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWatchLiveAccess } from "@/hooks/useWatchLiveAccess";
import { joinEventFromClient } from "@/lib/location-permission";
import { getLiveEventStream } from "@/services/broadcast.service";
import { buildAuthUrl, ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Event } from "@/types";
import type { ComponentProps } from "react";

interface WatchLiveButtonProps {
  event?: Pick<Event, "id" | "date" | "endDate" | "status"> | null;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
  showIcon?: boolean;
  onNavigate?: () => void;
}

export function WatchLiveButton({
  event,
  size = "lg",
  variant = "outline",
  className,
  showIcon = true,
  onNavigate,
}: WatchLiveButtonProps) {
  const router = useRouter();
  const { canWatchLive, disabledTitle, showSignInToWatch, showRegisterToWatch } = useWatchLiveAccess(event);
  const [joining, setJoining] = useState(false);

  const label = (
    <>
      {joining ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        showIcon && <Play className="h-4 w-4 mr-2 fill-current" />
      )}
      Watch Live
    </>
  );

  const handleWatchLive = async () => {
    if (joining) return;
    setJoining(true);
    try {
      await joinEventFromClient(event?.id);
      // Prefetch event cameras (GET /events/event/:id/ → broadcast_sessions.playback_url).
      if (event?.id) {
        await getLiveEventStream(event.id).catch(() => undefined);
      }
    } finally {
      setJoining(false);
      onNavigate?.();
      router.push(ROUTES.streaming);
    }
  };

  if (canWatchLive) {
    return (
      <Button
        size={size}
        variant={variant}
        className={className}
        disabled={joining}
        onClick={() => void handleWatchLive()}
      >
        {label}
      </Button>
    );
  }

  if (showSignInToWatch) {
    return (
      <Button size={size} variant={variant} className={cn(className)} asChild>
        <Link href={buildAuthUrl(ROUTES.login, { redirect: ROUTES.streaming })}>
          {showIcon && <Play className="h-4 w-4 mr-2 fill-current" />}
          Watch Live
        </Link>
      </Button>
    );
  }

  if (showRegisterToWatch) {
    return (
      <span title={disabledTitle} className={cn("inline-flex", className)}>
        <Button size={size} variant={variant} asChild>
          <Link href={ROUTES.eventRegister}>
            {showIcon && <Play className="h-4 w-4 mr-2 fill-current" />}
            Watch Live
          </Link>
        </Button>
      </span>
    );
  }

  return (
    <span title={disabledTitle} className={cn("inline-flex", className)}>
      <Button
        size={size}
        variant={variant}
        className="pointer-events-none"
        disabled
      >
        {showIcon && <Play className="h-4 w-4 mr-2 fill-current" />}
        Watch Live
      </Button>
    </span>
  );
}

"use client";

import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LiveBroadcastCamera } from "@/services/broadcast.service";

interface StreamCameraPickerProps {
  cameras: LiveBroadcastCamera[];
  selectedId: string | null;
  onSelect: (camera: LiveBroadcastCamera) => void;
  className?: string;
}

export function StreamCameraPicker({
  cameras,
  selectedId,
  onSelect,
  className,
}: StreamCameraPickerProps) {
  if (cameras.length <= 1) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Video className="h-4 w-4 shrink-0" aria-hidden />
        <span className="font-medium text-foreground">Cameras</span>
        <span className="text-xs">Choose a live feed</span>
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Live cameras"
      >
        {cameras.map((camera) => {
          const selected = camera.id === selectedId;
          return (
            <Button
              key={camera.id}
              type="button"
              role="tab"
              aria-selected={selected}
              size="sm"
              variant={selected ? "default" : "outline"}
              className={cn(
                "shrink-0 transition-colors",
                selected && "shadow-sm",
              )}
              onClick={() => onSelect(camera)}
            >
              {camera.name}
              {camera.isPrimary ? (
                <span className="ml-1.5 text-[10px] opacity-80">Primary</span>
              ) : null}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
